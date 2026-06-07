import connectDb from "@/lib/db";
import DeliveryAssignment from "@/app/models/deliveryAssignment.model";
import Order from "@/app/models/order.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        await connectDb();
        const { orderId } = await params; // Next.js 15 params are async
        const { status } = await req.json();

        const order = await Order.findById(orderId).populate("user");

        if (!order) {
            return NextResponse.json(
                { message: "order not found" },
                { status: 400 }
            );
        }

        order.status = status;
        let DeliveryBoysPayload: any = [];

        // Logic for finding delivery boys
        if (status === "out for delivery" && !order.assignment) {
            // Ensure these exist on order.address
            const { latitude, longitude } = order.address; 

            // Find nearby delivery boys
            const nearByDeliveryBoys = await User.find({
                role: "deliveryBoy",
                location: {
                    $near: {
                        $geometry: { 
                            type: "Point", 
                            // GeoJSON expects [Longitude, Latitude] order!
                            coordinates: [Number(longitude), Number(latitude)] 
                        },
                        $maxDistance: 3000 // 3km radius
                    }
                }
            });

            const nearByIds = nearByDeliveryBoys.map((b) => b._id);

            // Filter out busy boys
            const busyIds = await DeliveryAssignment.find({
                assignedTo: { $in: nearByIds },
                status: { $nin: ["brodcasted", "completed"] } // Check spelling of "brodcasted" vs "broadcasted"
            }).distinct("assignedTo");

            const busyIdSet = new Set(busyIds.map(b => String(b)));

            const availableDeliveryBoys = nearByDeliveryBoys.filter(
                b => !busyIdSet.has(String(b._id))
            );

            const candidates = availableDeliveryBoys.map(b => b._id);

            if (candidates.length == 0) {
                await order.save();
                return NextResponse.json(
                    { message: "there is no available Delivery boys" },
                    { status: 200 }
                );
            }

            // Create assignment
            const deliveryAssignment = await DeliveryAssignment.create({
                order: order._id, // FIXED: was order.order._id (incorrect)
                brodcastedTo: candidates,
                status: "brodcasted"
            });

            // FIXED: Syntax error (was a comma)
            order.assignment = deliveryAssignment._id;
            
            DeliveryBoysPayload = availableDeliveryBoys.map(b => ({
                id: b._id,
                name: b.name,
                mobile: b.mobile,
                // Accessing coordinates from the fixed User model
                latitude: b.location.coordinates[1], 
                longitude: b.location.coordinates[0]
            }));

            await deliveryAssignment.populate("order");
        }

        await order.save();
        await order.populate("user");

        return NextResponse.json({
            assignment: order.assignment?._id,
            availableBoys: DeliveryBoysPayload
        }, { status: 200 });

    } catch (error) {
        console.error("Update Status Error:", error);
        return NextResponse.json({
            message: `update status error ${error}`
        }, { status: 500 });
    }
}