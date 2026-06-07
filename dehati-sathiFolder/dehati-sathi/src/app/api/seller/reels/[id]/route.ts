import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/app/models/video.model";
import { auth } from "@/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const session = await auth();
        
        if (!session || !session.user) return NextResponse.json({ success: false }, { status: 401 });

        const { id } = await params;
        const deletedVideo = await Video.findOneAndDelete({ 
            _id: id, 
            seller: session.user.id // Ensure they own it
        });

        if (!deletedVideo) return NextResponse.json({ success: false, message: "Video not found" }, { status: 404 });

        return NextResponse.json({ success: true, message: "Reel deleted" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}