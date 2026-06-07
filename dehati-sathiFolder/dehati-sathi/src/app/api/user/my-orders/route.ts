import connectDb from "@/lib/db";
import Order from "@/app/models/order.model";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const orders = await Order.find({ user: session.user.id })
            .populate("user")
            // Populate Driver info
            .populate("assignedDeliveryBoy", "name mobile image") 
            // Populate Hub info (Critical for Hub Pickup details)
            .populate("connectedHub", "name address location") 
            .sort({ createdAt: -1 });

        return NextResponse.json(orders, { status: 200 });
        
    } catch (error: any) {
        return NextResponse.json({ message: `get all orders error: ${error.message}` }, { status: 500 });
    }
}