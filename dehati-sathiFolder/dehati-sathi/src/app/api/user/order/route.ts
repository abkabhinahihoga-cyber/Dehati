import connectDb from "@/lib/db";
import Order from "@/app/models/order.model";
import Grocery from "@/app/models/grocery.model";
import User from "@/app/models/user.model";
import Hub from "@/app/models/hub.model";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb();

        // ✅ FIX 1: Use session for auth — never trust userId from body
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        const body = await req.json();
        const { items, paymentMethod, totalAmount, address, deliveryType, connectedHubId, walletDiscount } = body;

        // Basic Validation
        if (!items || items.length === 0 || !paymentMethod || !totalAmount || !address) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Check User exists
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        if (user.isBlocked) {
            return NextResponse.json({ message: "Your account has been blocked." }, { status: 403 });
        }

        // ✅ FIX: Wallet coupon application (₹5 max per order)
        const MAX_WALLET_USE_PER_ORDER = 5;
        let appliedWalletDiscount = 0;

        if (walletDiscount && walletDiscount > 0) {
            if (user.walletBalance < walletDiscount) {
                return NextResponse.json({ message: "Insufficient wallet balance." }, { status: 400 });
            }
            if (walletDiscount > MAX_WALLET_USE_PER_ORDER) {
                return NextResponse.json({ message: `You can only use ₹${MAX_WALLET_USE_PER_ORDER} wallet balance per order.` }, { status: 400 });
            }
            appliedWalletDiscount = walletDiscount;
        }

        // Compute final amount after wallet
        const finalAmount = Math.max(0, totalAmount - appliedWalletDiscount);

        // ✅ FIX: Stock validation and atomic deduction
        for (const item of items) {
            const product = await Grocery.findById(item.product);
            if (!product) {
                return NextResponse.json({ message: `Product "${item.name}" not found.` }, { status: 404 });
            }
            if (product.stock < item.quantity) {
                return NextResponse.json({ message: `"${item.name}" has only ${product.stock} units in stock.` }, { status: 400 });
            }
        }

        // Atomically decrement stock for each item
        for (const item of items) {
            await Grocery.findByIdAndUpdate(
                item.product,
                { $inc: { stock: -item.quantity } }
            );
        }

        // --- AUTO ASSIGN HUB ---
        let finalHubId = connectedHubId || (session.user as any).connectedHub || null;

        if (!finalHubId && address.latitude && address.longitude) {
            try {
                const nearestHub = await Hub.findOne({
                    location: {
                        $near: {
                            $geometry: { type: "Point", coordinates: [address.longitude, address.latitude] },
                            $maxDistance: 50000
                        }
                    }
                });
                if (nearestHub) finalHubId = nearestHub._id;
            } catch (err) {
                console.warn("Hub auto-assignment failed:", err);
            }
        }

        // Create Order
        const newOrder = await Order.create({
            user: userId,
            items,
            paymentMethod: "cod", // Online payments not yet enabled
            isPaid: false,
            totalAmount: finalAmount,
            walletDiscount: appliedWalletDiscount,
            address,
            deliveryType: deliveryType || 'home-delivery',
            connectedHub: finalHubId
        });

        // ✅ Deduct wallet balance atomically
        if (appliedWalletDiscount > 0) {
            await User.findByIdAndUpdate(userId, {
                $inc: { walletBalance: -appliedWalletDiscount }
            });
        }

        return NextResponse.json({ success: true, order: newOrder }, { status: 201 });

    } catch (error: any) {
        console.error("Order Placement Error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
