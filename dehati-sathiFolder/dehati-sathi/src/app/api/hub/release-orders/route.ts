import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Hub from "@/app/models/hub.model";
import Order from "@/app/models/order.model";
import User from "@/app/models/user.model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import emitEventHandler from "@/lib/emitEventHandler"; // Import the helper

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'hub') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDb();

        const hub = await Hub.findOne({ 
            $or: [{ managerId: session.user.id }, { manager: session.user.id }] 
        });

        if (!hub) return NextResponse.json({ message: "Hub not found" }, { status: 404 });

        const sellers = await User.find({ connectedHub: hub._id }).select('_id');
        const sellerIds = sellers.map(s => new mongoose.Types.ObjectId(s._id));
        
        sellerIds.push(new mongoose.Types.ObjectId(session.user.id));
        if (hub.managerId) sellerIds.push(new mongoose.Types.ObjectId(hub.managerId));

        const query = {
            status: { $in: ['pending', 'processing', 'PENDING', 'PROCESSING', 'out_for_delivery'] },
            assignedDeliveryBoy: null,      
            isOpenForDelivery: { $ne: true }, 
            $or: [
                { connectedHub: hub._id },
                { "items.seller": { $in: sellerIds } },
                { connectedHub: { $exists: false } },
                { connectedHub: null }
            ]
        };

        const result = await Order.updateMany(query, { 
            $set: { 
                isOpenForDelivery: true, 
                connectedHub: hub._id, 
                status: 'out_for_delivery' 
            } 
        });

        if (result.modifiedCount > 0) {
            // 👇 FIRE SOCKET EVENT
            // This tells all clients in the "delivery-boys" room to refresh
            await emitEventHandler({
                event: "new-order-available", 
                room: "delivery-boys",        
                data: { 
                    message: "New delivery tasks available!", 
                    count: result.modifiedCount 
                }
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Success! Released ${result.modifiedCount} orders.` 
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}