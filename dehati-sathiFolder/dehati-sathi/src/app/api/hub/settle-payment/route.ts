import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Hub from "@/app/models/hub.model";
import User from "@/app/models/user.model";
import Order from "@/app/models/order.model";
import Notification from "@/app/models/notification.model";
import { auth } from "@/auth";

// Generate a random 6-char alphanumeric settlement code
function generateSettlementCode(): string {
  return Math.random().toString(36).toUpperCase().slice(2, 8);
}

// GET: Get unsettled earnings for each connected seller in the hub
export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    if (session?.user?.role !== "hub") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const hub = await Hub.findOne({ managerId: session.user.id }).lean() as any;
    if (!hub) return NextResponse.json({ error: "Hub not found" }, { status: 404 });

    // Get all connected sellers
    const sellers = await User.find({ connectedHub: hub._id, role: "seller" })
      .select("_id name mobile walletBalance totalEarnings payoutHistory")
      .lean();

    // For each seller, compute their total delivered order earnings that haven't been paid out
    const sellerData = await Promise.all(
      sellers.map(async (seller: any) => {
        // Sum of delivered orders containing items from this seller
        const ordersAgg = await Order.aggregate([
          {
            $match: {
              connectedHub: hub._id,
              status: "delivered",
            },
          },
          { $unwind: "$items" },
          {
            $match: {
              "items.seller": seller._id,
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: { $multiply: ["$items.price", "$items.quantity"] },
              },
            },
          },
        ]);

        const grossEarnings = ordersAgg[0]?.totalRevenue || 0;
        const totalPaid = seller.payoutHistory?.reduce(
          (sum: number, p: any) => sum + (p.amount || 0),
          0
        ) || 0;
        const pendingEarnings = Math.max(0, grossEarnings - totalPaid);
        const taxAmount = parseFloat((pendingEarnings * 0.04).toFixed(2));
        const netPayable = parseFloat((pendingEarnings - taxAmount).toFixed(2));

        return {
          _id: seller._id,
          name: seller.name,
          mobile: seller.mobile || "",
          grossEarnings: parseFloat(grossEarnings.toFixed(2)),
          totalPaid,
          pendingEarnings: parseFloat(pendingEarnings.toFixed(2)),
          taxAmount,
          netPayable,
        };
      })
    );

    return NextResponse.json({ success: true, sellers: sellerData });
  } catch (error: any) {
    console.error("Settlement GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (session?.user?.role !== "hub") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { sellerId, amount, netPayable, taxAmount, code } = await req.json();

    if (!sellerId || !amount || !code) {
      return NextResponse.json({ error: "Invalid data or missing OTP code" }, { status: 400 });
    }

    const hub = await Hub.findOne({ managerId: session.user.id }).lean() as any;
    if (!hub) return NextResponse.json({ error: "Hub not found" }, { status: 404 });

    // Verify seller is connected to this hub
    const seller = await User.findOne({ _id: sellerId, connectedHub: hub._id, role: "seller" });
    if (!seller) return NextResponse.json({ error: "Seller not found or not linked to this hub" }, { status: 404 });

    // Find the matching notification with the OTP code
    const notification = await Notification.findOne({
      recipient: seller._id,
      type: "system",
      relatedId: code
    });

    if (!notification) {
      return NextResponse.json({ error: "Invalid OTP code. Please check again." }, { status: 400 });
    }

    // Record payout in seller's history
    seller.payoutHistory.push({
      amount: netPayable || amount,
      note: `Settlement by Hub (Code: ${code}). Gross: ₹${amount}. Tax (4%): ₹${taxAmount || 0}. Net: ₹${netPayable || amount}`,
      adminId: session.user.id,
    });
    seller.walletBalance = (seller.walletBalance || 0) + (netPayable || amount);
    seller.totalEarnings = (seller.totalEarnings || 0) + (netPayable || amount);
    await seller.save();

    // Invalidate the code so it cannot be used again
    notification.relatedId = code + "_used";
    await notification.save();

    // Send confirmation notification to seller
    await Notification.create({
      recipient: seller._id,
      sender: session.user.id,
      type: "system",
      message: `✅ Payment of ₹${netPayable || amount} has been successfully settled by the hub!`,
    });

    return NextResponse.json({
      success: true,
      message: `Payment of ₹${netPayable || amount} settled for ${seller.name}.`,
    });
  } catch (error: any) {
    console.error("Settlement Verify error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
