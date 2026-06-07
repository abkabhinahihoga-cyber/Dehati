import { NextResponse } from "next/server";
import { algoliaClient } from "@/lib/algolia";

export async function GET() {
    try {
        console.log("⚙️ Configuring Algolia Index (v5)...");

        // 🔍 Check if we are using the Mock Client (Offline) or Real Client (v5)
        // The Real v5 client has 'setSettings'. The Mock might rely on initIndex.
        // We handle both cases to be safe.

        if (typeof algoliaClient.setSettings === 'function') {
            // ✅ ALGOLIA v5 SYNTAX (Real Client)
            await algoliaClient.setSettings({
                indexName: "products",
                indexSettings: {
                    searchableAttributes: [
                        'name',
                        'category',
                        'description',
                        'seller.name',
                        'tags'
                    ],
                    attributesForFaceting: [
                        'category',
                        'seller.id',
                        'filterOnly(price)',
                        'productType'
                    ],
                    customRanking: [
                        'desc(rating)',
                        'asc(price)'
                    ],
                    typoTolerance: 'min',
                }
            });
        } else if (typeof (algoliaClient as any).initIndex === 'function') {
            // ⚠️ LEGACY / MOCK SYNTAX (Fallback)
            const index = (algoliaClient as any).initIndex("products");
            await index.setSettings({
                searchableAttributes: ['name', 'category', 'description'],
                attributesForFaceting: ['category', 'seller.id', 'price'],
            });
        } else {
            throw new Error("Algolia Client is invalid or incompatible.");
        }

        return NextResponse.json({ success: true, message: "✅ Algolia Index Configured Successfully!" });

    } catch (error: any) {
        console.error("Config Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}