import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import Order from "@/app/models/order.model";
import Hub from "@/app/models/hub.model";
// 👇 CRITICAL IMPORT: This registers the "Grocery" schema so Orders can populate products
import "@/app/models/grocery.model"; 

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs"; 

export const dynamic = "force-dynamic";

// --- GET: Fetch Dashboard Stats ---
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDb();

        // 1. Fetch Users (Exclude admins)
        const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 });

        // 2. Fetch Orders (Populate Product Details)
        // If this crashes, it's usually because the Product/Grocery model isn't imported above
        const orders = await Order.find({})
            .populate("items.product") 
            .sort({ createdAt: -1 });

        // 3. Fetch Hubs (Populate Manager Details)
        const hubs = await Hub.find({})
            .populate("managerId", "name mobile");

        // 4. Calculate Stats
        const totalRevenue = orders.reduce((acc, order) => 
            order.status === 'delivered' ? acc + order.totalAmount : acc, 0
        );

        const pendingApprovals = users.filter(u => u.sellerStatus === 'pending').length;

        return NextResponse.json({
            success: true,
            stats: {
                totalUsers: users.length,
                totalOrders: orders.length,
                totalHubs: hubs.length,
                totalRevenue,
                pendingApprovals
            },
            users,
            orders,
            hubs 
        });

    } catch (error: any) {
        // 👇 Log the ACTUAL error to your terminal for debugging
        console.error("Dashboard GET Error:", error);
        return NextResponse.json({ message: error.message || "Dashboard Fetch Failed" }, { status: 500 });
    }
}

// --- PUT: Manage Users (Approve/Block) ---
export async function PUT(req: NextRequest) {
     try {
        const session = await auth();
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { userId, action } = await req.json(); 
        await connectDb();

        let updateData = {};
        if (action === 'approve') updateData = { sellerStatus: 'approved' };
        if (action === 'reject') updateData = { sellerStatus: 'rejected' };
        if (action === 'block') updateData = { isBlocked: true };
        if (action === 'unblock') updateData = { isBlocked: false };

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
        return NextResponse.json({ success: true, message: `Action ${action} successful`, user: updatedUser });

    } catch (error: any) {
        console.error("Dashboard PUT Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// --- POST: Create New Hub & Manager ---
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        
        if (body.action === 'create-hub') {
            const { hubName, address, lat, lng, managerName, managerMobile } = body;
            
            await connectDb();

            // 1. Create the Manager User
            
            const newManager = await User.create({
                name: managerName,
                mobile: managerMobile,
                role: 'hub', // Role is now valid
                location: {
                    type: 'Point',
                    coordinates: [lng, lat],
                    address: address
                }
            });

            // 2. Create the Hub linked to Manager
            const newHub = await Hub.create({
                name: hubName,
                code: `HUB-${Math.floor(1000 + Math.random() * 9000)}`,
                managerId: newManager._id,
                location: {
                    type: 'Point',
                    coordinates: [lng, lat],
                    address: address
                },
                range: 3500
            });

            // 3. Link Manager back to Hub
            await User.findByIdAndUpdate(newManager._id, { connectedHub: newHub._id });

            return NextResponse.json({ success: true, message: "Hub & Manager Created Successfully", hub: newHub });
        }

        return NextResponse.json({ message: "Invalid Action" }, { status: 400 });

    } catch (error: any) {
        console.error("Dashboard POST Error:", error);
        return NextResponse.json({ message: error.message || "Failed to create Hub" }, { status: 500 });
    }
}