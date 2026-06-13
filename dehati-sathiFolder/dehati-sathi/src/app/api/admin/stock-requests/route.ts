import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import StockRequest from "@/app/models/stockRequest.model";
import Hub from "@/app/models/hub.model"; // Required for populate
import MasterProduct from "@/app/models/masterProduct.model"; // Required for populate
import { auth } from "@/auth";

// GET — admin views all stock requests
export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const requests = await StockRequest.find({})
      .populate("hubId", "name")
      .populate("masterProductId", "name nameHindi image unit category")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT — admin approves or ships a stock request
export async function PUT(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

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
