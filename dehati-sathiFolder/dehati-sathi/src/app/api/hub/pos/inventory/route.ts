export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Grocery from "@/app/models/grocery.model";
import Hub from "@/app/models/hub.model";
import User from "@/app/models/user.model";
import MasterProduct from "@/app/models/masterProduct.model";
import { auth } from "@/auth";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (session?.user?.role !== "hub") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        const hub = await Hub.findOne({ managerId: session.user.id }).lean() as any;
        if (!hub) return NextResponse.json({ error: "No hub found" }, { status: 404 });

        // Convert hub manager ID to ObjectId for proper Mongoose query
        const hubManagerObjectId = new mongoose.Types.ObjectId(session.user.id);

        // Get all sellers connected to this hub
        const connectedSellers = await User.find({ connectedHub: hub._id, role: 'seller' }).select('_id').lean();
        const sellerIds = connectedSellers.map((s: any) => s._id);

        // Include the Hub Manager's own inventory (use ObjectId, not string)
        const allTargetIds = [hubManagerObjectId, ...sellerIds];

        // Fetch Hub's own Grocery products + connected sellers' products
        const groceryProducts = await Grocery.find({ 
            seller: { $in: allTargetIds },
            $or: [{ status: 'active' }, { status: { $exists: false } }, { status: '' }]
        }).populate("seller", "name").sort({ createdAt: -1 }).lean();

        // Fetch ALL Hub GST Master Products (admin-created with fixed global prices)
        const masterProducts = await MasterProduct.find({
            isHubProduct: true,
            isActive: true
        }).lean();

        // Format master products to match Grocery shape for POS display
        const formattedMasterProducts = masterProducts.map((mp: any) => ({
            _id: mp._id,
            name: mp.name,
            nameHindi: mp.nameHindi || "",
            category: mp.category,
            unit: mp.unit,
            images: mp.image ? [mp.image] : [],
            retailPrice: mp.retailPrice || 0,
            wholesalePrice: mp.wholesalePrice || 0,
            price: mp.retailPrice || 0,
            stock: 999, // GST Hub products are always available (∞ stock shown in UI)
            seller: { _id: session.user.id, name: "Hub (GST)" },
            isHubProduct: true,
            masterProductId: mp._id,
        }));

        // GST products first, then seller/hub grocery items
        const combinedProducts = [...formattedMasterProducts, ...groceryProducts];

        return NextResponse.json({ 
            success: true, 
            products: combinedProducts,
        });
    } catch (error: any) {
        console.error("POS Inventory error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
