import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import MandiBhav from "@/app/models/mandiBhav.model";
import MasterProduct from "@/app/models/masterProduct.model";
import Hub from "@/app/models/hub.model";

export const dynamic = "force-dynamic";

// Public route — get mandi bhav for a hub (for buyer home page display)
export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const { searchParams } = new URL(req.url);
    let hubId = searchParams.get("hubId");

    if (!hubId) return NextResponse.json({ success: false, error: "hubId required" }, { status: 400 });

    let mandiBhavList = [];

    if (hubId === 'public') {
        mandiBhavList = await MandiBhav.find({})
            .limit(30)
            .populate("masterProductId", "name nameHindi category unit image")
            .sort({ updatedAt: -1 })
            .lean();

        // Deduplicate by masterProductId so we only show the latest price for each product
        const seen = new Set();
        mandiBhavList = mandiBhavList.filter((mb: any) => {
            if (!mb.masterProductId) return false;
            const pid = mb.masterProductId._id.toString();
            if (seen.has(pid)) return false;
            seen.add(pid);
            return true;
        });
    } else {
        const hub = await Hub.findById(hubId).lean() as any;
        if (!hub) return NextResponse.json({ success: false, error: "Hub not found" }, { status: 404 });

        const mongoose = require('mongoose');
        const hubObjectId = new mongoose.Types.ObjectId(hubId);
        const enabledProductIds = hub.enabledProducts || [];

        mandiBhavList = await MandiBhav.find({
            hubId: hubObjectId,
            ...(enabledProductIds.length ? { masterProductId: { $in: enabledProductIds } } : {}),
        }).populate("masterProductId", "name nameHindi category unit image").sort({ updatedAt: -1 }).lean();

        // FALLBACK: If this hub has no MandiBhav data, just fetch any global data
        if (mandiBhavList.length === 0) {
            mandiBhavList = await MandiBhav.find({})
                .limit(12)
                .populate("masterProductId", "name nameHindi category unit image")
                .sort({ updatedAt: -1 })
                .lean();
        }
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
