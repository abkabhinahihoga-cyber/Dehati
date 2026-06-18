export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Grocery from "@/app/models/grocery.model";
import User from "@/app/models/user.model";
import Hub from "@/app/models/hub.model";
import uploadOnCloudinary from "@/lib/cloudinary";
import { auth } from "@/auth";
import { normalizeCategory } from "@/lib/constants";

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (session?.user?.role !== "hub") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        const url = new URL(req.url);
        const sellerId = url.searchParams.get("sellerId");
        
        if (!sellerId) return NextResponse.json({ error: "sellerId is required" }, { status: 400 });

        const products = await Grocery.find({ seller: sellerId }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, products });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (session?.user?.role !== "hub") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        const formData = await req.formData();
        const sellerId = String(formData.get("sellerId"));

        const seller = await User.findById(sellerId);
        if (!seller || seller.role !== 'seller') {
            return NextResponse.json({ error: "Valid seller not found" }, { status: 404 });
        }

        const name = String(formData.get("name") || "");
        const description = String(formData.get("description") || ""); 
        const category = normalizeCategory(String(formData.get("category") || ""));
        const unit = String(formData.get("unit") || "");
        const stock = Number(formData.get("stock") || 1);
        const wholesalePrice = Number(formData.get("wholesalePrice") || 0);
        const retailPrice = Number(formData.get("retailPrice") || 0);

        const imageFiles = formData.getAll("images") as File[];
        if (!imageFiles || imageFiles.length === 0) {
            return NextResponse.json({ error: "No image files found" }, { status: 400 });
        }

        const settled = await Promise.allSettled(imageFiles.map((file) => uploadOnCloudinary(file)));
        const imageUrls = settled.reduce<string[]>((acc, res) => {
            if (res.status === "fulfilled" && res.value) acc.push(res.value as string);
            return acc;
        }, []);

        if (imageUrls.length === 0) return NextResponse.json({ error: "Cloudinary upload failed" }, { status: 500 });

        const newProduct = await Grocery.create({
            name,
            description,
            category,
            unit,
            stock,
            wholesalePrice,
            retailPrice,
            price: retailPrice,
            images: imageUrls,
            seller: sellerId, // added on behalf
            productType: 'grocery',
            location: {
                type: 'Point',
                coordinates: seller.location?.coordinates || [0, 0] // fallback
            }
        });

        return NextResponse.json({ success: true, data: newProduct }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (session?.user?.role !== "hub") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        const formData = await req.formData();
        const productId = String(formData.get("id"));
        
        const product = await Grocery.findById(productId);
        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        product.name = String(formData.get("name") || product.name);
        product.description = String(formData.get("description") || product.description);
        product.category = normalizeCategory(String(formData.get("category") || product.category));
        product.unit = String(formData.get("unit") || product.unit);
        product.stock = Number(formData.get("stock") || product.stock);
        product.wholesalePrice = Number(formData.get("wholesalePrice") || product.wholesalePrice);
        product.retailPrice = Number(formData.get("retailPrice") || product.retailPrice);
        product.price = product.retailPrice;

        const imageFiles = formData.getAll("images") as File[];
        if (imageFiles && imageFiles.length > 0 && imageFiles[0].size > 0) {
            const settled = await Promise.allSettled(imageFiles.map((file) => uploadOnCloudinary(file)));
            const imageUrls = settled.reduce<string[]>((acc, res) => {
                if (res.status === "fulfilled" && res.value) acc.push(res.value as string);
                return acc;
            }, []);
            if (imageUrls.length > 0) {
                product.images = imageUrls;
            }
        }

        await product.save();
        return NextResponse.json({ success: true, data: product });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
