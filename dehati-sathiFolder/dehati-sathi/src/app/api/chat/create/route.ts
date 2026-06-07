import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Conversation from "@/app/models/conversation.model";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { targetUserId } = await req.json();
        await dbConnect();

        // Check if conversation exists
        let conversation = await Conversation.findOne({
            participants: { $all: [session.user.id, targetUserId] }
        });

        // If not, create new
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [session.user.id, targetUserId],
                lastMessage: "Started a conversation",
            });
        }

        return NextResponse.json({ success: true, conversationId: conversation._id });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}