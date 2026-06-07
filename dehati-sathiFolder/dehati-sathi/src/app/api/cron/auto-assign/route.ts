import connectDb from "@/lib/db";
import Hub from "@/app/models/hub.model";
import Order from "@/app/models/order.model";
import User from "@/app/models/user.model";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import emitEventHandler from "@/lib/emitEventHandler"; // Import the helper

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDb();

        // 1. Get Current Time (IST)
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { 
            timeZone: "Asia/Kolkata", 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        };
        const currentTime = new Intl.DateTimeFormat('en-GB', options).format(now);
        
        console.log(`[Cron] Running... Current Time (IST): ${currentTime}`);

        // 2. Find Scheduled Hubs
        const hubsToProcess = await Hub.find({ 
            isActive: true, 
            autoAssignTime: currentTime 
        });

        if (hubsToProcess.length === 0) {
            return NextResponse.json({ message: `No hubs scheduled for ${currentTime}` });
        }

        let totalReleased = 0;
        const logs = [];

        // 3. Process Each Hub
        for (const hub of hubsToProcess) {
            const sellers = await User.find({ connectedHub: hub._id }).select('_id');
            const sellerIds = sellers.map(s => new mongoose.Types.ObjectId(s._id));

            if (hub.managerId) sellerIds.push(new mongoose.Types.ObjectId(hub.managerId));
            if (hub.manager) sellerIds.push(new mongoose.Types.ObjectId(hub.manager));

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
                logs.push(`Hub: ${hub.name} -> Released ${result.modifiedCount}`);
                totalReleased += result.modifiedCount;

                // 👇 FIRE SOCKET EVENT FOR CRON
                await emitEventHandler({
                    event: "new-order-available",
                    room: "delivery-boys",
                    data: { 
                        message: `New orders released from ${hub.name}!`,
                        count: result.modifiedCount 
                    }
                });
            }
        }

        console.log(`[Cron] Results: ${logs.join(", ")}`);

        return NextResponse.json({ 
            success: true, 
            time: currentTime,
            hubsMatched: hubsToProcess.length,
            totalReleased,
            logs
        });

    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}