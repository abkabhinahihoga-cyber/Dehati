import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Hub from "@/app/models/hub.model";
import MandiBhav from "@/app/models/mandiBhav.model";
import MasterProduct from "@/app/models/masterProduct.model";
import User from "@/app/models/user.model";
import { auth } from "@/auth";

// GET — seller fetches hub-enabled products with mandi bhav prices
export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // Find which hub this seller is connected to
    const seller = await User.findById(userId).select("connectedHub").lean() as any;
    if (!seller?.connectedHub) {
      return NextResponse.json({ success: false, error: "Not connected to any hub" }, { status: 400 });
    }

    const hub = await Hub.findById(seller.connectedHub).lean() as any;
    if (!hub) return NextResponse.json({ success: false, error: "Hub not found" }, { status: 404 });

    const enabledProductIds = hub.enabledProducts || [];
    if (enabledProductIds.length === 0) {
      return NextResponse.json({ success: true, products: [] });
    }

    const products = await MasterProduct.find({
      _id: { $in: enabledProductIds },
      isActive: true,
    }).sort({ category: 1, name: 1 }).lean();

    const mandiBhavList = await MandiBhav.find({
      hubId: hub._id,
      masterProductId: { $in: enabledProductIds },
    }).lean();

    const mandiBhavMap: Record<string, any> = {};
    mandiBhavList.forEach((mb: any) => {
      mandiBhavMap[mb.masterProductId.toString()] = mb;
    });

    const result = products.map((p: any) => ({
      ...p,
      mandiBhav: mandiBhavMap[p._id.toString()] || { price: 0, minPrice: 0, maxPrice: 0 },
    }));

    return NextResponse.json({ success: true, products: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
