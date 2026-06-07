export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Grocery from "@/app/models/grocery.model";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        
        const lat = parseFloat(searchParams.get('lat') || "0");
        const lng = parseFloat(searchParams.get('lng') || "0");
        const mode = searchParams.get('mode') || 'grocery'; 
        const radius = 10000; 

        const session = await auth();

        if (!lat || !lng) {
            if (!(session?.user as any)?.connectedHub) {
                return NextResponse.json({ success: false });
            }
        }

        const isStudent = mode === 'student';

        // 1. Strict Type Filter
        const typeFilter = isStudent ? { productType: 'book' } : { productType: { $ne: 'book' } };
        
        // 2. Exact Price Caps Requested
        // Grocery: < 49, Student: < 99
        const budgetPriceCap = isStudent ? 99 : 49;

        let searchLng = lng;
        let searchLat = lat;
        let searchRadius = radius;

        if ((session?.user as any)?.connectedHub) {
             const Hub = (await import('@/app/models/hub.model')).default;
             const activeHub = await Hub.findById((session?.user as any).connectedHub);
             if (activeHub && activeHub.location?.coordinates) {
                 searchLng = activeHub.location.coordinates[0];
                 searchLat = activeHub.location.coordinates[1];
                 searchRadius = 100000000; // Large radius
             }
        }

        // 3. Base Location Query
        const baseQuery = {
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [searchLng, searchLat] },
                    $maxDistance: searchRadius
                }
            },
            status: 'active',
            stock: { $gt: 0 },
            ...typeFilter
        };

        // 4. Fetch Rails
        // We do Deals separately to handle the "Fallback" logic
        
        // A. Try fetching Discounted Items
        let dealsQuery: any = { ...baseQuery };
        if (isStudent) {
            dealsQuery.$expr = { $gt: [ { $convert: { input: "$bookDetails.printedPrice", to: "double", onError: 0, onNull: 0 } }, "$price" ] };
        } else {
            dealsQuery.$expr = { $gt: ["$retailPrice", "$price"] };
        }

        let deals = await Grocery.find(dealsQuery).limit(10).sort({ createdAt: -1 }).lean();

        // FAILSAFE: If no discounts found, fetch Lowest Price items
        if (deals.length === 0) {
            deals = await Grocery.find(baseQuery).sort({ price: 1 }).limit(10).lean();
        }

        const [trending, underBudget] = await Promise.all([
            // B. Trending (Strict: Must have reviews/orders)
            Grocery.find({ ...baseQuery, numReviews: { $gt: 0 } })
                .sort({ numReviews: -1, averageRating: -1 })
                .limit(10)
                .lean(),

            // C. Budget Store
            Grocery.find({ ...baseQuery, price: { $lte: budgetPriceCap } })
                .sort({ price: 1 })
                .limit(10)
                .lean()
        ]);

        return NextResponse.json({ 
            success: true, 
            data: { 
                deals, 
                trending, // Can be empty now (handled in UI)
                under99: underBudget,
                budgetPriceCap 
            } 
        });

    } catch (error: any) {
        console.error("Rails API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}