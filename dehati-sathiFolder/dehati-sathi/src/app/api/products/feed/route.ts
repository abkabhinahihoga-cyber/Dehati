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
        
        const rawCategory = searchParams.get('category') || "";
        const categoryParam = rawCategory ? decodeURIComponent(rawCategory) : "";
        const minDiscount = parseFloat(searchParams.get('minDiscount') || "0");
        
        const userHash = userId.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const group = userHash % 2 === 0 ? 'A' : 'B';
        const chaosAmount = group === 'A' ? 0.4 : 0.1; 

        const effectiveLat = lat || 22.9734;
        const effectiveLng = lng || 78.6569;
        if (!lat) {
            (searchParams as any).set?.('lat', effectiveLat.toString());
            (searchParams as any).set?.('lng', effectiveLng.toString());
        }

        let aiProductIds: string[] = [];
        let aiProducts: any[] = [];

        if (page === 1 && sortOption === 'relevance' && !categoryParam && userId !== 'guest') {
            try {
                const redisSuffix = mode === 'student' ? 'student' : 'grocery';
                const redisKey = `user:rec:${userId}:${redisSuffix}`;
                
                aiProductIds = await redis.lrange(redisKey, 0, 9);
                
                if (aiProductIds && aiProductIds.length > 0) {
                    aiProducts = await Grocery.find({ _id: { $in: aiProductIds } });
                    aiProducts = aiProductIds
                        .map(id => aiProducts.find(p => p._id.toString() === id))
                        .filter(Boolean)
                        .map(p => ({
                            ...p!.toObject(),
                            isAiRecommendation: true
                        }));
                }
            } catch (error) {
                console.error("AI Redis Fetch Error (Ignoring):", error);
            }
        }

        // CRITICAL: Include connectedHub in cache key to prevent stale geo cache for hub-connected users
        const connectedHubId = (session?.user as any)?.connectedHub || 'none';
        const cacheKey = `feed:${userId}:${mode}:${connectedHubId}:${Math.round(lat*100)}:${Math.round(lng*100)}:${sortOption}:${categoryParam}:${minDiscount}`;
        const useCache = sortOption === 'relevance' && minPrice === 0 && minRating === 0 && categoryParam === "" && minDiscount === 0;
        let cachedData = null;
        if (useCache && !forceRefresh) {
            try {
                cachedData = await redis.get(cacheKey);
            } catch (e) { }
        }

        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            if (parsed.length > 0 && typeof parsed[0] === 'object') {
                const startIndex = (page - 1) * limit;
                const pageProducts = parsed.slice(startIndex, startIndex + limit);
                return NextResponse.json({ success: true, products: pageProducts, hasMore: pageProducts.length === limit });
            }
        }

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
            } catch (e) { }
        }

        const radiusParam = searchParams.get('radius');
        const maxDistanceMeters = radiusParam ? parseFloat(radiusParam) * 1000 : 50000;
        
        let activeHub: any = null;
        let searchLng = effectiveLng;
        let searchLat = effectiveLat;
        let activeMaxDistance = maxDistanceMeters;
        let isHubConnected = false; // Track if user explicitly connected to a hub

        if ((session?.user as any)?.connectedHub) {
            activeHub = await Hub.findById((session?.user as any).connectedHub);
            if (activeHub) isHubConnected = true;
        }
        
        // Only fall back to geo-discovery if user has NO connected hub
        if (!activeHub && !isHubConnected) {
            activeHub = await Hub.findOne({
                location: { $near: { $geometry: { type: "Point", coordinates: [effectiveLng, effectiveLat] }, $maxDistance: maxDistanceMeters } }
            });
        } else if (activeHub && activeHub.location?.coordinates) {
            searchLng = activeHub.location.coordinates[0];
            searchLat = activeHub.location.coordinates[1];
            activeMaxDistance = 100000000;
        }

        // If hub-connected user's hub not found, return empty (not geo fallback)
        if (isHubConnected && !activeHub) return NextResponse.json({ success: true, products: [] });
        if (!activeHub) return NextResponse.json({ success: true, products: [] });

        const typeFilter = mode === 'student' ? { productType: 'book' } : { productType: { $ne: 'book' } };
        const excludeIds = aiProductIds.map(id => new mongoose.Types.ObjectId(id));

        const matchStage: any = {
            _id: { $nin: excludeIds }, 
            status: { $ne: 'outofstock' },
            ...typeFilter,
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
            }
            validSellerIds.push(activeHub._id);
            // STRICT: Always filter by hub sellers - never allow geo fallback
            matchStage.seller = { $in: validSellerIds };
        }

        if (categoryParam) {
            const safeCategory = categoryParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            matchStage.category = { $regex: new RegExp(`^${safeCategory}$`, "i") };
        }

        const startIndex = (page - 1) * limit;
        const pipeline: any[] = [];

        // Skip geoNear entirely if we have an activeHub, preventing location-less products from being dropped
        if (activeHub) {
            pipeline.push({ $match: matchStage });
        } else {
            pipeline.push(
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
                { $limit: 1000 },
                { $match: matchStage }
            );
        }

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

        if (sortOption === 'relevance') {
            pipeline.push(
                {
                    $addFields: {
                        recencyScore: { $divide: [1, { $add: [1, { $divide: [{ $divide: [{ $subtract: [new Date(), "$createdAt"] }, 3600000] }, 24] }] }] },
                        distanceScore: { $cond: { if: { $isNumber: "$distance" }, then: { $subtract: [1, { $divide: ["$distance", maxDistanceMeters] }] }, else: 1 } },
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

        pipeline.push({ $skip: startIndex });
        pipeline.push({ $limit: limit });

        const geoProducts = await Grocery.aggregate(pipeline);

        if (useCache && geoProducts.length > 0) {
            try {
                if (page === 1) {
                    await redis.set(cacheKey, JSON.stringify(geoProducts), 'EX', 3600);
                }
            } catch (e) { }
        }

        const hasMore = geoProducts.length === limit;
        let finalFeed = [];

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
        console.error("Feed Route Crash:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}