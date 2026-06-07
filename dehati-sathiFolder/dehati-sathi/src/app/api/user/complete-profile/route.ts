import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import Hub from "@/app/models/hub.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { language, mobile, location, address } = body;

        await connectDb();

        let updateData: any = { isNewUser: false };
        if (language) updateData.language = language;
        if (mobile) updateData.mobile = mobile;

        // --- CORE LOGIC: LOCATION & HUB LINKING ---
        if (location && location.lat && location.lng) {
            
            // 1. Set GeoJSON Location
            updateData.location = {
                type: 'Point',
                coordinates: [location.lng, location.lat], 
                address: address || "Pinned Location"
            };

            // 2. Find Nearest Hub (3.5km Radius)
            const nearestHub = await Hub.findOne({
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [location.lng, location.lat] },
                        $maxDistance: 3500 
                    }
                },
                isActive: true
            });

            // 3. Link or Unlink Hub
            if (nearestHub) {
                updateData.connectedHub = nearestHub._id;
            } else {
                updateData.connectedHub = null; 
            }
        }

        // --- UPDATE USER ---
        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            updateData,
            { new: true }
        ).populate('connectedHub', 'name'); 

        // 👇 FIXED: Type assertion to fix 'Property name does not exist on ObjectId'
        const hubName = (updatedUser?.connectedHub as any)?.name || null;

        return NextResponse.json({ 
            success: true, 
            user: updatedUser,
            hubName: hubName
        });

    } catch (error: any) {
        console.error("Profile Update Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}