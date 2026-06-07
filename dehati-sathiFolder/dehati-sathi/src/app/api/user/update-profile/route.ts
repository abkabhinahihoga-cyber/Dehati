import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

// REMOVED "export const config" block - causing the error

export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, mobile, address, image } = body;

        await connectDb();

        const updateData: any = {
            name,
            mobile,
        };

        if (image && image.length > 0) {
             updateData.image = image;
        }
        
        if (address !== undefined) {
            updateData['location.address'] = address;
        }

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            updateData,
            { new: true }
        ).select("-password");

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (error: any) {
        console.error("Update Profile Error:", error);
        return NextResponse.json({ message: error.message || "Update failed" }, { status: 500 });
    }
}