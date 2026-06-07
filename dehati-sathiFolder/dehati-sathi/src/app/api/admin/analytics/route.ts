import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import Order from "@/app/models/order.model";
import Grocery from "@/app/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 1. GET: Calculate Detailed Analytics & Breakdowns
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await connectDb();

        const orders = await Order.find({ status: 'delivered' }).populate({
            path: 'items.product',
            model: Grocery,
            select: 'seller price' 
        });

        const users = await User.find({ role: { $in: ['seller', 'deliveryBoy'] } });

        // --- 1. GLOBAL REVENUE BREAKDOWN ---
        let netPlatformIncome = 0; // Pure profit for App
        let totalSellerIncome = 0; // Money for Sellers
        let totalDeliveryIncome = 0; // Money for Drivers

        // --- 2. INDIVIDUAL LEDGERS ---
        const earningsMap: Record<string, number> = {};

        orders.forEach((order: any) => {
            // A. Platform Revenue
            netPlatformIncome += (order.platformFee || 0);

            // B. Delivery Revenue
            const dFee = order.deliveryFee || 0;
            totalDeliveryIncome += dFee;
            
            if (order.deliveryBoy) { 
                const dId = order.deliveryBoy.toString();
                earningsMap[dId] = (earningsMap[dId] || 0) + dFee;
            }

            // C. Seller Revenue
            order.items.forEach((item: any) => {
                const itemTotal = item.price * item.quantity;
                totalSellerIncome += itemTotal; // Add to Global Seller Volume

                if (item.product && item.product.seller) {
                    const sId = item.product.seller.toString();
                    earningsMap[sId] = (earningsMap[sId] || 0) + itemTotal;
                }
            });
        });

        // --- 3. FORMAT INDIVIDUAL DATA ---
        const financialData = users.map(u => {
            const calculatedEarnings = earningsMap[u._id.toString()] || 0;
            return {
                _id: u._id,
                name: u.name,
                role: u.role,
                shopName: u.sellerDetails?.shopName,
                lifetimeEarnings: calculatedEarnings, 
                paidAmount: (calculatedEarnings - (u.walletBalance || 0)), 
                pendingBalance: u.walletBalance || 0, // Use stored wallet balance
            };
        });

        return NextResponse.json({
            success: true,
            // 👇 NEW: Detailed Breakdown Object
            breakdown: {
                platform: netPlatformIncome,
                sellers: totalSellerIncome,
                delivery: totalDeliveryIncome,
                totalVolume: netPlatformIncome + totalSellerIncome + totalDeliveryIncome
            },
            sellers: financialData.filter(u => u.role === 'seller'),
            delivery: financialData.filter(u => u.role === 'deliveryBoy')
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// 2. POST: Process Payout
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { userId, amount, note } = await req.json();
        await connectDb();

        const user = await User.findById(userId);
        if(!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

        // Decrease Wallet Balance
        if(user.walletBalance === undefined) user.walletBalance = 0;
        user.walletBalance -= Number(amount);
        
        user.payoutHistory.push({
            amount: Number(amount),
            note: note || "Admin Payout",
            adminId: session.user.id
        });

        await user.save();

        return NextResponse.json({ success: true, message: "Payout Recorded Successfully" });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}