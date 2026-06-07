import connectDb from "@/lib/db";
import Grocery from "@/app/models/grocery.model"; // Ensure this matches your actual Product model filename
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query");

        if (!query || query.length < 2) {
            return NextResponse.json({ success: true, products: [] });
        }

        // Create a case-insensitive Regex
        const searchRegex = new RegExp(query, "i");

        // Search in Name, Category, or Description
        const products = await Grocery.find({
            $or: [
                { name: { $regex: searchRegex } },
                { category: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
            ]
        })
        .select("name price image unit category _id seller") // Select only needed fields
        .limit(10); // Limit results for performance

        return NextResponse.json({ success: true, products });

    } catch (error: any) {
        console.error("Search Error:", error);
        return NextResponse.json({ message: "Search failed" }, { status: 500 });
    }
}