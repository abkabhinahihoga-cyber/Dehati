import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import Hub from "@/app/models/hub.model"; // Import Hub
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { shopName, shopAddress, gstin } = body;

        if (!shopName || !shopAddress) {
            return NextResponse.json({ message: "Shop Name and Address are required" }, { status: 400 });
        }

        await connectDb();

        // 1. Fetch User to get their Location
        const user = await User.findById(session.user.id);
        if (!user || !user.location || !user.location.coordinates) {
             return NextResponse.json({ message: "Please set your location on the map first." }, { status: 400 });
        }

        let hubId = (user as any).connectedHub;
        let hubName = "Connected Hub";

        if (!hubId) {
            // 2. Find Nearest Hub (within 3.5km)
            const nearbyHub = await Hub.findOne({
                location: {
                    $near: {
                        $geometry: { 
                            type: "Point", 
                            coordinates: user.location.coordinates // [lng, lat]
                        },
                        $maxDistance: 3500 // 3.5 KM Limit
                    }
                }
            });

            // 3. REJECT if no Hub found
            if (!nearbyHub) {
                return NextResponse.json({ 
                    success: false, 
                    message: "Service Unavailable: No Dehati Hub found within 3.5km of your location." 
                }, { status: 400 });
            }
            
            hubId = nearbyHub._id;
            hubName = nearbyHub.name;
        }

        // 4. APPROVE and Link to Hub
        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            {
                sellerStatus: 'pending',
                connectedHub: hubId, // Link seller to this Hub
                sellerDetails: {
                    shopName,
                    shopAddress,
                    gstin
                }
            },
            { new: true }
        );

        return NextResponse.json({ success: true, user: updatedUser, hub: hubName });

    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Application failed" }, { status: 500 });
    }
}