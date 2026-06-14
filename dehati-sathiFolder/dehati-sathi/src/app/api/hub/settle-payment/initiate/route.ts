import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Hub from "@/app/models/hub.model";
import User from "@/app/models/user.model";
import Notification from "@/app/models/notification.model";
import { auth } from "@/auth";

// Generate a random 6-char alphanumeric settlement code
function generateSettlementCode(): string {
  return Math.random().toString(36).toUpperCase().slice(2, 8);
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (session?.user?.role !== "hub") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { sellerId, amount, netPayable, taxAmount } = await req.json();

    if (!sellerId || !amount) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const hub = await Hub.findOne({ managerId: session.user.id }).lean() as any;
    if (!hub) return NextResponse.json({ error: "Hub not found" }, { status: 404 });

    // Verify seller is connected to this hub
    const seller = await User.findOne({ _id: sellerId, connectedHub: hub._id, role: "seller" });
    if (!seller) return NextResponse.json({ error: "Seller not found or not linked to this hub" }, { status: 404 });

    // Generate unique settlement code
    const code = generateSettlementCode();

    // Send notification to seller with settlement code
    await Notification.create({
      recipient: seller._id,
      sender: session.user.id,
      type: "system",
      message: `💰 Settlement Initiated! Please share this OTP with the hub manager to complete your payout of ₹${netPayable || amount}.\n\nSettlement OTP: ${code}`,
      relatedId: code, // Used for verification later
    });

    return NextResponse.json({
      success: true,
      message: `Settlement initiated. OTP sent to seller.`,
    });
  } catch (error: any) {
    console.error("Settlement Initiate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
