import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/app/models/video.model";
import User from "@/app/models/user.model";
import Grocery from "@/app/models/grocery.model"; // 👈 CRITICAL FIX: Registers the model
import { auth } from "@/auth"; 

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        
        const latParam = searchParams.get('lat');
        const lngParam = searchParams.get('lng');
        const page = parseInt(searchParams.get('page') || "1");
        const limit = 5;
        const skip = (page - 1) * limit;

        // Parse coordinates safely
        const lat = parseFloat(latParam || "0");
        const lng = parseFloat(lngParam || "0");

        let videoQuery: any = {};

        // ONLY filter by location if coordinates are valid and NOT 0,0
        if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
            try {
                // Find IDs of sellers near the user
                const nearbySellers = await User.find({
                    role: { $in: ['seller', 'hub'] },
                    location: {
                        $near: {
                            $geometry: { type: "Point", coordinates: [lng, lat] },
                            $maxDistance: 5000 // 5km
                        }
                    }
                }).select('_id');

                // If sellers found nearby, filter videos.
                if (nearbySellers.length > 0) {
                    const sellerIds = nearbySellers.map(u => u._id);
                    videoQuery = { seller: { $in: sellerIds } };
                }
            } catch (geoError) {
                console.warn("GeoQuery skipped (Missing 2dsphere index?): Returning global feed.");
                // Fallback: Proceed with empty query (Global Feed)
            }
        }

        // Fetch Videos
        const videos = await Video.find(videoQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('seller', 'name image sellerDetails followersCount') 
            .populate('product', 'name price retailPrice images') // 👈 This will now work
            .lean();

        // Add User Context (Liked/Connected)
        const session = await auth();
        let videosWithContext = videos;

        if (session?.user) {
            const currentUser = await User.findById(session.user.id).select('connections');
            const connectionSet = new Set(currentUser?.connections?.map((id:any) => id.toString()) || []);
            
            videosWithContext = videos.map((v: any) => ({
                ...v,
                isConnected: connectionSet.has(v.seller?._id?.toString()),
                isLiked: v.likes?.map((id:any) => id.toString()).includes(session.user.id) || false
            }));
        }

        return NextResponse.json({ success: true, videos: videosWithContext });

    } catch (error: any) {
        console.error("Reels Feed Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}