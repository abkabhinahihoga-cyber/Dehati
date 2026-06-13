import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import StockRequest from "@/app/models/stockRequest.model";
import Hub from "@/app/models/hub.model"; // Required for populate
import MasterProduct from "@/app/models/masterProduct.model"; // Required for populate
import User from "@/app/models/user.model"; // Required for populate via Hub
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

// GET — admin views all stock requests
export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    await connectDb();

    // Prevent Turbopack from tree-shaking these models which are required for populate
    console.log("Models loaded:", Hub.modelName, MasterProduct.modelName, User.modelName);

    const requests = await StockRequest.find({})
      .populate("hubId", "name")
      .populate("masterProductId", "name nameHindi image unit category")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("ADMIN STOCK REQUESTS ERROR:", error);
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}

// PUT — admin approves or ships a stock request
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    await connectDb();

    const { requestId, action } = await req.json();
    const stockReq = await StockRequest.findById(requestId);
    if (!stockReq) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    if (action === "approve" && stockReq.status === "pending") {
      stockReq.status = "approved";
    } else if (action === "ship" && (stockReq.status === "approved" || stockReq.status === "pending")) {
      stockReq.status = "shipped";
    } else if (action === "reject") {
      await StockRequest.findByIdAndDelete(requestId);
      return NextResponse.json({ success: true, message: "Request rejected and removed" });
    } else {
      return NextResponse.json({ success: false, error: `Cannot ${action} a ${stockReq.status} request` }, { status: 400 });
    }

    await stockReq.save();
    return NextResponse.json({ success: true, message: `Request ${action}d successfully` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
