import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import MasterProduct from "@/app/models/masterProduct.model";
import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET all master products
export async function GET() {
  try {
    await connectDb();
    const products = await MasterProduct.find({}).sort({ category: 1, name: 1 }).lean();
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST — create new master product (admin only)
export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const nameHindi = formData.get("nameHindi") as string;
    const category = formData.get("category") as string;
    const unit = formData.get("unit") as string;
    const description = formData.get("description") as string;
    const isHubProduct = formData.get("isHubProduct") === "true";
    const retailPrice = Number(formData.get("retailPrice")) || 0;
    const wholesalePrice = Number(formData.get("wholesalePrice")) || 0;
    const imageFile = formData.get("image") as File | null;

    if (!name || !category || !unit) {
      return NextResponse.json({ success: false, error: "Name, category and unit are required." }, { status: 400 });
    }

    let imageUrl = "";
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: "master-products", resource_type: "image" }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }).end(buffer);
      });
      imageUrl = uploadResult.secure_url;
    }

    const product = await MasterProduct.create({ 
      name, nameHindi, category, unit, description, image: imageUrl,
      isHubProduct, retailPrice: isHubProduct ? retailPrice : undefined, wholesalePrice: isHubProduct ? wholesalePrice : undefined
    });
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
