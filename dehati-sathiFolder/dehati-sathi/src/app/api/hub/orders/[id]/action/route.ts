import connectDb from "@/lib/db";
import Order from "@/app/models/order.model";
import Hub from "@/app/models/hub.model";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDb();
        const session = await auth();
        if (!session?.user?.id || (session.user.role !== "hub" && session.user.role !== "admin")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        
        const userId = session.user.id;
        const hubDoc = await Hub.findOne({ managerId: userId });
        if (!hubDoc && session.user.role !== "admin") {
            return NextResponse.json({ message: "No hub found for this user" }, { status: 403 });
        }

        const { id } = await params;
        const { action, otp, reason, images } = await req.json();

        const order = await Order.findById(id);
        if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

        // Ensure order belongs to this hub
        if (order.connectedHub?.toString() !== hubDoc?._id?.toString() && session.user.role !== "admin") {
            return NextResponse.json({ message: "Order not assigned to your hub" }, { status: 403 });
        }

        const logEntry = (status: string) => ({
            status,
            timestamp: new Date(),
            user: userId
        });

        switch (action) {
            case "verify_pickup_from_seller": // Hub picks up from Seller
                if (order.status !== "ready") return NextResponse.json({ message: "Order not ready for pickup" }, { status: 400 });
                if (order.pickupOtp !== otp) return NextResponse.json({ message: "Invalid Verification Code" }, { status: 400 });
                
                order.status = "picked_up";
                order.trackingLogs.push(logEntry("picked_up"));
                await order.save();
                return NextResponse.json({ success: true, message: "Picked up from seller" });

            case "quality_approve":
                if (order.status !== "picked_up") return NextResponse.json({ message: "Order must be picked up first" }, { status: 400 });
                
                order.qualityStatus = "approved";
                order.status = "ready_at_hub";
                order.trackingLogs.push(logEntry("quality_check"), logEntry("ready_at_hub"));
                await order.save();
                return NextResponse.json({ success: true, message: "Quality approved" });

            case "quality_reject":
                if (order.status !== "picked_up") return NextResponse.json({ message: "Order must be picked up first" }, { status: 400 });
                
                order.qualityStatus = "rejected";
                order.qualityRejectionReason = reason;
                order.qualityImages = images || [];
                // Status stays at picked_up or moves to rejected? The prompt says "System sends seller verification code". We can move it to 'under_review'
                order.status = "under_review";
                order.trackingLogs.push(logEntry("quality_rejected"), logEntry("under_review"));
                await order.save();
                return NextResponse.json({ success: true, message: "Quality rejected and sent for seller review" });

            case "handover_to_user": // Hub Pickup Handover
                if (order.deliveryType !== "hub-pickup") return NextResponse.json({ message: "Not a hub pickup order" }, { status: 400 });
                if (order.status !== "ready_at_hub") return NextResponse.json({ message: "Order must be ready at hub" }, { status: 400 });
                if (order.deliveryOtp !== otp) return NextResponse.json({ message: "Invalid Order Collection Code" }, { status: 400 });
                
                order.status = "completed";
                order.isPaid = true; // Payment collected at Hub
                order.trackingLogs.push(logEntry("completed"));
                await order.save();
                return NextResponse.json({ success: true, message: "Order collected by user" });

            case "assign_delivery_batch":
                // handled in delivery api ideally, or hub can assign. We'll let hub do it here if needed.
                return NextResponse.json({ message: "Use delivery assignment API" }, { status: 400 });

            default:
                return NextResponse.json({ message: "Invalid action" }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
