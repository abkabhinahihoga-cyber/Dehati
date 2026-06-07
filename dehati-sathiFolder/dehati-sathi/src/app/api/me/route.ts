import User from "@/app/models/user.model";     
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";           

export async function GET(req: NextRequest) {
    try {
        await connectDb();

        const session = await auth();
        
        // 1. Check if session exists (and has an ID)
        if (!session || !session.user?.id) {
            return NextResponse.json(
                { message: "Not authenticated" },
                { status: 401 }
            );
        }

        // 2. Find by ID (Works for both Google & Mobile users)
        // We select "-password" to ensure security
        const user = await User.findById(session.user.id).select("-password");

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(user, { status: 200 });

    } catch (error: any) {
        console.error("API Error:", error); 
        return NextResponse.json(
            { message: `Server Error: ${error.message}` },
            { status: 500 }
        );
    }
}