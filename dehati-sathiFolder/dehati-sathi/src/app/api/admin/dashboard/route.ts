import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import Order from "@/app/models/order.model";
import Hub from "@/app/models/hub.model";
import "@/app/models/grocery.model"; 
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs"; 

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        await connectDb();

        const users = await User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 }).lean();

        const ordersDocs = await Order.find({}).populate("items.product").populate("user", "name mobile email").sort({ createdAt: -1 }).lean(); const orders = ordersDocs.map((o: any) => ({ ...o, userId: o.user }));

        const hubs = await Hub.find({}).populate("managerId", "name mobile").lean();

        const totalRevenue = orders.reduce((acc, order: any) => 
            order.status === "delivered" ? acc + order.totalAmount : acc, 0
        );
        const pendingApprovals = users.filter((u: any) => u.sellerStatus === "pending").length;

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
        console.error("Dashboard GET Error:", error);
        return NextResponse.json({ message: error.message || "Dashboard Fetch Failed" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const body = await req.json(); 
        await connectDb();

        if (body.action === "update-hub") {
            const { hubId, hubName, address, lat, lng } = body;
            const updateData: any = {};
            if (hubName) updateData.name = hubName;
            if (address && lat && lng) {
                updateData.location = { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)], address };
            }
            const updatedHub = await Hub.findByIdAndUpdate(hubId, updateData, { new: true });
            return NextResponse.json({ success: true, message: "Hub updated", hub: updatedHub });
        }

        const { userId, action } = body;
        let updateData = {};
        if (action === "approve") updateData = { sellerStatus: "approved" };
        if (action === "reject") updateData = { sellerStatus: "rejected" };
        if (action === "block") updateData = { isBlocked: true };
        if (action === "unblock") updateData = { isBlocked: false };

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
        return NextResponse.json({ success: true, message: `Action ${action} successful`, user: updatedUser });
    } catch (error: any) {
        console.error("Dashboard PUT Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const body = await req.json();
        
        if (body.action === "create-hub") {
            const { hubName, address, lat, lng, managerName, managerMobile } = body;
            await connectDb();

            const newManager = await User.create({
                name: managerName,
                mobile: managerMobile,
                role: "hub",
                location: { type: "Point", coordinates: [lng, lat], address }
            });

            const newHub = await Hub.create({
                name: hubName,
                code: `HUB-${Math.floor(1000 + Math.random() * 9000)}`,
                managerId: newManager._id,
                location: { type: "Point", coordinates: [lng, lat], address },
                range: 3500
            });

            await User.findByIdAndUpdate(newManager._id, { connectedHub: newHub._id });

            return NextResponse.json({ success: true, message: "Hub & Manager Created Successfully", hub: newHub });
        }

        return NextResponse.json({ message: "Invalid Action" }, { status: 400 });
    } catch (error: any) {
        console.error("Dashboard POST Error:", error);
        return NextResponse.json({ message: error.message || "Failed to create Hub" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(req.url);
        const hubId = searchParams.get("hubId");
        if (!hubId) return NextResponse.json({ message: "Hub ID required" }, { status: 400 });

        await connectDb();
        await User.updateMany({ connectedHub: hubId }, { $unset: { connectedHub: 1 } });
        await Hub.findByIdAndDelete(hubId);

        return NextResponse.json({ success: true, message: "Hub deleted successfully" });
    } catch (error: any) {
        console.error("Dashboard DELETE Error:", error);
        return NextResponse.json({ message: error.message || "Failed to delete Hub" }, { status: 500 });
    }
}