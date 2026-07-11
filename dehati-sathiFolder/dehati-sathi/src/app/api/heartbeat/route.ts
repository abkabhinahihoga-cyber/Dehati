import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDb();
        
        // Update lastSeen timestamp without triggering full validation or updating 'updatedAt' unnecessarily
        await User.findByIdAndUpdate(session.user.id, {
            $set: { lastSeen: new Date() }
        }, { timestamps: false });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Heartbeat error:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
