import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { hubId } = await req.json();
        if (!hubId) {
            return NextResponse.json({ success: false, message: "Hub ID is required" }, { status: 400 });
        }

        await connectDb();
        
        await User.findByIdAndUpdate(session.user.id, {
            connectedHub: hubId
        });

        return NextResponse.json({ success: true, message: "Hub updated successfully" });
    } catch (error) {
        console.error("Error updating hub:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
