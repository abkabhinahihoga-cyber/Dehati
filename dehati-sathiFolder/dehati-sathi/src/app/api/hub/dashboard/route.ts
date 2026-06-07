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
        if (!session || !session.user || session.user.role !== 'hub') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDb();

        const myHub = await Hub.findOne({ managerId: session.user.id });
        if (!myHub) {
            return NextResponse.json({ message: "No Hub Assigned" }, { status: 404 });
        }

        // 1. Get Linked Users
        const linkedUsers = await User.find({ connectedHub: myHub._id });
        const sellers = linkedUsers.filter(u => u.sellerStatus === 'approved');
        const deliveryBoys = linkedUsers.filter(u => u.role === 'deliveryBoy');
        const consumers = linkedUsers.filter(u => u.role === 'user');

        // 2. 👇 CRITICAL FIX: Include Hub Manager ID in Seller List
        // This ensures orders for "Dehati Shop" (sold by Hub Manager) are also counted
        const sellerIds = sellers.map(s => s._id.toString());
        sellerIds.push(session.user.id); // Add Hub Manager's ID

        // 3. Fetch Orders
        const orders = await Order.find({})
            .populate({ path: 'user', select: 'name mobile', strictPopulate: false }) 
            .populate({
                path: 'items.product',
                select: 'seller name price',
                strictPopulate: false 
            })
            .sort({ createdAt: -1 });

        // 4. Filter Orders
        const hubOrders = orders.filter(order => {
            if (!order.items || !Array.isArray(order.items)) return false;
            
            return order.items.some((item: any) => {
                if (!item.product || !item.product.seller) return false;
                // Check if the item's seller is in our list (Linked Sellers OR Hub Manager)
                return sellerIds.includes(item.product.seller.toString());
            });
        });

        const totalRevenue = hubOrders.reduce((acc, o) => 
            o.status === 'delivered' ? acc + (o.totalAmount || 0) : acc, 
            0
        );

        return NextResponse.json({
            success: true,
            hub: myHub,
            stats: {
                sellers: sellers.length,
                deliveryBoys: deliveryBoys.length,
                consumers: consumers.length,
                orders: hubOrders.length,
                revenue: totalRevenue
            },
            recentOrders: hubOrders.slice(0, 10)
        });

    } catch (error: any) {
        console.error("Hub Dashboard Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}