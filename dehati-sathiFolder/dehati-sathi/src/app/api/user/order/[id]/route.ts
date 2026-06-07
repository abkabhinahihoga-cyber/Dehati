import connectDb from "@/lib/db";
import Order from "@/app/models/order.model";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest, 
    { params }: { params: Promise<{ id: string }> } 
) {
    try {
        await connectDb();
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const order = await Order.findOne({ 
            _id: id, 
            user: session.user.id 
        })
        // 👇 CRITICAL: Populate location for live tracking
        .populate("assignedDeliveryBoy", "name mobile image location") 
        .populate("connectedHub", "name address location")
        .populate("items.product", "name images");

        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        return NextResponse.json(order, { status: 200 });
        
    } catch (error: any) {
        console.error("Order Fetch Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}