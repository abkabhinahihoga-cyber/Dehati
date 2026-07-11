import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Order from "@/app/models/order.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { action, favor } = await req.json();
        const orderId = params.id;
        await connectDb();

        const order = await Order.findById(orderId).populate('sellerId');
        if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

        if (action === 'resolve_dispute') {
            if (order.status !== 'under_review') {
                return NextResponse.json({ message: "Order is not in under_review state" }, { status: 400 });
            }

            if (favor === 'seller') {
                // Reverse penalty
                const seller = await User.findById(order.sellerId);
                if (seller) {
                    seller.penaltyAmount = Math.max(0, seller.penaltyAmount - 20);
                    seller.disputeCases = Math.max(0, seller.disputeCases - 1);
                    await seller.save();
                }
                
                // Allow seller to fix it or cancel it
                order.status = 'processing';
                order.qualityStatus = 'pending';
                await order.save();
                
                return NextResponse.json({ success: true, message: "Dispute resolved in favor of seller. Penalty reversed." });
            } else if (favor === 'hub') {
                // Keep penalty, cancel order
                order.status = 'cancelled';
                order.qualityStatus = 'rejected';
                await order.save();
                return NextResponse.json({ success: true, message: "Dispute resolved in favor of hub. Order cancelled." });
            }
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
