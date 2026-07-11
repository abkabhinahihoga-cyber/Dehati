import connectDb from "@/lib/db";
import Order from "@/app/models/order.model";
import Hub from "@/app/models/hub.model";
import User from "@/app/models/user.model";
import { createNotification } from "@/lib/notify";
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
            case "verify_pickup_from_seller": // Hub/DeliveryBoy collects from Seller
                if (order.status !== "ready") return NextResponse.json({ message: "Order not ready for pickup" }, { status: 400 });
                // Hub shows their sellerHandoverCode to seller; seller enters it in app to confirm
                if (order.sellerHandoverCode !== otp) return NextResponse.json({ message: "Invalid Handover Code. Check the code from your hub notification." }, { status: 400 });
                
                order.status = "picked_up";
                order.trackingLogs.push(logEntry("picked_up"));
                await order.save();

                // Notify buyer that their order was picked up and is on its way
                await createNotification({
                    recipientId: order.user.toString(),
                    type: "order",
                    title: "Order Picked Up! 🚚",
                    message: order.deliveryType === 'hub-pickup'
                        ? `Your order has been collected and is heading to the hub. ${order.deliveryOtp ? `Collection code: ${order.deliveryOtp}` : ''}`
                        : `Your order has been picked up and is out for delivery!`,
                    url: `/user/order/${order._id}`
                });

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
                
                // Generate a 4-digit code for the seller to verify the rejection
                const rejectionCode = Math.floor(1000 + Math.random() * 9000).toString();
                
                order.qualityStatus = "rejected_pending_verification";
                order.rejectionOtp = rejectionCode;
                order.qualityRejectionReason = reason;
                order.qualityImages = images || [];
                
                order.status = "under_review";
                order.trackingLogs.push(logEntry("quality_rejected"), logEntry("under_review"));
                await order.save();

                // Notify seller with the rejection OTP
                if (order.items && order.items.length > 0 && order.items[0].seller) {
                    await createNotification({
                        recipientId: order.items[0].seller.toString(),
                        type: "order",
                        title: "Product Quality Rejected ❌",
                        message: `Hub has rejected your product for reason: ${reason}. Please ask the hub for Rejection Code: ${rejectionCode} to verify and proceed.`,
                        url: "/seller/dashboard"
                    });
                }

                return NextResponse.json({ success: true, message: "Quality rejected and sent for seller verification" });

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
