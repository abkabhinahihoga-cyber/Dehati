export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Hub from "@/app/models/hub.model"; 
import { auth } from "@/auth";
import User from "@/app/models/user.model";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(req.url);
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');

        if (!lat || !lng) {
            return NextResponse.json({ success: false, message: "Location required" }, { status: 400 });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        const session = await auth();
        let targetHub = null;

        if ((session?.user as any)?.connectedHub) {
            targetHub = await Hub.findById((session?.user as any).connectedHub).select('name location address');
        }

        if (!targetHub) {
            // Find nearest Hub (up to 50km radius)
            targetHub = await Hub.findOne({
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [longitude, latitude] },
                        $maxDistance: 50000 
                    }
                }
            }).select('name location address'); // Only fetch needed fields
        }

        if (!targetHub) {
            return NextResponse.json({ 
                success: false, 
                message: "No service in this area yet." 
            });
        }

        return NextResponse.json({ 
            success: true, 
            hub: {
                name: targetHub.name,
                coordinates: targetHub.location.coordinates, // [lng, lat]
                address: targetHub.address || targetHub.location.address
            }
        });

    } catch (error: any) {
        console.error("Hub Fetch Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}