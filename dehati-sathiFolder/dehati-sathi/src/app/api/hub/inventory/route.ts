export const runtime = "nodejs";

import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Grocery from "@/app/models/grocery.model";
import Hub from "@/app/models/hub.model";
import uploadOnCloudinary from "@/lib/cloudinary"; 
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch Hub Inventory
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'hub') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        
        await connectDb();
        const products = await Grocery.find({ seller: session.user.id }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, products });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST: Add Hub Product
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'hub') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        
        // Validation
        const imageFiles = formData.getAll("images") as File[];
        if (!imageFiles || imageFiles.length === 0) {
            return NextResponse.json({ message: "At least one image is required" }, { status: 400 });
        }

        // Concurrent Upload
        const settled = await Promise.allSettled(imageFiles.map(file => uploadOnCloudinary(file)));
        const imageUrls = settled.reduce<string[]>((acc, res) => {
            if (res.status === "fulfilled" && res.value) acc.push(res.value as string);
            return acc;
        }, []);

        if (imageUrls.length === 0) return NextResponse.json({ message: "Image upload failed" }, { status: 500 });

        await connectDb();
        
        // Verify Hub Ownership
        const myHub = await Hub.findOne({ managerId: session.user.id });
        if (!myHub) return NextResponse.json({ message: "Hub profile not found" }, { status: 404 });

        // Create Product
        const newProduct = await Grocery.create({
            name: String(formData.get("name")),
            price: parseFloat(String(formData.get("price"))),
            category: String(formData.get("category")),
            unit: String(formData.get("unit")),
            stock: parseInt(String(formData.get("stock"))),
            description: String(formData.get("description")),
            images: imageUrls,
            seller: session.user.id,
            location: myHub.location, // Sync location with Hub
            productType: 'grocery',
            retailPrice: parseFloat(String(formData.get("price"))), 
            wholesalePrice: parseFloat(String(formData.get("price"))) 
        });

        return NextResponse.json({ success: true, message: "Item Added", product: newProduct });

    } catch (error: any) {
        console.error("Hub Inventory Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// PUT: Update Hub Product
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'hub') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        const productId = String(formData.get("id"));
        
        await connectDb();
        const product = await Grocery.findOne({ _id: productId, seller: session.user.id });
        
        if(!product) return NextResponse.json({ message: "Product not found" }, { status: 404 });

        // Update Fields
        product.name = String(formData.get("name"));
        const price = parseFloat(String(formData.get("price")));
        product.price = price;
        product.retailPrice = price;
        product.wholesalePrice = price;
        
        product.category = String(formData.get("category"));
        product.unit = String(formData.get("unit"));
        product.stock = parseInt(String(formData.get("stock")));
        product.description = String(formData.get("description"));

        // Handle Image Updates
        const imageFiles = formData.getAll("images") as File[];
        if (imageFiles.length > 0 && imageFiles[0].size > 0) {
            const settled = await Promise.allSettled(imageFiles.map(file => uploadOnCloudinary(file)));
            const newUrls = settled.reduce<string[]>((acc, res) => {
                if (res.status === "fulfilled" && res.value) acc.push(res.value as string);
                return acc;
            }, []);
            
            if (newUrls.length > 0) product.images = newUrls;
        }

        await product.save();

        return NextResponse.json({ success: true, message: "Product Updated" });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}