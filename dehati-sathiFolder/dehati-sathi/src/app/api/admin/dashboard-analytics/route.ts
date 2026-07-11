import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import Order from "@/app/models/order.model";
import MasterProduct from "@/app/models/masterProduct.model";
import WorkOpportunity from "@/app/models/workOpportunity.model";
import { subDays, startOfDay, endOfDay, subMinutes } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDb();

        const now = new Date();
        const startOfToday = startOfDay(now);
        const endOfToday = endOfDay(now);
        const oneMinuteAgo = subMinutes(now, 1);
        const sevenDaysAgo = subDays(startOfToday, 7);
        const thirtyDaysAgo = subDays(startOfToday, 30);

        // --- USER ANALYTICS ---
        const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });
        const onlineUsersCount = await User.countDocuments({ role: { $ne: "admin" }, lastSeen: { $gte: oneMinuteAgo } });
        const dau = await User.countDocuments({ role: { $ne: "admin" }, lastSeen: { $gte: startOfToday } });
        const wau = await User.countDocuments({ role: { $ne: "admin" }, lastSeen: { $gte: sevenDaysAgo } });
        const mau = await User.countDocuments({ role: { $ne: "admin" }, lastSeen: { $gte: thirtyDaysAgo } });
        const newToday = await User.countDocuments({ role: { $ne: "admin" }, createdAt: { $gte: startOfToday, $lte: endOfToday } });
        
        // Returning users are active today but created before today
        const returningUsers = await User.countDocuments({ 
            role: { $ne: "admin" }, 
            lastSeen: { $gte: startOfToday },
            createdAt: { $lt: startOfToday } 
        });
        const retentionRate = totalUsers > 0 ? ((returningUsers / totalUsers) * 100).toFixed(1) : "0.0";

        // --- USER SEGMENTS ---
        const totalSellers = await User.countDocuments({ role: "seller" });
        const totalBuyers = await User.countDocuments({ role: "user" }); // ordinary users
        const totalWorkers = await User.countDocuments({ "workerProfile.isWorker": true });

        const activeSellersToday = await User.countDocuments({ role: "seller", lastSeen: { $gte: startOfToday } });
        const activeBuyersToday = await User.countDocuments({ role: "user", lastSeen: { $gte: startOfToday } });
        const activeWorkersToday = await User.countDocuments({ "workerProfile.isWorker": true, lastSeen: { $gte: startOfToday } });

        // --- JOB ANALYTICS ---
        const totalJobs = await WorkOpportunity.countDocuments();
        const jobsToday = await WorkOpportunity.countDocuments({ createdAt: { $gte: startOfToday, $lte: endOfToday } });
        const activeJobs = await WorkOpportunity.countDocuments({ status: "open" });
        const completedJobsDocs = await WorkOpportunity.find({ status: "completed" }, "budget").lean();
        const completedJobs = completedJobsDocs.length;
        const totalEarningsFromJobs = completedJobsDocs.reduce((acc: number, job: any) => acc + (job.budget || 0), 0);

        // --- MARKETPLACE ANALYTICS ---
        const totalProducts = await MasterProduct.countDocuments();
        const productsToday = await MasterProduct.countDocuments({ createdAt: { $gte: startOfToday, $lte: endOfToday } });
        
        const totalOrders = await Order.countDocuments();
        const ordersTodayDocs = await Order.find({ createdAt: { $gte: startOfToday, $lte: endOfToday } }).lean();
        const ordersToday = ordersTodayDocs.length;

        const deliveredOrders = await Order.countDocuments({ status: "delivered" });
        const pendingOrders = await Order.countDocuments({ status: "pending" });
        const cancelledOrders = await Order.countDocuments({ status: "cancelled" });

        const allOrdersDocs = await Order.find({}, "totalAmount status").lean();
        const totalTransactionValue = allOrdersDocs
            .filter((o: any) => o.status === "delivered")
            .reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);

        // --- REAL-TIME ACTIVITY ---
        const onlineUsersDetails = await User.find(
            { role: { $ne: "admin" }, lastSeen: { $gte: oneMinuteAgo } },
            "name mobile role image lastSeen"
        ).sort({ lastSeen: -1 }).limit(10).lean();

        const recentOrders = await Order.find({})
            .populate("user", "name mobile")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const recentJobs = await WorkOpportunity.find({})
            .populate("postedBy", "name mobile")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Let's create a rough 7-day trend for charts
        const userGrowthTrend = [];
        const revenueTrend = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = subDays(startOfToday, i);
            const dayEnd = endOfDay(dayStart);
            const dayName = dayStart.toLocaleDateString("en-US", { weekday: "short" });

            const newUsers = await User.countDocuments({ role: { $ne: "admin" }, createdAt: { $gte: dayStart, $lte: dayEnd } });
            userGrowthTrend.push({ name: dayName, users: newUsers });

            const dayOrders = await Order.find({ status: "delivered", createdAt: { $gte: dayStart, $lte: dayEnd } }, "totalAmount").lean();
            const rev = dayOrders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
            revenueTrend.push({ name: dayName, revenue: rev });
        }

        return NextResponse.json({
            success: true,
            analytics: {
                users: {
                    totalUsers, onlineUsersCount, dau, wau, mau, newToday, returningUsers, retentionRate
                },
                segments: {
                    totalSellers, totalBuyers, totalWorkers,
                    activeSellersToday, activeBuyersToday, activeWorkersToday
                },
                jobs: {
                    totalJobs, jobsToday, activeJobs, completedJobs, totalEarningsFromJobs
                },
                marketplace: {
                    totalProducts, productsToday, totalOrders, ordersToday, 
                    deliveredOrders, pendingOrders, cancelledOrders, totalTransactionValue
                },
                realtime: {
                    onlineUsersDetails, recentOrders, recentJobs
                },
                trends: {
                    userGrowthTrend, revenueTrend
                }
            }
        });

    } catch (error: any) {
        console.error("Analytics Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
