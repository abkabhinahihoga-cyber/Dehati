export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Grocery from "@/app/models/grocery.model";
import User from "@/app/models/user.model"; // Import User model
import uploadOnCloudinary from "@/lib/cloudinary";
import { auth } from "@/auth";
import { normalizeCategory } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // Allow Sellers and Admins
    if (session?.user?.role !== 'seller' && session?.user?.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    await dbConnect();
    const formData = await req.formData();

    // 1. Common Fields
    const name = String(formData.get("name") || "");
    const description = String(formData.get("description") || ""); 
    const category = normalizeCategory(String(formData.get("category") || ""));
    const stock = Number(formData.get("stock") || 1);
    const masterProductId = formData.get("masterProductId");
    const qualityScale = parseInt((formData.get("qualityScale") as string) || "5");
    const videoUrl = String(formData.get("videoUrl") || "");
    
    // Distinguish between Grocery and Book
    const productType = String(formData.get("productType") || "grocery"); 
    
    // Pricing
    const wholesalePrice = Number(formData.get("wholesalePrice") || 0);
    const retailPrice = Number(formData.get("retailPrice") || 0);

    // 2. Book Specific Logic
    let bookDetails = undefined;
    let unit = String(formData.get("unit") || "");

    if (productType === 'book') {
        unit = "piece"; // Books are always sold per piece
        const bookData = formData.get("bookDetails");
        if (bookData) {
            bookDetails = JSON.parse(String(bookData));
        }
    }

    // 3. Image Upload
    const imageFiles = formData.getAll("images") as File[] | undefined;
    if (!imageFiles || imageFiles.length === 0) {
      return NextResponse.json({ error: "No image files found" }, { status: 400 });
    }

    const settled = await Promise.allSettled(imageFiles.map((file) => uploadOnCloudinary(file)));
    const imageUrls = settled.reduce<string[]>((acc, res) => {
      if (res.status === "fulfilled" && res.value) acc.push(res.value as string);
      return acc;
    }, []);

    if (imageUrls.length === 0) {
      return NextResponse.json({ error: "Cloudinary upload failed" }, { status: 500 });
    }

    // 4. 👇 CRITICAL FIX: Fetch Seller's Location
    const seller = await User.findById(session.user.id);
    
    if (!seller || !seller.location || !seller.location.coordinates || seller.location.coordinates.length === 0) {
        return NextResponse.json({ 
            error: "Seller location not found. Please update your profile address first." 
        }, { status: 400 });
    }

    // 5. Save to DB with Location
    const newProduct = await Grocery.create({
      name,
      description,
      category,
      unit,
      stock,
      wholesalePrice,
      retailPrice,
      price: retailPrice, // Default display price
      images: imageUrls,
      seller: session.user.id,
      productType, // 'grocery' or 'book'
      bookDetails, // Undefined for groceries, populated for books
      masterProductId: masterProductId || undefined,
      qualityScale,
      videoUrl: videoUrl || undefined,
      
      // 👇 Explicitly set location from Seller
      location: {
          type: 'Point',
          coordinates: seller.location.coordinates 
      }
    });

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });

  } catch (error: any) {
    console.error("Route Error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
