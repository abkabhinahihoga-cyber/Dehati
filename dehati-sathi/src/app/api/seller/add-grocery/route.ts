import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/db"; 
import Grocery from "@/app/models/grocery.model";
import uploadOnCloudinary from "@/app/lib/cloudinary";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const formData = await req.formData();

        // Extract text fields
        const name = formData.get("name") as string;
        const category = formData.get("category") as string;
        const unit = formData.get("unit") as string;
        const minPrice = Number(formData.get("minPrice"));
        const maxPrice = Number(formData.get("maxPrice"));
        const stock = Number(formData.get("stock"));

        // Extract multiple images
        const imageFiles = formData.getAll("images") as Blob[];
        
        if (imageFiles.length === 0) {
            return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
        }

        // Upload all images to Cloudinary in parallel
        const uploadPromises = imageFiles.map(file => uploadOnCloudinary(file));
        const imageUrls = (await Promise.all(uploadPromises)).filter(url => url !== null);

        // Logic: Primary price is the minPrice (for listing pages)
        const newGrocery = await Grocery.create({
            name,
            category,
            unit,
            minPrice,
            maxPrice,
            price: minPrice, // Saved as the reference price
            stock,
            images: imageUrls
        });

        return NextResponse.json({ 
            success: true, 
            message: "Product added successfully", 
            data: newGrocery 
        }, { status: 201 });

    } catch (error: any) {
        console.error("Route Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}