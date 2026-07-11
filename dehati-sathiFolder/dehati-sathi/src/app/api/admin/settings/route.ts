import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Settings from "@/app/models/settings.model";
import { auth } from "@/auth";

export async function GET() {
    try {
        await connectDb();
        let settings = await Settings.findOne();
        if (!settings) {
            // Create default settings if not exist
            settings = await Settings.create({
                platformFeeTiers: [
                    { minAmount: 0, maxAmount: 50, fee: 8 },
                    { minAmount: 50, maxAmount: 100, fee: 6 },
                    { minAmount: 100, maxAmount: 300, fee: 5 },
                    { minAmount: 300, maxAmount: 500, fee: 8 },
                    { minAmount: 500, maxAmount: 999999, fee: 10 },
                ],
                gstPercentage: 5,
                baseDeliveryFee: 5,
                deliveryFeePerKm: 2,
                hubCoverageRadiusKm: 3.5
            });
        }
        return NextResponse.json({ success: true, settings }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        // Check if admin
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDb();
        const body = await req.json();

        let settings = await Settings.findOne();
        if (settings) {
            settings = await Settings.findOneAndUpdate({}, body, { new: true });
        } else {
            settings = await Settings.create(body);
        }

        return NextResponse.json({ success: true, settings }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
