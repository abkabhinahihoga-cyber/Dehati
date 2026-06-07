export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Order from "@/app/models/order.model";
import Grocery from "@/app/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notify"; // 👈 Import Notification Helper

// --- GET ---
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'seller') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDb();

        const myProducts = await Grocery.find({ seller: session.user.id }).select('_id');
        const myProductIds = myProducts.map(p => p._id.toString());

        const orders = await Order.find({
            "items.product": { $in: myProductIds }
        })
        .populate({ path: "items.product", select: "name images price" })
        .sort({ createdAt: -1 });

        let totalRevenue = 0;
        let pendingOrders = 0;
        let completedOrders = 0;

        const sellerOrders = orders.map(order => {
            const myItems = order.items.filter((item: any) => 
                item.product && myProductIds.includes(item.product._id.toString())
            );

            const orderRevenue = myItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

            if (order.status === 'delivered') {
                totalRevenue += orderRevenue;
                completedOrders++;
            } else if (order.status !== 'cancelled') {
                pendingOrders++;
            }

            return { ...order.toObject(), items: myItems, orderRevenue };
        }).filter(o => o.items.length > 0);

        return NextResponse.json({
            success: true,
            stats: { revenue: totalRevenue, pending: pendingOrders, completed: completedOrders, total: sellerOrders.length },
            orders: sellerOrders
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// --- PUT: Seller Status Update ---
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'seller') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { orderId, status } = await req.json();
        await connectDb();

        const order = await Order.findById(orderId).populate('items.product');
        if(!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

        // 1. Ownership Check
        const hasMyProducts = order.items.some((item: any) => {
            const sellerId = item.seller?.toString() || item.product?.seller?.toString();
            return sellerId === session.user.id;
        });

        if (!hasMyProducts) {
            return NextResponse.json({ message: "Unauthorized access to order" }, { status: 403 });
        }

        // 2. Status Logic
        if (status === 'cancelled') {
            order.status = 'cancelled';
        } 
        else if (status === 'processing') {
            if (order.status === 'pending') {
                order.status = 'processing';
            } else if (order.status !== 'processing') {
                return NextResponse.json({ message: "Order is already processed/shipped." }, { status: 400 });
            }
        } 
        else {
            return NextResponse.json({ message: "Sellers cannot set this status." }, { status: 403 });
        }

        await order.save();

        // 3. 🔔 TRIGGER NOTIFICATION
        await createNotification({
            recipientId: order.user, // Notify the Buyer
            senderId: session.user.id, // From the Seller
            type: "order",
            message: `Your order #${order._id.toString().slice(-6)} is now ${status}.`,
            relatedId: order._id.toString()
        });

        return NextResponse.json({ success: true, message: "Order Status Updated" });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}