export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Grocery from "@/app/models/grocery.model";
import Hub from "@/app/models/hub.model";
import Interaction from "@/app/models/interaction.model";
import User from "@/app/models/user.model";
import { auth } from "@/auth";
import redis from "@/lib/redis"; 
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const session = await auth();
        const userId = session?.user?.id || 'guest';
        
        const { searchParams } = new URL(req.url);
        
        // --- PARAMS ---
        const lat = parseFloat(searchParams.get('lat') || "0");
        const lng = parseFloat(searchParams.get('lng') || "0");
        const mode = searchParams.get('mode') || 'grocery'; 
        const page = parseInt(searchParams.get('page') || "1"); 
        const limit = 20;
        const forceRefresh = searchParams.get('refresh') === 'true';
        
        const sortOption = searchParams.get('sort') || 'relevance';
        const minPrice = parseFloat(searchParams.get('minPrice') || "0");
        const maxPrice = parseFloat(searchParams.get('maxPrice') || "100000");
        const minRating = parseFloat(searchParams.get('minRating') || "0");
        
        // Decode Category Param safely
        const rawCategory = searchParams.get('category') || "";
        const categoryParam = rawCategory ? decodeURIComponent(rawCategory) : "";

        const minDiscount = parseFloat(searchParams.get('minDiscount') || "0");
        
        // --- A/B TESTING ---
        const userHash = userId.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const group = userHash % 2 === 0 ? 'A' : 'B';
        const chaosAmount = group === 'A' ? 0.4 : 0.1; 

        // If no GPS and no hub, use Central India as a fallback so new users can see the feed
        const effectiveLat = lat || 22.9734;
        const effectiveLng = lng || 78.6569;
        if (!lat) {
            // Replace lat/lng with fallback but keep searching
            (searchParams as any).set?.('lat', effectiveLat.toString());
            (searchParams as any).set?.('lng', effectiveLng.toString());
        }

        // ==========================================================
        // 🧠 STEP 1: FETCH AI PREDICTIONS (Based on Mode)
        // ==========================================================
        let aiProductIds: string[] = [];
        let aiProducts: any[] = [];

        // Only fetch AI if we are on page 1 and NOT filtering by category
        if (page === 1 && sortOption === 'relevance' && !categoryParam && userId !== 'guest') {
            try {
                const redisSuffix = mode === 'student' ? 'student' : 'grocery';
                const redisKey = `user:rec:${userId}:${redisSuffix}`;
                
                // 🔥 FIXED: Fetch 10 items (0 to 9) instead of 5 (0 to 4)
                aiProductIds = await redis.lrange(redisKey, 0, 9);
                
                if (aiProductIds && aiProductIds.length > 0) {
                    aiProducts = await Grocery.find({ _id: { $in: aiProductIds } });
                    
                    // Maintain Redis Order
                    aiProducts = aiProductIds
                        .map(id => aiProducts.find(p => p._id.toString() === id))
                        .filter(Boolean)
                        .map(p => ({
                            ...p!.toObject(),
                            isAiRecommendation: true // Frontend uses this to filter suggested rail
                        }));
                }
            } catch (error) {
                console.error("⚠️ AI Redis Fetch Error (Ignoring):", error);
            }
        }

        // ==========================================================
        // 🌍 STEP 2: GEO & INTEREST AGGREGATION
        // ==========================================================
        const cacheKey = `feed:${userId}:${mode}:${Math.round(lat*100)}:${Math.round(lng*100)}:${sortOption}:${categoryParam}:${minDiscount}`;

        // 1. CHECK FEED CACHE
        const useCache = sortOption === 'relevance' && minPrice === 0 && minRating === 0 && categoryParam === "" && minDiscount === 0;
        let cachedData = null;
        if (useCache && !forceRefresh) {
            try {
                cachedData = await redis.get(cacheKey);
            } catch (e) {
                console.error("⚠️ Redis Get Error (Ignoring):", e);
            }
        }

        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            if (parsed.length > 0 && typeof parsed[0] === 'object') {
                // If it's the new cached full objects
                const startIndex = (page - 1) * limit;
                const pageProducts = parsed.slice(startIndex, startIndex + limit);
                return NextResponse.json({ success: true, products: pageProducts, hasMore: pageProducts.length === limit });
            }
        }

        // --- CACHE MISS: RUN HEAVY AGGREGATION ---
        
        // A. User Interests
        let userTopCategories: string[] = [];
        if (session?.user?.id) {
            try {
                const topInterests = await Interaction.aggregate([
                    { $match: { user: new mongoose.Types.ObjectId(session.user.id) } },
                    { $sort: { createdAt: -1 } },
                    { $limit: 50 },
                    { $group: { _id: "$category", count: { $sum: "$score" } } },
                    { $sort: { count: -1 } },
                    { $limit: 5 }
                ]);
                userTopCategories = topInterests.map(i => i._id);
            } catch (e) { /* Ignore Interest Error */ }
        }

        // B. Find Hub & Sellers (ELIMINATES $lookup N+1 QUERY)
        const radiusParam = searchParams.get('radius');
        // Increase max distance to 50km so users outside the delivery zone can still see the feed
        const maxDistanceMeters = radiusParam ? parseFloat(radiusParam) * 1000 : 50000;
        
        let activeHub = null;
        let searchLng = effectiveLng;
        let searchLat = effectiveLat;
        let activeMaxDistance = maxDistanceMeters;

        if ((session?.user as any)?.connectedHub) {
            activeHub = await Hub.findById((session?.user as any).connectedHub);
        }
        
        if (!activeHub) {
            activeHub = await Hub.findOne({
                location: { $near: { $geometry: { type: "Point", coordinates: [effectiveLng, effectiveLat] }, $maxDistance: maxDistanceMeters } }
            });
        } else if (activeHub.location?.coordinates) {
            // If connected to a hub, search from the Hub's center so products always appear
            // regardless of the user's physical GPS distance
            searchLng = activeHub.location.coordinates[0];
            searchLat = activeHub.location.coordinates[1];
            // Set distance to practically infinity so all products belonging to this hub are shown
            activeMaxDistance = 100000000; // 100,000 km
        }

        // Hub is required to serve the area
        if (!activeHub) return NextResponse.json({ success: true, products: [] });

        // C. Build Match Filters
        const typeFilter = mode === 'student' ? { productType: 'book' } : { productType: { $ne: 'book' } };
        
        // Exclude AI items from main feed to prevent duplicates
        const excludeIds = aiProductIds.map(id => new mongoose.Types.ObjectId(id));

        const matchStage: any = {
            _id: { $nin: excludeIds }, 
            $and: [
                { $or: [{ retailPrice: { $gte: minPrice, $lte: maxPrice } }, { price: { $gte: minPrice, $lte: maxPrice } }] },
                { $or: [{ averageRating: { $gte: minRating } }, { averageRating: { $exists: false } }] }
            ]
        };

        if (activeHub) {
            const connectedSellers = await User.find({ connectedHub: activeHub._id, role: 'seller' }).select('_id');
            const validSellerIds = connectedSellers.map(s => s._id);
            if (activeHub.managerId) {
                validSellerIds.push(activeHub.managerId);
            } else {
                validSellerIds.push(activeHub._id);
            }
            matchStage.seller = { $in: validSellerIds };
        }

        // Case-Insensitive Category Match
        if (categoryParam) {
            const safeCategory = categoryParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            matchStage.category = { $regex: new RegExp(`^${safeCategory}$`, "i") };
        }

        // D. Pipeline - FULLY NATIVE DB PROCESSING
        const startIndex = (page - 1) * limit;

        const pipeline: any[] = [
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [searchLng, searchLat] },
                    distanceField: "distance",
                    maxDistance: activeMaxDistance,
                    spherical: true,
                    key: "location",
                    query: { ...typeFilter, status: { $ne: 'outofstock' } }
                }
            },
            { $limit: 1000 }, // CAPPED to prevent DB CPU spikes
            { $match: matchStage } // Filter by approved sellers & criteria
        ];

        // Discount Logic
        if (minDiscount > 0 || sortOption === 'discount_desc') {
            pipeline.push({
                $addFields: {
                    calculatedDiscount: {
                        $let: {
                            vars: { mrp: { $convert: { input: "$bookDetails.printedPrice", to: "double", onError: 0, onNull: 0 } } },
                            in: { $cond: { if: { $gt: ["$$mrp", 0] }, then: { $multiply: [{ $divide: [{ $subtract: ["$$mrp", "$retailPrice"] }, "$$mrp"] }, 100] }, else: 0 } }
                        }
                    }
                }
            });
            if (minDiscount > 0) pipeline.push({ $match: { calculatedDiscount: { $gte: minDiscount } } });
        }

        // E. Sorting
        if (sortOption === 'relevance') {
            pipeline.push(
                {
                    $addFields: {
                        recencyScore: { $divide: [1, { $add: [1, { $divide: [{ $divide: [{ $subtract: [new Date(), "$createdAt"] }, 3600000] }, 24] }] }] },
                        distanceScore: { $subtract: [1, { $divide: ["$distance", maxDistanceMeters] }] },
                        ratingScore: { $divide: [{ $ifNull: ["$averageRating", 3.5] }, 5] },
                        interestScore: { $cond: { if: { $in: ["$category", userTopCategories] }, then: 1.0, else: 0.0 } },
                        randomScore: { $rand: {} }
                    }
                },
                {
                    $addFields: {
                        finalScore: {
                            $add: [
                                { $multiply: ["$recencyScore", 0.25] },
                                { $multiply: ["$distanceScore", 0.15] },
                                { $multiply: ["$ratingScore", 0.15] },
                                { $multiply: ["$interestScore", 0.15] }, 
                                { $multiply: ["$randomScore", chaosAmount] } 
                            ]
                        }
                    }
                },
                { $sort: { finalScore: -1 } }
            );
        } else {
            if (sortOption === 'price_asc') pipeline.push({ $sort: { retailPrice: 1 } });
            else if (sortOption === 'price_desc') pipeline.push({ $sort: { retailPrice: -1 } });
            else if (sortOption === 'newest') pipeline.push({ $sort: { createdAt: -1 } });
            else if (sortOption === 'discount_desc') pipeline.push({ $sort: { calculatedDiscount: -1 } });
        }

        // F. NATIVE DB PAGINATION (NO N+1 QUERIES)
        pipeline.push({ $skip: startIndex });
        pipeline.push({ $limit: limit });

        const geoProducts = await Grocery.aggregate(pipeline);

        if (useCache && geoProducts.length > 0) {
            try {
                // Cache the full objects if it's the first page
                if (page === 1) {
                    await redis.set(cacheKey, JSON.stringify(geoProducts), 'EX', 3600);
                }
            } catch (e) {
                console.error("⚠️ Redis Set Error (Ignoring):", e);
            }
        }

        // ==========================================================
        // 🚀 STEP 3: MERGE & RETURN
        // ==========================================================
        const hasMore = geoProducts.length === limit;

        let finalFeed = [];

        // Apply Cloudinary Optimizations for Rural Bandwidth
        finalFeed = (page === 1 && !categoryParam ? [...aiProducts, ...geoProducts] : geoProducts).map(product => {
            const p = product.toObject ? product.toObject() : product;
            if (p.images && p.images.length > 0) {
                p.images = p.images.map((img: string) => img.includes('cloudinary.com') ? img.replace('/upload/', '/upload/q_auto,f_auto,w_500/') : img);
            }
            return p;
        });

        return NextResponse.json({ 
            success: true, 
            products: finalFeed,
            hasMore,
            group 
        });

    } catch (error: any) {
        console.error("❌ Feed Route Crash:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}