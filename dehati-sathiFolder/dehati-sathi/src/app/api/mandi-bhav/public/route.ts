import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import MandiBhav from "@/app/models/mandiBhav.model";
import MasterProduct from "@/app/models/masterProduct.model";
import Hub from "@/app/models/hub.model";

// Public route — get mandi bhav for a hub (for buyer home page display)
export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const { searchParams } = new URL(req.url);
    let hubId = searchParams.get("hubId");

    if (!hubId) return NextResponse.json({ success: false, error: "hubId required" }, { status: 400 });

    let hub;
    if (hubId === 'public') {
        hub = await Hub.findOne().lean() as any;
        if (hub) hubId = hub._id.toString();
    } else {
        hub = await Hub.findById(hubId).lean() as any;
    }

    if (!hub) return NextResponse.json({ success: false, error: "Hub not found" }, { status: 404 });

    const enabledProductIds = hub.enabledProducts || [];
    let mandiBhavList = await MandiBhav.find({
      hubId,
      masterProductId: { $in: enabledProductIds },
    }).populate("masterProductId", "name nameHindi category unit image").lean();

    // FALLBACK: If this hub has no MandiBhav data, just fetch any global data
    if (mandiBhavList.length === 0) {
      mandiBhavList = await MandiBhav.find({})
        .limit(10)
        .populate("masterProductId", "name nameHindi category unit image")
        .lean();
    }

    const result = mandiBhavList.map((mb: any) => ({
      _id: mb._id,
      product: mb.masterProductId,
      price: mb.retailPrice || 0, // retailPrice serves as current display price
      retailPrice: mb.retailPrice || 0,
      retailMinPrice: mb.retailMinPrice || 0,
      retailMaxPrice: mb.retailMaxPrice || 0,
      wholesalePrice: mb.wholesalePrice || 0,
      wholesaleMinPrice: mb.wholesaleMinPrice || 0,
      wholesaleMaxPrice: mb.wholesaleMaxPrice || 0,
      minPrice: mb.retailMinPrice || 0,
      maxPrice: mb.retailMaxPrice || 0,
      updatedAt: mb.updatedAt,
    }));

    return NextResponse.json({ success: true, mandiBhav: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
