import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Hub from "@/app/models/hub.model";
import MandiBhav from "@/app/models/mandiBhav.model";
import MasterProduct from "@/app/models/masterProduct.model";
import { auth } from "@/auth";

// GET — get mandi bhav prices for this hub's enabled products
export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const hub = await Hub.findOne({ managerId: userId }).lean() as any;
    if (!hub) return NextResponse.json({ success: false, error: "No hub found" }, { status: 404 });

    const enabledProductIds = hub.enabledProducts || [];
    const products = await MasterProduct.find({ _id: { $in: enabledProductIds }, isActive: true, isHubProduct: false }).lean();
    const mandiBhavList = await MandiBhav.find({ hubId: hub._id }).lean();

    const mandiBhavMap: Record<string, any> = {};
    mandiBhavList.forEach((mb: any) => {
      mandiBhavMap[mb.masterProductId.toString()] = mb;
    });

    const result = products.map((p: any) => ({
      ...p,
      mandiBhav: mandiBhavMap[p._id.toString()] || { 
        retailMinPrice: 0, retailMaxPrice: 0,
        wholesaleMinPrice: 0, wholesaleMaxPrice: 0
      },
    }));

    return NextResponse.json({ success: true, products: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT — update mandi bhav for one or more products
export async function PUT(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const hub = await Hub.findOne({ managerId: userId });
    if (!hub) return NextResponse.json({ success: false, error: "No hub found" }, { status: 404 });

    // updates = array of { masterProductId, retailMinPrice, retailMaxPrice, wholesaleMinPrice, wholesaleMaxPrice }
    const { updates } = await req.json();

    const ops = updates.map((u: any) => ({
      updateOne: {
        filter: { hubId: hub._id, masterProductId: u.masterProductId },
        update: {
          $set: {
            retailMinPrice: u.retailMinPrice,
            retailMaxPrice: u.retailMaxPrice,
            retailPrice: u.retailPrice ?? u.retailMaxPrice ?? u.retailMinPrice ?? 0,
            wholesaleMinPrice: u.wholesaleMinPrice,
            wholesaleMaxPrice: u.wholesaleMaxPrice,
            wholesalePrice: u.wholesalePrice ?? u.wholesaleMaxPrice ?? u.wholesaleMinPrice ?? 0,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await MandiBhav.bulkWrite(ops);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
