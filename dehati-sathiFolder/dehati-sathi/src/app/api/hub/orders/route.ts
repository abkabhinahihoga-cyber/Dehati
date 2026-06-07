export const dynamic = 'force-dynamic';
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import Order from "@/app/models/order.model";
import Hub from "@/app/models/hub.model";
import "@/app/models/grocery.model"; 
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'hub') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await connectDb();
        
        // Find Hub
        const myHub = await Hub.findOne({ $or: [{ managerId: session.user.id }, { manager: session.user.id }] });
        if (!myHub) return NextResponse.json({ message: "No Hub Found" }, { status: 404 });

        // Get Network
        const linkedUsers = await User.find({ connectedHub: myHub._id });
        const sellers = linkedUsers.filter(u => u.sellerStatus === 'approved');
        const deliveryBoys = linkedUsers.filter(u => u.role === 'deliveryBoy');
        
        const linkedSellerIds = sellers.map(s => s._id.toString());
        const hubManagerId = session.user.id.toString();

        const orders = await Order.find({})
            .populate('user', 'name mobile')
            .populate({ path: 'items.product', select: 'name price image seller' })
            .populate('assignedDeliveryBoy', 'name mobile')
            .sort({ createdAt: -1 });

        // Filter Orders
        const filteredOrders = orders.reduce((acc: any[], order: any) => {
            if (!order.items || order.items.length === 0) return acc;
            const firstItemSellerId = order.items[0].seller?.toString() || order.items[0].product?.seller?.toString();
            if (!firstItemSellerId) return acc;

            let type = null;
            if (firstItemSellerId === hubManagerId) type = 'hub';
            else if (linkedSellerIds.includes(firstItemSellerId)) type = 'seller';

            if (type) acc.push({ ...order.toObject(), orderType: type });
            return acc;
        }, []);

        return NextResponse.json({ success: true, orders: filteredOrders, deliveryBoys });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// --- PUT: Hub Actions ---
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'hub') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { orderId, status, deliveryBoyId } = await req.json();
        await connectDb();

        const order = await Order.findById(orderId).populate('items.product');
        if(!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

        // 1. Assign Driver (The Fix)
        if (deliveryBoyId !== undefined) {
            order.assignedDeliveryBoy = deliveryBoyId === "" ? null : deliveryBoyId;
            
            if (deliveryBoyId) {
                // 👇 FIX: Set delivery status to PENDING so driver sees it in "Incoming"
                order.deliveryBoyStatus = 'pending'; 
                
                // Do NOT set 'out_for_delivery' yet. Let the driver accept it first.
                // You can optionally set it to 'processing' if it was pending
                if (order.status === 'pending') order.status = 'processing';
            } else {
                // If unassigning
                order.deliveryBoyStatus = 'pending';
            }
        }

        // 2. Manual Status Update
        if (status) {
            const firstItemSellerId = order.items[0]?.seller?.toString() || order.items[0]?.product?.seller?.toString();
            const isHubOrder = firstItemSellerId === session.user.id;

            if (isHubOrder) {
                if (status === 'processing' && order.status === 'pending') {
                    order.status = 'processing';
                } else if (status === 'cancelled') {
                    order.status = 'cancelled';
                }
            } else {
                return NextResponse.json({ message: "Hub cannot manually change status of Seller Orders." }, { status: 403 });
            }
        }

        await order.save();
        
        // Response
        const updated = await Order.findById(order._id)
            .populate('user', 'name mobile')
            .populate('items.product', 'name price image')
            .populate('assignedDeliveryBoy', 'name mobile');

        const type = (updated.items[0]?.seller?.toString() || updated.items[0]?.product?.seller?.toString()) === session.user.id ? 'hub' : 'seller';

        return NextResponse.json({ success: true, order: { ...updated.toObject(), orderType: type } });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}