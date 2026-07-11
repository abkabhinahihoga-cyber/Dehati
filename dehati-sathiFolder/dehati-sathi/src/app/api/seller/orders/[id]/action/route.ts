import connectDb from "@/lib/db";
import Order from "@/app/models/order.model";
import Grocery from "@/app/models/grocery.model";
import User from "@/app/models/user.model";
import Hub from "@/app/models/hub.model";
import { createNotification } from "@/lib/notify";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDb();
        const session = await auth();
        if (!session?.user?.id || (session.user.role !== "seller" && session.user.role !== "admin")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;
        const { id } = await params;
        const { action, reason, otp } = await req.json();

        const order = await Order.findById(id).populate("items.product");
        if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

        // Ensure the seller is actually part of this order
        const sellerIds = order.items.map((i: any) => i.product?.seller?.toString());
        const isSellerInvolved = sellerIds.includes(userId);
        
        if (!isSellerInvolved && session.user.role !== "admin") {
            return NextResponse.json({ message: "Not your order", debug: { userId, sellerIds } }, { status: 403 });
        }

        const logEntry = (status: string) => ({
            status,
            timestamp: new Date(),
            user: userId
        });

        switch (action) {
            case "accept":
                if (order.status !== "pending") return NextResponse.json({ message: "Can only accept pending orders" }, { status: 400 });
                order.status = "processing";
                order.trackingLogs.push(logEntry("processing"));
                await order.save();

                // Notify buyer
                await createNotification({
                    recipientId: order.user.toString(),
                    type: "order",
                    title: "Order Accepted! ✅",
                    message: `Your order has been accepted by the seller and is now being prepared. Your pickup code is: ${order.pickupOtp}`,
                    url: `/user/order/${order._id}`
                });

                // Notify connected hub
                if (order.connectedHub) {
                    const hubManager = await User.findOne({ role: 'hub', connectedHub: order.connectedHub });
                    if (hubManager) {
                        await createNotification({
                            recipientId: hubManager._id.toString(),
                            type: "order",
                            title: "New Order In Progress 📦",
                            message: `An order has been accepted by a seller and is being prepared for pickup/delivery.`,
                            url: `/hub/orders`
                        });
                    }
                }

                return NextResponse.json({ success: true, message: "Order accepted" });

            case "reject":
                if (order.status !== "pending") return NextResponse.json({ message: "Can only reject pending orders" }, { status: 400 });
                order.status = "rejected";
                order.rejectedReason = reason || "Out of Stock";
                order.trackingLogs.push(logEntry("rejected"));
                
                // Refund Stock
                for (const item of order.items) {
                    await Grocery.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
                }
                
                await order.save();

                // Notify buyer about rejection
                await createNotification({
                    recipientId: order.user.toString(),
                    type: "order",
                    title: "Order Rejected ❌",
                    message: `Your order was rejected by the seller. Reason: ${order.rejectedReason}. Your stock has been refunded.`,
                    url: `/user/order/${order._id}`
                });

                return NextResponse.json({ success: true, message: "Order rejected and stock refunded" });

            case "ready":
                if (order.status !== "processing") return NextResponse.json({ message: "Order must be processing first" }, { status: 400 });
                order.status = "ready";
                order.trackingLogs.push(logEntry("ready"));
                await order.save();
                return NextResponse.json({ success: true, message: "Order marked as ready" });

            case "verify_pickup": // For FARM PICKUP
                if (order.deliveryType !== "farm-pickup") return NextResponse.json({ message: "Invalid action for this delivery type" }, { status: 400 });
                if (order.status !== "ready") return NextResponse.json({ message: "Order must be ready first" }, { status: 400 });
                if (order.pickupOtp !== otp) return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
                
                order.status = "completed";
                order.isPaid = true; // Farm pickup is paid at pickup
                order.trackingLogs.push(logEntry("picked_up"), logEntry("completed"));
                
                // Add earnings to seller
                await User.findByIdAndUpdate(userId, { $inc: { totalEarnings: order.totalAmount } });
                
                await order.save();
                return NextResponse.json({ success: true, message: "Pickup verified and order completed" });

            case "acknowledge_rejection":
                if (order.qualityStatus !== "rejected") return NextResponse.json({ message: "Quality is not rejected" }, { status: 400 });
                // Apply penalty
                await User.findByIdAndUpdate(userId, { 
                    $inc: { "sellerDetails.penaltyBalance": 20 } 
                });
                order.penaltyAmount = 20;
                await order.save();
                return NextResponse.json({ success: true, message: "Rejection acknowledged and penalty applied" });

            case "dispute_rejection":
                if (order.qualityStatus !== "rejected") return NextResponse.json({ message: "Quality is not rejected" }, { status: 400 });
                order.disputeStatus = "raised";
                await User.findByIdAndUpdate(userId, { 
                    $inc: { "sellerDetails.disputeCases": 1 } 
                });
                await order.save();
                return NextResponse.json({ success: true, message: "Dispute raised to Admin" });

            default:
                return NextResponse.json({ message: "Invalid action" }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
