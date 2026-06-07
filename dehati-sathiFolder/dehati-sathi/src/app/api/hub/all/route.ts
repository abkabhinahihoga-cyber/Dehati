import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Hub from "@/app/models/hub.model";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDb();
        
        // Fetch all active hubs, selecting only necessary fields
        const hubs = await Hub.find({ isActive: true })
            .select("name location.coordinates coverageRadius address")
            .lean();

        return NextResponse.json({ success: true, hubs });
    } catch (error) {
        console.error("Error fetching hubs:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
