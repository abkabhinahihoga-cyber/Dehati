import connectDb from "@/lib/db";
import Order from "@/app/models/order.model";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDb();
        const session = await auth();
        if (!session?.user?.id || (session.user.role !== "deliveryBoy" && session.user.role !== "admin")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        
        const userId = session.user.id;
        const { id } = params;
        const { action, otp } = await req.json();

        const order = await Order.findById(id);
        if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

        const logEntry = (status: string) => ({
            status,
            timestamp: new Date(),
            user: userId
        });

        switch (action) {
            case "assign_to_me":
                if (order.status !== "ready_at_hub") return NextResponse.json({ message: "Order not ready for delivery" }, { status: 400 });
                if (order.assignedDeliveryBoy && order.assignedDeliveryBoy.toString() !== userId) {
                    return NextResponse.json({ message: "Already assigned to another driver" }, { status: 400 });
                }
                
                order.assignedDeliveryBoy = userId;
                order.deliveryBoyStatus = "accepted";
                // Doesn't change main status until started
                await order.save();
                return NextResponse.json({ success: true, message: "Order assigned to you" });

            case "start_delivery":
                if (order.assignedDeliveryBoy?.toString() !== userId) return NextResponse.json({ message: "Not assigned to you" }, { status: 403 });
                if (order.status !== "ready_at_hub") return NextResponse.json({ message: "Order not ready" }, { status: 400 });
                
                order.status = "out_for_delivery";
                order.trackingLogs.push(logEntry("out_for_delivery"));
                await order.save();
                return NextResponse.json({ success: true, message: "Started delivery" });

            case "verify_delivery":
                if (order.assignedDeliveryBoy?.toString() !== userId) return NextResponse.json({ message: "Not assigned to you" }, { status: 403 });
                if (order.status !== "out_for_delivery") return NextResponse.json({ message: "Not out for delivery" }, { status: 400 });
                if (order.deliveryOtp !== otp) return NextResponse.json({ message: "Invalid Delivery OTP" }, { status: 400 });
                
                order.status = "completed";
                order.isPaid = true; // Collect COD
                order.trackingLogs.push(logEntry("delivered"), logEntry("completed"));
                await order.save();
                return NextResponse.json({ success: true, message: "Delivery completed successfully" });

            default:
                return NextResponse.json({ message: "Invalid action" }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
