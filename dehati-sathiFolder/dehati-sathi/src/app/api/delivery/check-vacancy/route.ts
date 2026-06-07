import connectDb from "@/lib/db";
import Hub from "@/app/models/hub.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { lat, lng } = await req.json();
        if(!lat || !lng) return NextResponse.json({ message: "Location required" }, { status: 400 });

        await connectDb();

        // 1. Find 3 Nearest Hubs (within 10km)
        const hubs = await Hub.find({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [lng, lat] },
                    $maxDistance: 10000 
                }
            },
            isActive: true
        }).limit(3);

        if(hubs.length === 0) return NextResponse.json({ success: true, hubs: [] });

        // 2. Check Vacancy for each Hub
        const hubData = await Promise.all(hubs.map(async (hub) => {
            // Count existing APPROVED delivery boys for this hub
            const count = await User.countDocuments({ 
                connectedHub: hub._id, 
                role: 'deliveryBoy' 
            });

            // Count PENDING applications (optional, to prevent over-applying)
            // For now, we only block if actual seats are filled.
            
            return {
                _id: hub._id,
                name: hub.name,
                distance: "Calculating...", // You can calculate exact distance if needed
                filled: count,
                max: 2,
                isAvailable: count < 2
            };
        }));

        return NextResponse.json({ success: true, hubs: hubData });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}