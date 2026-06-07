export const dynamic = 'force-dynamic';
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Grocery from "@/app/models/grocery.model";
import User from "@/app/models/user.model"; // Ensure User model is loaded
import { NextRequest, NextResponse } from "next/server";
import uploadOnCloudinary from "@/lib/cloudinary";

type Props = {
  params: Promise<{ id: string }>;
};

// GET: Single Product
export async function GET(req: NextRequest, props: Props) {
    try {
        const params = await props.params;
        await connectDb();
        
        // Populate Seller & Reviews
        const product = await Grocery.findById(params.id)
            .populate({
                path: "seller",
                select: "name role sellerDetails image followersCount"
            })
            .populate({
                path: "reviews.user",
                select: "name image"
            });
        
        if (!product) {
            return NextResponse.json({ message: "Product not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, product });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// PUT: Update Product
export async function PUT(req: NextRequest, props: Props) {
    try {
        const params = await props.params;
        const session = await auth();
        
        // Auth Check
        if (session?.user?.role !== 'seller' && session?.user?.role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const formData = await req.formData();
        const updateData: any = {};

        // Helper to cleanly update fields
        const setIfPresent = (key: string, isNumber = false) => {
            const value = formData.get(key);
            if (value !== null && value !== undefined && value !== "") {
                updateData[key] = isNumber ? Number(value) : String(value);
            }
        };

        setIfPresent("name");
        setIfPresent("description");
        setIfPresent("category");
        setIfPresent("unit");
        setIfPresent("stock", true);
        setIfPresent("price", true);
        setIfPresent("retailPrice", true);
        setIfPresent("wholesalePrice", true);

        // Image Handling
        const imageFiles = formData.getAll("images") as File[];
        if (imageFiles.length > 0 && imageFiles[0].size > 0) {
             const settled = await Promise.allSettled(imageFiles.map((file) => uploadOnCloudinary(file)));
             const newUrls = settled.reduce<string[]>((acc, res) => {
                if (res.status === "fulfilled" && res.value) acc.push(res.value as string);
                return acc;
             }, []);
             
             if (newUrls.length > 0) updateData.images = newUrls;
        }

        await connectDb();

        // Security: Ensure user owns this product
        const updatedProduct = await Grocery.findOneAndUpdate(
            { _id: params.id, seller: session.user.id }, 
            updateData, 
            { new: true }
        );

        if (!updatedProduct) {
            return NextResponse.json({ message: "Product not found or access denied" }, { status: 404 });
        }

        return NextResponse.json({ success: true, product: updatedProduct });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// DELETE: Remove Product
export async function DELETE(req: NextRequest, props: Props) {
    try {
        const params = await props.params;
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await connectDb();

        const deletedProduct = await Grocery.findOneAndDelete({ 
            _id: params.id, 
            seller: session.user.id 
        });

        if (!deletedProduct) {
            return NextResponse.json({ message: "Product not found or access denied" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Product deleted" });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}