import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/app/models/video.model";
import User from "@/app/models/user.model"; // 👈 Required to find followers
import { auth } from "@/auth"; 

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const sellerId = session.user.id;

        // 1. Fetch Seller's Reels
        const reels = await Video.find({ seller: sellerId })
            .sort({ createdAt: -1 })
            .populate('product', 'name')
            .lean();

        // 2. Fetch Followers (Users who have connected with this seller)
        // This queries the User collection for anyone who has 'sellerId' in their 'connections' array
        const followers = await User.find({ connections: sellerId })
            .select('name image email role') // Only get necessary profile info
            .lean();

        return NextResponse.json({ success: true, reels, followers });

    } catch (error: any) {
        console.error("Seller API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Note: DELETE requests for specific reels should be handled in `src/app/api/seller/reels/[id]/route.ts`