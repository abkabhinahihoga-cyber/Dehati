// src/app/api/user/edit-role-mobile/route.ts

import connectDb from "@/app/lib/db";
import User from "@/app/models/user.model";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { role, mobile } = await req.json();
    const session = await auth();

    // Debugging: Check if session exists
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Use session.user.id or session.user.email depending on your auth config
    const userId = session.user.id; 

    const user = await User.findOneAndUpdate(
      { _id: userId }, // MongoDB uses _id by default, not id
      { role, mobile },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ message: "User not found in database" }, { status: 400 });
    }

    return NextResponse.json({ user, status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: `Edit error: ${error.message}` },
      { status: 500 }
    );
  }
}