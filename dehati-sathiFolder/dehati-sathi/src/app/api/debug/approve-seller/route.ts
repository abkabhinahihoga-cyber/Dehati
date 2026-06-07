import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ message: "Login first" }, { status: 401 });
        }

        const body = await req.json();
        const { email } = body;

        await connectDb();

        let filter = {};
        
        // If email is provided, approve that user. 
        // If NOT provided, approve the CURRENT logged-in user (Self-Approval).
        if (email) {
            filter = { email: email.toLowerCase() };
        } else {
            filter = { _id: session.user.id };
        }

        const updatedUser = await User.findOneAndUpdate(
            filter,
            {
                role: 'seller',
                sellerStatus: 'approved'
            },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Successfully promoted ${updatedUser.name} to Seller`,
            user: updatedUser 
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}