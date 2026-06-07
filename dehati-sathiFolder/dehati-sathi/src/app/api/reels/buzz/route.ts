import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Buzz from "@/app/models/buzz.model";
import Video from "@/app/models/video.model";
import { auth } from "@/auth";

// POST: Add a Buzz (Comment)
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { videoId, content } = await req.json();

        const newBuzz = await Buzz.create({
            user: session.user.id,
            video: videoId,
            content
        });

        // Update count on video
        await Video.findByIdAndUpdate(videoId, { $inc: { buzzCount: 1 } });

        // Return populated buzz for immediate UI update
        await newBuzz.populate('user', 'name image');

        return NextResponse.json({ success: true, buzz: newBuzz });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Load Buzz for a video
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    
    const buzzes = await Buzz.find({ video: videoId })
        .sort({ createdAt: -1 })
        .populate('user', 'name image')
        .limit(50); // Limit for performance

    return NextResponse.json({ success: true, buzzes });
}