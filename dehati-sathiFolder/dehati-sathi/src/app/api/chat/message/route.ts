import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Message from "@/app/models/message.model";
import Conversation from "@/app/models/conversation.model";

export async function POST(req: NextRequest) {
    try {
        // 👇 Receive type and fileUrl from frontend
        const { conversationId, senderId, text, type, fileUrl } = await req.json();
        await dbConnect();

        const newMessage = await Message.create({
            conversationId,
            sender: senderId,
            text: text || (type === 'image' ? 'Image' : 'File'), 
            type: type || 'text', // Save the type (image/video/audio)
            fileUrl: fileUrl || null, // Save the URL
            status: 'sent'
        });

        // Update conversation preview
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: type === 'text' ? text : `📷 ${type}`, 
            lastMessageAt: new Date()
        });

        return NextResponse.json({ success: true, message: newMessage });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}