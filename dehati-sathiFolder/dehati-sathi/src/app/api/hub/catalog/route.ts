import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Hub from "@/app/models/hub.model";
import MasterProduct from "@/app/models/masterProduct.model";
import MandiBhav from "@/app/models/mandiBhav.model";
import { auth } from "@/auth";

// GET — get all master products + which ones are enabled for this hub + their mandi bhav
export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // Find the hub this manager manages
    const hub = await Hub.findOne({ managerId: userId });
    if (!hub) return NextResponse.json({ success: false, error: "No hub found for this manager" }, { status: 404 });

    const allProducts = await MasterProduct.find({ isActive: true, isHubProduct: false }).sort({ category: 1, name: 1 }).lean();
    const enabledIds = (hub.enabledProducts || []).map((id: any) => id.toString());

    // Get mandi bhav for this hub
    const mandiBhavList = await MandiBhav.find({ hubId: hub._id }).lean();
    const mandiBhavMap: Record<string, any> = {};
    mandiBhavList.forEach((mb: any) => {
      mandiBhavMap[mb.masterProductId.toString()] = mb;
    });

    const products = allProducts.map((p: any) => ({
      ...p,
      isEnabled: enabledIds.includes(p._id.toString()),
      mandiBhav: mandiBhavMap[p._id.toString()] || null,
    }));

    return NextResponse.json({ success: true, products, hubId: hub._id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST — toggle enabled status of a product for this hub
export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const hub = await Hub.findOne({ managerId: userId });
    if (!hub) return NextResponse.json({ success: false, error: "No hub found" }, { status: 404 });

    const { productId, enable } = await req.json();
    const enabledProducts = (hub.enabledProducts || []).map((id: any) => id.toString());

    if (enable) {
      if (!enabledProducts.includes(productId)) {
        hub.enabledProducts.push(productId);
      }
    } else {
      hub.enabledProducts = hub.enabledProducts.filter((id: any) => id.toString() !== productId);
    }

    await hub.save();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
