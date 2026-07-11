import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import Order from "@/app/models/order.model";
import Hub from "@/app/models/hub.model";
import "@/app/models/grocery.model"; 
import PushSubscription from "@/app/models/PushSubscription.model";
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

        const pushSubs = await PushSubscription.find({}).lean();
        const pushUserIds = new Set(pushSubs.filter((p: any) => p.userId).map((p: any) => String(p.userId)));

        const rawUsers = await User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 }).lean();
        const users = rawUsers.map((u: any) => ({ ...u, hasPush: pushUserIds.has(String(u._id)) }));

        const ordersDocs = await Order.find({}).populate("items.product").populate("user", "name mobile email").sort({ createdAt: -1 }).lean(); 
        const orders = ordersDocs.map((o: any) => ({ ...o, userId: o.user }));

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
                pendingApprovals,
                activePushUsers: pushUserIds.size
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
            const { hubId, hubName, address, lat, lng, managerName, managerMobile } = body;
            const hubUpdateData: any = {};
            if (hubName) hubUpdateData.name = hubName;
            if (address && lat && lng) {
                hubUpdateData.location = { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)], address };
            }
            
            // Update hub manager if provided
            if (managerMobile) {
                // Upsert the manager user
                const managerData: any = { role: "hub", connectedHub: hubId };
                if (managerName) managerData.name = managerName;
                
                const updatedManager = await User.findOneAndUpdate(
                    { mobile: managerMobile },
                    { $set: managerData },
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                );
                hubUpdateData.managerId = updatedManager._id;
            }

            const updatedHub = await Hub.findByIdAndUpdate(hubId, hubUpdateData, { new: true });
            return NextResponse.json({ success: true, message: "Hub updated", hub: updatedHub });
        }

        const { userId, action } = body;
        let updateData = {};
        if (action === "approve") updateData = { role: "seller", sellerStatus: "approved" };
        if (action === "reject") updateData = { sellerStatus: "rejected" };
        if (action === "block") updateData = { isBlocked: true };
        if (action === "unblock") updateData = { isBlocked: false };

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

        // Send notification to the user on approval or rejection
        if (action === "approve" || action === "reject") {
            try {
                const { createNotification } = await import("@/lib/notify");
                await createNotification({
                    recipientId: userId,
                    type: "system",
                    message: action === "approve" 
                        ? "Your seller application has been approved by Dehati Admin! You are now a Seller." 
                        : "Your seller application was rejected by Dehati Admin."
                });
            } catch (notifErr) {
                console.error("Failed to notify user of seller decision:", notifErr);
            }
        }

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

            // FIXED: Upsert manager user to avoid E11000 duplicate key on mobile
            // If user with this mobile exists, update their role; else create fresh
            const managerData: any = {
                role: "hub",
                location: { type: "Point", coordinates: [lng, lat], address }
            };
            if (managerName) managerData.name = managerName;

            const managerUser = await User.findOneAndUpdate(
                { mobile: managerMobile },
                { $set: managerData },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            
            // If this is a new upsert, also set the name
            if (managerName && !managerUser.name) {
                managerUser.name = managerName;
                await managerUser.save();
            }

            const newHub = await Hub.create({
                name: hubName,
                code: `HUB-${Math.floor(1000 + Math.random() * 9000)}`,
                managerId: managerUser._id,
                location: { type: "Point", coordinates: [lng, lat], address },
                range: 3500
            });

            // Link manager to hub
            await User.findByIdAndUpdate(managerUser._id, { connectedHub: newHub._id });

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