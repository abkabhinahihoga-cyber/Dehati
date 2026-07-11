import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import Order from "@/app/models/order.model";
import Grocery from "@/app/models/grocery.model";
import WorkOpportunity from "@/app/models/workOpportunity.model";
import WorkApplication from "@/app/models/workApplication.model";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Helper for date filtering
const getStartOfDay = (date: Date) => new Date(date.setHours(0, 0, 0, 0));

// 1. GET: Calculate Detailed Analytics & Breakdowns
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await connectDb();

        const now = new Date();
        const today = getStartOfDay(new Date());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtySecondsAgo = new Date(now.getTime() - 60 * 1000);

        // --- 0. COMPREHENSIVE ANALYTICS ---
        
        // Users
        const totalUsers = await User.countDocuments();
        const onlineUsers = await User.countDocuments({ lastSeen: { $gte: sixtySecondsAgo } });
        const dau = await User.countDocuments({ lastSeen: { $gte: today } });
        const wau = await User.countDocuments({ lastSeen: { $gte: sevenDaysAgo } });
        const mau = await User.countDocuments({ lastSeen: { $gte: thirtyDaysAgo } });
        const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
        
        // Segments
        const totalFarmers = await User.countDocuments({ role: 'seller' });
        const totalBuyers = await User.countDocuments({ role: 'user' });
        const totalWorkers = await User.countDocuments({ 'workerProfile.isWorker': true });
        
        const activeFarmersToday = await User.countDocuments({ role: 'seller', lastSeen: { $gte: today } });
        const activeBuyersToday = await User.countDocuments({ role: 'user', lastSeen: { $gte: today } });
        const activeWorkersToday = await User.countDocuments({ 'workerProfile.isWorker': true, lastSeen: { $gte: today } });

        // Marketplace
        const totalProducts = await Grocery.countDocuments();
        const productsToday = await Grocery.countDocuments({ createdAt: { $gte: today } });
        
        const totalOrdersCount = await Order.countDocuments();
        const ordersToday = await Order.countDocuments({ createdAt: { $gte: today } });
        const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
        const pendingOrders = await Order.countDocuments({ status: { $in: ['pending', 'processing', 'ready', 'picked_up', 'ready_at_hub', 'out_for_delivery'] } });
        const cancelledOrders = await Order.countDocuments({ status: { $in: ['rejected', 'cancelled'] } });
        
        const allOrders = await Order.find({}).select('totalAmount status createdAt');
        const totalTransactionValue = allOrders.filter(o => o.status === 'delivered' || o.status === 'completed').reduce((acc, o) => acc + (o.totalAmount || 0), 0);

        // Jobs
        const totalJobs = await WorkOpportunity.countDocuments();
        const jobsToday = await WorkOpportunity.countDocuments({ createdAt: { $gte: today } });
        const activeJobs = await WorkOpportunity.countDocuments({ isActive: true });
        const completedJobs = await WorkApplication.countDocuments({ status: 'completed' });
        
        const allCompletedApps = await WorkApplication.find({ status: 'completed' }).select('totalEarnings');
        const totalJobEarnings = allCompletedApps.reduce((acc, app) => acc + (app.totalEarnings || 0), 0);

        const allUsers = await User.find({ role: { $ne: 'admin' } }).select('name email mobile role lastSeen createdAt').sort({ lastSeen: -1 }).lean();
        const recentLogins = allUsers.slice(0, 10);

        // Legacy fetch for revenue breakdown
        const orders = await Order.find({ status: { $in: ['delivered', 'completed'] } }).populate({
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
            
            // NEW COMPREHENSIVE METRICS
            metrics: {
                users: {
                    total: totalUsers,
                    online: onlineUsers,
                    dau, wau, mau,
                    newToday: newUsersToday,
                    returningToday: Math.max(0, dau - newUsersToday),
                    retentionRate: totalUsers > 0 ? ((dau / totalUsers) * 100).toFixed(1) : "0",
                    segments: {
                        farmers: totalFarmers, buyers: totalBuyers, workers: totalWorkers,
                        activeFarmers: activeFarmersToday, activeBuyers: activeBuyersToday, activeWorkers: activeWorkersToday
                    }
                },
                marketplace: {
                    productsTotal: totalProducts,
                    productsToday,
                    ordersTotal: totalOrdersCount,
                    ordersToday,
                    delivered: deliveredOrders,
                    pending: pendingOrders,
                    cancelled: cancelledOrders,
                    transactionValue: totalTransactionValue
                },
                jobs: {
                    total: totalJobs,
                    today: jobsToday,
                    active: activeJobs,
                    completed: completedJobs,
                    earnings: totalJobEarnings
                },
                realtime: {
                    recentLogins
                }
            },

            // LEGACY FINANCIAL BREAKDOWN
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