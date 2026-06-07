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
                select: 'name image sellerDetails role location'
            })
            .select('connections connectedHub');

        let hubSellers: any[] = [];
        if (user?.connectedHub) {
            hubSellers = await User.find({
                connectedHub: user.connectedHub,
                role: { $in: ['seller', 'hub'] },
                sellerStatus: 'approved',
                _id: { $ne: session.user.id }
            }).select('name image sellerDetails role location');
            
            const admins = await User.find({ role: 'admin' }).select('name image sellerDetails role location');
            hubSellers = [...hubSellers, ...admins];
        }

        return NextResponse.json({ 
            success: true, 
            connections: user?.connections || [],
            hubSellers
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}