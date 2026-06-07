import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
// 👇 FIX: Import 'Grocery' instead of 'Product'
import Grocery from "@/app/models/grocery.model"; 
import { productIndex } from "@/lib/algolia";

export async function GET() {
    try {
        await dbConnect();
        
        // 1. Fetch all groceries from MongoDB
        // 👇 FIX: Use 'Grocery.find'
        const products = await Grocery.find({})
            .select('name category description retailPrice images seller tags rating') 
            .populate('seller', 'name shopName') 
            .lean();

        if (!products.length) {
            return NextResponse.json({ success: false, message: "No groceries found in DB to sync." });
        }

        console.log(`📦 Found ${products.length} items. Syncing to Algolia...`);

        // 2. Transform to Algolia Format
        // 👇 FIX: Typed as 'any' to avoid TypeScript errors
        const records = products.map((p: any) => ({
            objectID: p._id.toString(), 
            name: p.name,
            description: p.description,
            category: p.category,
            price: p.retailPrice, // Ensure this matches your Schema (retailPrice vs price)
            image: p.images?.[0] || "",
            seller: {
                name: p.seller?.name || "Unknown",
                shopName: p.seller?.shopName
            },
            tags: p.tags || [],
            rating: p.rating || 0
        }));

        // 3. Upload to Algolia in Parallel
        await Promise.all(
            records.map((record: any) => productIndex.saveObject(record))
        );

        return NextResponse.json({ 
            success: true, 
            message: `✅ Successfully synced ${products.length} groceries to Algolia!` 
        });

    } catch (error: any) {
        console.error("Sync Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}