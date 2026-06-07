import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/app/models/user.model";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await dbConnect();

        // Populate the 'connections' array to get seller details
        const user = await User.findById(session.user.id)
            .populate({
                path: 'connections',
                select: 'name image sellerDetails role'
            })
            .select('connections');

        return NextResponse.json({ success: true, connections: user?.connections || [] });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}