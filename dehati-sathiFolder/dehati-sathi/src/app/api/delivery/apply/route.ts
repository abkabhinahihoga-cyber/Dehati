import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import mongoose from "mongoose"; // Import mongoose
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ message: "Login required" }, { status: 401 });

        const body = await req.json();
        const { 
            hubId, 
            name, fatherName, mobile, 
            vehicleType, vehicleNumber, license, 
            address, terms 
        } = body;

        if(!terms) return NextResponse.json({ message: "Please accept terms" }, { status: 400 });
        
        // Basic Validation
        if(!name || !fatherName || !mobile || !address) {
            return NextResponse.json({ message: "Personal details are required" }, { status: 400 });
        }
        if (vehicleType !== 'cycle' && (!vehicleNumber || !license)) {
            return NextResponse.json({ message: "Vehicle details required" }, { status: 400 });
        }

        await connectDb();

        // 1. Check Vacancy
        const currentCount = await User.countDocuments({ connectedHub: hubId, role: 'deliveryBoy' });
        if (currentCount >= 2) {
            return NextResponse.json({ message: "Hub is full." }, { status: 400 });
        }

        // 2. 👇 CRITICAL FIX: Ensure hubId is an ObjectId
        const validHubId = new mongoose.Types.ObjectId(hubId);

        // 3. Update User Profile
        const updatedUser = await User.findByIdAndUpdate(session.user.id, {
            deliveryStatus: 'pending_hub',
            connectedHub: validHubId, // Save as ObjectId
            deliveryDetails: {
                name,
                fatherName,
                mobile,
                vehicleType,
                vehicleNumber: vehicleType === 'cycle' ? 'N/A' : vehicleNumber,
                drivingLicense: vehicleType === 'cycle' ? 'N/A' : license,
                address
            }
        }, { new: true });

        return NextResponse.json({ success: true, message: "Application Sent!" });

    } catch (error: any) {
        console.error("Apply Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}