import connectDb from "@/lib/db";
import Grocery from "@/app/models/grocery.model"; // Ensure this matches your actual Product model filename
import { NextRequest, NextResponse } from "next/server";
import { escapeRegex, getSearchVariants } from "@/lib/search-normalizer";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query");

        if (!query || query.length < 2) {
            return NextResponse.json({ success: true, products: [] });
        }

        const variants = getSearchVariants(query);
        const regexes = variants.map((term) => new RegExp(escapeRegex(term), "i"));

        const products = await Grocery.find({
            $or: [
                { name: { $in: regexes } },
                { category: { $in: regexes } },
                { description: { $in: regexes } },
                { unit: { $in: regexes } }
            ]
        })
        .select("name price image unit category _id seller") // Select only needed fields
        .limit(12);

        return NextResponse.json({ success: true, products, queryVariants: variants });

    } catch (error: any) {
        console.error("Search Error:", error);
        return NextResponse.json({ message: "Search failed" }, { status: 500 });
    }
}
