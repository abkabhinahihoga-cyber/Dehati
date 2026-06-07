import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Message from "@/app/models/message.model";
import Conversation from "@/app/models/conversation.model";
import { auth } from "@/auth";

export async function GET(
    req: NextRequest, 
    { params }: { params: Promise<{ id: string }> } 
) {
    try {
        const { id: conversationId } = await params;
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();

        // 1. Fetch Messages
        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 }) // Oldest first
            .populate("sender", "name image");

        // 2. Fetch Conversation Details (to show who we are talking to)
        const conversation = await Conversation.findById(conversationId)
            .populate("participants", "name image role");

        if (!conversation) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

        // Identify the "Other Person"
        const otherUser = conversation.participants.find(
            (p: any) => p._id.toString() !== session.user.id
        );

        return NextResponse.json({ 
            success: true, 
            messages, 
            chatPartner: otherUser 
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}