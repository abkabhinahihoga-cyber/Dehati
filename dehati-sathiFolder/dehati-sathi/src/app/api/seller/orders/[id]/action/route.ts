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

                // Generate a handover code for hub/delivery boy to show the seller when collecting
                if (order.deliveryType !== "farm-pickup") {
                    order.sellerHandoverCode = Math.floor(1000 + Math.random() * 9000).toString();
                }
                await order.save();

                // Notify buyer with their pickup code
                await createNotification({
                    recipientId: order.user.toString(),
                    type: "order",
                    title: "Order Accepted! ✅",
                    message: order.deliveryType === "farm-pickup"
                        ? `Your order has been accepted. Come to pickup and show your code: ${order.pickupOtp}`
                        : `Your order has been accepted and is being prepared. ${order.deliveryType === 'hub-pickup' ? `Your hub collection code: ${order.deliveryOtp}` : 'You will be updated when its ready for delivery.'}`,
                    url: `/user/order/${order._id}`
                });

                // If hub/home delivery — notify hub manager with the SELLER HANDOVER CODE
                if (order.connectedHub && order.deliveryType !== "farm-pickup") {
                    const hubManager = await User.findOne({ role: 'hub', connectedHub: order.connectedHub });
                    if (hubManager) {
                        await createNotification({
                            recipientId: hubManager._id.toString(),
                            type: "order",
                            title: "New Order Ready for Collection 📦",
                            message: `Order accepted by seller. Show this code to the seller to collect the order: ${order.sellerHandoverCode}`,
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

            case "verify_rejection":
                if (order.qualityStatus !== "rejected_pending_verification") return NextResponse.json({ message: "Quality is not pending verification" }, { status: 400 });
                if (order.rejectionOtp !== otp) return NextResponse.json({ message: "Invalid Rejection Code" }, { status: 400 });
                
                // Apply penalty directly to walletBalance
                await User.findByIdAndUpdate(userId, { 
                    $inc: { walletBalance: -20, "sellerDetails.penaltyBalance": 20 } 
                });
                order.penaltyAmount = 20;
                order.qualityStatus = "rejected";
                order.status = "rejected";
                order.trackingLogs.push(logEntry("penalty_applied_rejected"));
                await order.save();

                // Notify Hub that seller verified it
                if (order.connectedHub) {
                    const hubManager = await User.findOne({ role: 'hub', connectedHub: order.connectedHub });
                    if (hubManager) {
                        await createNotification({
                            recipientId: hubManager._id.toString(),
                            type: "system",
                            title: "Quality Rejection Verified ✅",
                            message: `Seller has verified the rejection for order ${order._id}. Penalty applied.`,
                            url: `/hub/orders`
                        });
                    }
                }

                return NextResponse.json({ success: true, message: "Rejection verified and penalty applied" });

            case "dispute_rejection":
                if (order.qualityStatus !== "rejected") return NextResponse.json({ message: "Can only dispute after rejection is verified" }, { status: 400 });
                order.disputeStatus = "raised";
                order.status = "under_review";
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
