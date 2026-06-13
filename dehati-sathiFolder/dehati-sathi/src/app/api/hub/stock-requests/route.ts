import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Hub from "@/app/models/hub.model";
import StockRequest from "@/app/models/stockRequest.model";
import MasterProduct from "@/app/models/masterProduct.model";
import { auth } from "@/auth";
import Grocery from "@/app/models/grocery.model";

// GET — hub manager views their stock requests + GST products with stock levels
export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const hub = await Hub.findOne({ managerId: userId }).lean() as any;
    if (!hub) return NextResponse.json({ success: false, error: "No hub found" }, { status: 404 });

    // Get ALL active GST products — they are globally managed by Admin and visible to all hubs
    // NOTE: enabledProducts is only for RAW/Mandi Bhav products, NOT for GST hub products
    const gstProducts = await MasterProduct.find({
      isActive: true,
      isHubProduct: true,
    }).lean();

    // Get all stock requests for this hub
    const requests = await StockRequest.find({ hubId: hub._id })
      .populate("masterProductId", "name nameHindi image unit category")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, gstProducts, requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST — hub manager creates a stock request
export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const hub = await Hub.findOne({ managerId: userId });
    if (!hub) return NextResponse.json({ success: false, error: "No hub found" }, { status: 404 });

    const { masterProductId, quantity } = await req.json();
    if (!masterProductId || !quantity || quantity < 1) {
      return NextResponse.json({ success: false, error: "Product and quantity required" }, { status: 400 });
    }

    // Verify it's a GST product
    const product = await MasterProduct.findById(masterProductId);
    if (!product || !product.isHubProduct) {
      return NextResponse.json({ success: false, error: "Not a hub product" }, { status: 400 });
    }

    const request = await StockRequest.create({
      hubId: hub._id,
      masterProductId,
      quantity,
      status: "pending",
    });

    return NextResponse.json({ success: true, request }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT — hub manager confirms receipt of stock
export async function PUT(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const hub = await Hub.findOne({ managerId: userId });
    if (!hub) return NextResponse.json({ success: false, error: "No hub found" }, { status: 404 });

    const { requestId } = await req.json();
    const stockReq = await StockRequest.findOne({ _id: requestId, hubId: hub._id });
    if (!stockReq) return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    if (stockReq.status !== "shipped") {
      return NextResponse.json({ success: false, error: "Can only confirm shipped requests" }, { status: 400 });
    }

    stockReq.status = "received";
    await stockReq.save();

    // Add stock to the hub's Grocery inventory
    const masterProduct = await MasterProduct.findById(stockReq.masterProductId);
    if (masterProduct) {
      let grocery = await Grocery.findOne({ 
        masterProductId: masterProduct._id, 
        seller: hub.managerId 
      });

      if (grocery) {
        grocery.stock += stockReq.quantity;
        // Also sync prices in case they changed
        grocery.retailPrice = masterProduct.retailPrice || 0;
        grocery.wholesalePrice = masterProduct.wholesalePrice || 0;
        grocery.price = masterProduct.retailPrice || 0;
        await grocery.save();
      } else {
        await Grocery.create({
          name: masterProduct.name,
          category: masterProduct.category,
          unit: masterProduct.unit,
          images: [masterProduct.image],
          seller: hub.managerId,
          masterProductId: masterProduct._id,
          stock: stockReq.quantity,
          retailPrice: masterProduct.retailPrice || 0,
          wholesalePrice: masterProduct.wholesalePrice || 0,
          price: masterProduct.retailPrice || 0, // Fallback price
          location: hub.location,
          productType: 'grocery'
        });
      }
    }

    return NextResponse.json({ success: true, message: "Stock received confirmed" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
