import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        // Check if requester is Admin
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ message: "Admin access required" }, { status: 403 });
        }

        const { userId, action } = await req.json(); // action = 'approve' or 'reject'

        await connectDb();

        if (action === 'approve') {
            await User.findByIdAndUpdate(userId, {
                role: 'seller',         // <--- This switches their Dashboard!
                sellerStatus: 'approved'
            });
            return NextResponse.json({ success: true, message: "User is now a Seller" });
        } 
        else if (action === 'reject') {
            await User.findByIdAndUpdate(userId, {
                sellerStatus: 'rejected'
            });
            return NextResponse.json({ success: true, message: "Application Rejected" });
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}