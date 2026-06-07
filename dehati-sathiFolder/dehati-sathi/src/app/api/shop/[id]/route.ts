import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/app/models/user.model";
import Video from "@/app/models/video.model";
import Grocery from "@/app/models/grocery.model";
import { auth } from "@/auth";

export async function GET(
    req: NextRequest, 
    { params }: { params: Promise<{ id: string }> } 
) {
    try {
        await dbConnect();
        const { id: sellerId } = await params;
        const session = await auth();

        // 1. Fetch Seller Profile
        const seller = await User.findById(sellerId)
            .select("name image sellerDetails followersCount location role")
            .lean();

        if (!seller || seller.role !== 'seller') {
            return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
        }

        // 2. Fetch Products (Removed 'approved' filter so you can see your items)
        const products = await Grocery.find({ seller: sellerId })
            .sort({ createdAt: -1 })
            .lean();

        // 3. Fetch Reels
        const reels = await Video.find({ seller: sellerId })
            .sort({ createdAt: -1 })
            .lean();

        // 4. Calculate Real Shop Rating & Reviews
        // We find all products by this seller that have reviews
        const productsWithReviews = await Grocery.find({ 
            seller: sellerId, 
            'reviews.0': { $exists: true } 
        }).select('reviews name images');

        let allReviews: any[] = [];
        let totalRating = 0;
        let reviewCount = 0;

        productsWithReviews.forEach((p: any) => {
            if (p.reviews) {
                p.reviews.forEach((r: any) => {
                    allReviews.push({
                        ...r,
                        productName: p.name,
                        productImage: p.images?.[0]
                    });
                    totalRating += r.rating;
                    reviewCount++;
                });
            }
        });

        // Calculate Average (Default to 0 if no reviews)
        const shopRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : "New";
        
        // Sort reviews by newest
        allReviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // 5. Check Connection Status
        let isConnected = false;
        if (session?.user) {
            const currentUser = await User.findById(session.user.id).select("connections");
            isConnected = currentUser?.connections?.some((id: any) => id.toString() === sellerId) || false;
        }

        return NextResponse.json({ 
            success: true, 
            seller, 
            products, 
            reels,
            reviews: allReviews,
            shopRating,
            reviewCount,
            isConnected 
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}