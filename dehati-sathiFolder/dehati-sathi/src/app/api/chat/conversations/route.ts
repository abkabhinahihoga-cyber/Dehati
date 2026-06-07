import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Conversation from "@/app/models/conversation.model";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await dbConnect();

        // Find all conversations where the user is a participant
        const conversations = await Conversation.find({
            participants: { $in: [session.user.id] }
        })
        .populate("participants", "name image role")
        .sort({ updatedAt: -1 }); // Show most recent chats first

        // Format the data for the frontend (Identify the "Other Person")
        const formattedConversations = conversations.map((conv: any) => {
            const otherParticipant = conv.participants.find(
                (p: any) => p._id.toString() !== session.user.id
            );
            return {
                _id: conv._id,
                otherUser: otherParticipant,
                lastMessage: conv.lastMessage,
                lastMessageAt: conv.lastMessageAt,
            };
        });

        return NextResponse.json({ success: true, conversations: formattedConversations });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}