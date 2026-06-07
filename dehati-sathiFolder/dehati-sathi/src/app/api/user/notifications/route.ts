import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Notification from "@/app/models/notification.model";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

// GET: Fetch Notifications
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ success: false }, { status: 401 });

        await dbConnect();
        
        const notifications = await Notification.find({ recipient: session.user.id })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate("sender", "name image");

        const unreadCount = await Notification.countDocuments({ recipient: session.user.id, read: false });

        return NextResponse.json({ success: true, notifications, unreadCount });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT: Mark as Read
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ success: false }, { status: 401 });

        await dbConnect();
        
        await Notification.updateMany(
            { recipient: session.user.id, read: false },
            { $set: { read: true } }
        );

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}