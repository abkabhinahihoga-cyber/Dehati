import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Order from "@/app/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// UPDATE ORDER STATUS (Admin Override)
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { orderId, status } = await req.json();
        await connectDb();

        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
        
        if(!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

        return NextResponse.json({ success: true, message: `Order updated to ${status}` });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}