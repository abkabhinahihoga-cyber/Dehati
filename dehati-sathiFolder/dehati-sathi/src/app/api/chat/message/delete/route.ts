import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Message from "@/app/models/message.model";
import { auth } from "@/auth"; 

export async function POST(req: NextRequest) {
    try {
        const { messageId, type } = await req.json(); // type: 'me' or 'everyone'
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();

        if (type === 'everyone') {
            const msg = await Message.findOne({ _id: messageId, sender: session.user.id });
            if (!msg) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
            
            await Message.findByIdAndUpdate(messageId, { 
                isDeleted: true, 
                text: "This message was deleted", 
                type: 'text', 
                fileUrl: null 
            });
        } else {
            await Message.findByIdAndUpdate(messageId, { $addToSet: { deletedFor: session.user.id } });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}