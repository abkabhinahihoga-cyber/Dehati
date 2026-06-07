export const dynamic = 'force-dynamic';
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Order from "@/app/models/order.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'deliveryBoy') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await connectDb();

        const orders = await Order.find({
            $or: [
                { assignedDeliveryBoy: session.user.id }, 
                { 
                    assignedDeliveryBoy: null,
                    isOpenForDelivery: true,
                    rejectedBy: { $ne: session.user.id },
                    status: { $ne: 'driver_unavailable' } 
                }
            ]
        })
        .populate('user', 'name mobile')
        .populate('items.product', 'name price image')
        .sort({ createdAt: -1 });

        const activeTasks = orders.filter((o: any) => o.status === 'out_for_delivery' || o.deliveryBoyStatus === 'accepted');
        const completedTasks = orders.filter((o: any) => o.status === 'delivered');
        const totalEarnings = completedTasks.length * 40; 

        return NextResponse.json({ 
            success: true, 
            orders, 
            stats: { active: activeTasks.length, completed: completedTasks.length, earnings: totalEarnings } 
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'deliveryBoy') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { orderId, action } = await req.json();
        await connectDb();

        const order = await Order.findById(orderId);
        if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

        // --- HANDLE ACCEPT ---
        if (action === 'accept') {
            if (order.assignedDeliveryBoy && order.assignedDeliveryBoy.toString() !== session.user.id) {
                return NextResponse.json({ message: "Too late! Another driver accepted this order." }, { status: 409 });
            }
            order.assignedDeliveryBoy = session.user.id;
            order.deliveryBoyStatus = 'accepted';
            // 👇 CRITICAL FIX: Keep status 'processing' until driver starts the run
            order.status = 'processing'; 
            order.isOpenForDelivery = false; 
        } 
        
        // --- HANDLE START RUN (New Action) ---
        else if (action === 'out_for_delivery') {
             order.status = 'out_for_delivery';
        }

        // --- HANDLE REJECT ---
        else if (action === 'reject') {
            if (!order.rejectedBy.includes(session.user.id)) {
                order.rejectedBy.push(session.user.id);
            }
            if (order.assignedDeliveryBoy?.toString() === session.user.id) {
                order.assignedDeliveryBoy = null;
                order.deliveryBoyStatus = 'pending'; 
                order.isOpenForDelivery = true;      
            }

            if (order.connectedHub) {
                const totalDrivers = await User.countDocuments({
                    connectedHub: order.connectedHub,
                    role: 'deliveryBoy',
                    isBlocked: { $ne: true } 
                });

                if (order.rejectedBy.length >= totalDrivers && totalDrivers > 0) {
                    order.status = 'driver_unavailable';
                    order.isOpenForDelivery = false; 
                }
            }
        }
        
        // --- HANDLE DELIVERED ---
        else if (action === 'delivered') {
            order.status = 'delivered';
            order.isPaid = true;
        }

        await order.save();
        return NextResponse.json({ success: true, message: `Order updated to ${action}` });

    } catch (error: any) {
        console.error("Dashboard Action Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}