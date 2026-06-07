export const dynamic = 'force-dynamic';
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import Hub from "@/app/models/hub.model";
import { NextRequest, NextResponse } from "next/server";

// --- GET: Fetch Pending Applications for My Hub ---
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'hub') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await connectDb();
        const myHub = await Hub.findOne({ managerId: session.user.id });
        if (!myHub) return NextResponse.json({ message: "Hub not found" }, { status: 404 });

        const applicants = await User.find({ 
            connectedHub: myHub._id, 
            deliveryStatus: 'pending_hub' // Only show those waiting for Hub review
        }).select('name email mobile image deliveryDetails createdAt');

        return NextResponse.json({ success: true, applicants });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// --- PUT: Forward to Admin or Reject ---
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'hub') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { applicantId, action } = await req.json(); // action: 'forward' | 'reject'
        await connectDb();

        const updateData = action === 'forward' 
            ? { deliveryStatus: 'pending_admin' } // Move to Admin Queue
            : { deliveryStatus: 'rejected', connectedHub: null }; // Reset

        await User.findByIdAndUpdate(applicantId, updateData);

        return NextResponse.json({ success: true, message: action === 'forward' ? "Forwarded to Admin" : "Application Rejected" });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}