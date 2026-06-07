import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/app/models/video.model";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const session = await auth();

        if (!session || !session.user || session.user.role !== 'seller') {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        // ⚡ CHANGE: Get JSON data (Frontend sends URL now, not a file)
        const body = await req.json();
        const { videoUrl, thumbnailUrl, description, productId } = body;

        if (!videoUrl) {
            return NextResponse.json({ success: false, message: "Missing video URL" }, { status: 400 });
        }

        // Save to DB
        const newVideo = await Video.create({
            seller: session.user.id,
            product: productId || null,
            videoUrl: videoUrl,
            thumbnailUrl: thumbnailUrl || videoUrl.replace(/\.[^/.]+$/, ".jpg"),
            description: description,
        });

        return NextResponse.json({ success: true, reel: newVideo });

    } catch (error: any) {
        console.error("Save Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}