import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Grocery from "@/app/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";
import uploadOnCloudinary from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: "Please login to review" }, { status: 401 });
        }

        const formData = await req.formData();
        const productId = formData.get("productId") as string;
        const rating = Number(formData.get("rating"));
        const comment = formData.get("comment") as string;
        const imageFiles = formData.getAll("images") as File[] | undefined;

        if (!productId || !rating) {
            return NextResponse.json({ message: "Rating and Product ID are required" }, { status: 400 });
        }

        await connectDb();
        const product = await Grocery.findById(productId);
        
        if (!product) return NextResponse.json({ message: "Product not found" }, { status: 404 });

        // Ensure reviews array exists
        if (!product.reviews) product.reviews = [];

        // Check for existing review
        const alreadyReviewed = product.reviews.find(
            (r: any) => r.user.toString() === session.user.id
        );
        if (alreadyReviewed) {
            return NextResponse.json({ message: "You have already reviewed this product" }, { status: 400 });
        }

        // Upload Images (Concurrent)
        let imageUrls: string[] = [];
        if (imageFiles && imageFiles.length > 0 && imageFiles[0].size > 0) {
            const settled = await Promise.allSettled(imageFiles.map((file) => uploadOnCloudinary(file)));
            imageUrls = settled.reduce<string[]>((acc, res) => {
                if (res.status === "fulfilled" && res.value) acc.push(res.value as string);
                return acc;
            }, []);
        }

        const review = {
            user: session.user.id,
            name: session.user.name || "Customer",
            rating,
            comment,
            images: imageUrls,
            createdAt: new Date()
        };

        product.reviews.push(review);
        
        // Update Aggregates
        product.numReviews = product.reviews.length;
        product.averageRating = product.reviews.reduce((acc: number, item: any) => item.rating + acc, 0) / product.reviews.length;

        await product.save();

        // Refresh Pages
        revalidatePath(`/product/${productId}`);
        revalidatePath("/seller/dashboard");

        return NextResponse.json({ success: true, message: "Review Added" });

    } catch (error: any) {
        console.error("Review Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}