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