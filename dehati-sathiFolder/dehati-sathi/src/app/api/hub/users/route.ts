export const dynamic = 'force-dynamic';
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import Hub from "@/app/models/hub.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'hub') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await connectDb();

        const myHub = await Hub.findOne({ managerId: session.user.id });
        if (!myHub) return NextResponse.json({ message: "No Hub Found" }, { status: 404 });

        // Fetch users linked to this Hub
        const users = await User.find({ connectedHub: myHub._id }).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, users });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'hub') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { userId, action } = body; // action = 'approve' or 'reject'

        await connectDb();

        const myHub = await Hub.findOne({ managerId: session.user.id });
        if (!myHub) return NextResponse.json({ message: "No Hub Found" }, { status: 404 });

        // Ensure the target user is connected to this hub
        const targetUser = await User.findOne({ _id: userId, connectedHub: myHub._id });
        if (!targetUser) return NextResponse.json({ message: "User not found under this hub" }, { status: 404 });

        let updateData = {};
        if (action === 'approve') {
            updateData = { role: 'seller', sellerStatus: 'approved' };
        } else if (action === 'reject') {
            updateData = { sellerStatus: 'rejected' };
        } else {
            return NextResponse.json({ message: "Invalid action" }, { status: 400 });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

        // Send notification to the user
        try {
            const { createNotification } = await import("@/lib/notify");
            const decisionText = action === 'approve' ? 'approved' : 'rejected';
            await createNotification({
                recipientId: userId,
                type: 'system',
                message: `Your seller application has been ${decisionText} by the Hub Manager.`
            });
        } catch (notifErr) {
            console.error("Failed to notify user from hub approve:", notifErr);
        }

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}