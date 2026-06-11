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
        const budgetPriceCap = isStudent ? 99 : 49;

        let searchLng = lng;
        let searchLat = lat;
        let searchRadius = radius;
        let validSellerIds: any[] = [];
        let hasActiveHub = false;

        if ((session?.user as any)?.connectedHub) {
             const Hub = (await import('@/app/models/hub.model')).default;
             const User = (await import('@/app/models/user.model')).default;
             const activeHub = await Hub.findById((session?.user as any).connectedHub);
             if (activeHub) {
                 hasActiveHub = true;
                 const connectedSellers = await User.find({ connectedHub: activeHub._id, role: 'seller' }).select('_id');
                 validSellerIds = connectedSellers.map(s => s._id);
                 if (activeHub.managerId) {
                     validSellerIds.push(activeHub.managerId);
                 }
                 validSellerIds.push(activeHub._id);
             }
        }

        // 3. Base Location Query
        let baseQuery: any = {
            status: 'active',
            stock: { $gt: 0 },
            ...typeFilter
        };

        if (hasActiveHub && validSellerIds.length > 0) {
            baseQuery.seller = { $in: validSellerIds };
        } else {
            baseQuery.location = {
                $near: {
                    $geometry: { type: "Point", coordinates: [searchLng, searchLat] },
                    $maxDistance: searchRadius
                }
            };
        }

        // 4. Fetch Rails
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
                trending, 
                under99: underBudget,
                budgetPriceCap 
            } 
        });

    } catch (error: any) {
        console.error("Rails API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}