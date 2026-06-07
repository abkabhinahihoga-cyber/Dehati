import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Order from "@/app/models/order.model";
import Hub from "@/app/models/hub.model";
import Grocery from "@/app/models/grocery.model";
import redis from "@/lib/redis";
import { auth } from "@/auth"; // Depending on how auth is handled

export async function GET(req: Request) {
  try {
    await connectDb();
    
    const { searchParams } = new URL(req.url);
    const lastSyncStr = searchParams.get("lastSync");
    const userId = searchParams.get("userId"); // Assuming passed for simplicity or extracted from auth token
    
    // For rural offline logic, if lastSync is 0, we pull the initial payload
    const lastSyncDate = lastSyncStr ? new Date(parseInt(lastSyncStr)) : new Date(0);

    // 1. Fetch updated Hubs
    const updatedHubs = await Hub.find({ updatedAt: { $gt: lastSyncDate } }).lean();

    // 2. Fetch updated Orders for this specific user
    let updatedOrders: any[] = [];
    if (userId) {
      updatedOrders = await Order.find({ 
        user: userId, 
        updatedAt: { $gt: lastSyncDate } 
      }).lean();
    }

    // 3. Fetch AI Dynamic Feed (Cached in Redis)
    let aiGroceryFeed: any[] = [];
    let aiStudentFeed: any[] = [];
    
    if (userId && redis) {
      const groceryKey = `user:rec:${userId}:grocery`;
      const studentKey = `user:rec:${userId}:student`;
      
      const groceryIds = await redis.lrange(groceryKey, 0, -1);
      const studentIds = await redis.lrange(studentKey, 0, -1);
      
      if (groceryIds.length > 0) {
         aiGroceryFeed = await Grocery.find({ _id: { $in: groceryIds } }).lean();
      }
      if (studentIds.length > 0) {
         aiStudentFeed = await Grocery.find({ _id: { $in: studentIds } }).lean();
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      data: {
        hubs: updatedHubs,
        orders: updatedOrders,
        feed: {
           grocery: aiGroceryFeed,
           student: aiStudentFeed
        }
      }
    });
  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
