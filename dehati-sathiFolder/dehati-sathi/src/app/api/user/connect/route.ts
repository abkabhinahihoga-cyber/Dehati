import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/app/models/user.model";
import { auth } from "@/auth";
import { createNotification } from "@/lib/notify";
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { targetUserId } = await req.json(); 
        const userId = session.user.id;

        const currentUser = await User.findById(userId);
        const targetUser = await User.findById(targetUserId);
        // ... inside the POST function after updating connections:
await createNotification({
    recipientId: targetUserId,
    senderId: session.user.id,
    type: "follow",
    message: "started following your shop."
});
        // 1. Safety Check: Ensure users exist
        if (!currentUser) return NextResponse.json({ error: "Current user not found" }, { status: 404 });
        if (!targetUser) return NextResponse.json({ error: "Target user not found" }, { status: 404 });

        // 2. Safe Comparison (Convert ObjectId to String)
        // Default to empty array if connections is undefined
        const connections = currentUser.connections || [];
        const isConnected = connections.some((id: any) => id.toString() === targetUserId);

        if (isConnected) {
            // Disconnect
            await User.findByIdAndUpdate(userId, { $pull: { connections: targetUserId } });
            await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } });
            return NextResponse.json({ success: true, status: "disconnected" });
        } else {
            // Connect
            await User.findByIdAndUpdate(userId, { $addToSet: { connections: targetUserId } });
            await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } });
            return NextResponse.json({ success: true, status: "connected" });
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}