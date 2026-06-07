import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Grocery from "@/app/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";

// Force dynamic ensures it doesn't cache stale data
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        // 1. Check Authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDb();

        // 2. Fetch Products belonging to THIS Seller
        const products = await Grocery.find({ seller: session.user.id })
                                      .sort({ createdAt: -1 }); // Newest first

        return NextResponse.json({ success: true, products });

    } catch (error: any) {
        console.error("Fetch Products Error:", error);
        return NextResponse.json({ message: error.message || "Server Error" }, { status: 500 });
    }
}