export const dynamic = 'force-dynamic';
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import Hub from "@/app/models/hub.model"; // Import Hub for population
import { NextRequest, NextResponse } from "next/server";

// --- GET: Fetch Applications Forwarded to Admin ---
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDb();

        // Fetch users waiting for Admin approval
        const applicants = await User.find({ deliveryStatus: 'pending_admin' })
            .select('name email mobile image deliveryDetails connectedHub createdAt')
            .populate('connectedHub', 'name location') // Show which Hub forwarded this
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, applicants });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// --- PUT: Final Approve or Reject ---
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { applicantId, action } = await req.json(); // action: 'approve' | 'reject'
        await connectDb();

        if (action === 'approve') {
            // Grant Role & Update Status
            await User.findByIdAndUpdate(applicantId, {
                deliveryStatus: 'approved',
                role: 'deliveryBoy' 
            });
            return NextResponse.json({ success: true, message: "Delivery Partner Hired Successfully!" });
        } 
        else {
            // Reject & Reset Hub Link
            await User.findByIdAndUpdate(applicantId, {
                deliveryStatus: 'rejected',
                connectedHub: null 
            });
            return NextResponse.json({ success: true, message: "Application Rejected." });
        }

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}