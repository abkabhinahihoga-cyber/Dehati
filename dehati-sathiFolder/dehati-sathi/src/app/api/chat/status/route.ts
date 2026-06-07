import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Message from "@/app/models/message.model";

export async function POST(req: NextRequest) {
    try {
        const { messageIds, status } = await req.json();
        await dbConnect();

        await Message.updateMany(
            { _id: { $in: messageIds } },
            { $set: { status: status } }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}