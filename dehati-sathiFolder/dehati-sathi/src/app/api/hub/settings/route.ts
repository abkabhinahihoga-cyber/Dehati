import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Hub from "@/app/models/hub.model";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch Saved Time
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'hub') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await connectDb();
        const hub = await Hub.findOne({ 
            $or: [{ managerId: session.user.id }, { manager: session.user.id }] 
        });
        
        return NextResponse.json({ 
            success: true, 
            time: hub?.autoAssignTime || "" 
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST: Save Time
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'hub') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { time } = await req.json();
        await connectDb();

        // Use $set to force update
        const updated = await Hub.findOneAndUpdate(
            { $or: [{ managerId: session.user.id }, { manager: session.user.id }] },
            { $set: { autoAssignTime: time } },
            { new: true }
        );

        return NextResponse.json({ success: true, message: "Time saved!" });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}