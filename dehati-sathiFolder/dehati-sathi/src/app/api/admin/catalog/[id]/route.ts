import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import MasterProduct from "@/app/models/masterProduct.model";
import { auth } from "@/auth";
import Grocery from "@/app/models/grocery.model";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// PUT — edit master product
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDb();
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const formData = await req.formData();
    const isHubProductStr = formData.get("isHubProduct");
    const isHubProduct = isHubProductStr === "true";
    
    const updates: any = {
      name: formData.get("name"),
      nameHindi: formData.get("nameHindi"),
      category: formData.get("category"),
      unit: formData.get("unit"),
      description: formData.get("description"),
      isActive: formData.get("isActive") !== "false",
      isHubProduct: isHubProduct
    };

    if (isHubProduct) {
        updates.retailPrice = Number(formData.get("retailPrice")) || 0;
        updates.wholesalePrice = Number(formData.get("wholesalePrice")) || 0;
    } else {
        updates.retailPrice = 0;
        updates.wholesalePrice = 0;
    }

    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: "master-products", resource_type: "image" }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }).end(buffer);
      });
      updates.image = uploadResult.secure_url;
    }

    const product = await MasterProduct.findByIdAndUpdate(id, updates, { new: true });
    if (!product) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    // Sync prices to all Hub's Grocery items if it is a hub product
    if (product.isHubProduct) {
        await Grocery.updateMany(
            { masterProductId: product._id },
            { 
                $set: {
                    name: product.name,
                    category: product.category,
                    unit: product.unit,
                    retailPrice: product.retailPrice,
                    wholesalePrice: product.wholesalePrice,
                    price: product.retailPrice // Fallback primary price
                }
            }
        );
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE — remove master product
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDb();
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    await MasterProduct.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
