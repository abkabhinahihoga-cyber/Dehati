import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { normalizeIndianMobile } from "@/lib/phone";
import { generateUniqueReferralCode } from "@/lib/referral";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { name, mobile, password, referredByCode } = await req.json();

    if (!name || !mobile || !password) {
      return NextResponse.json({ message: "Name, Mobile, and Password are required." }, { status: 400 });
    }
    if (name.trim().length < 2) {
      return NextResponse.json({ message: "Name must be at least 2 characters." }, { status: 400 });
    }
    if (password.length < 4) {
      return NextResponse.json({ message: "Password must be at least 4 characters." }, { status: 400 });
    }

    const phone = normalizeIndianMobile(mobile);
    const existingUser = await User.findOne({ mobile: phone.mobile });
    if (existingUser) {
      return NextResponse.json({ message: "Mobile number is already registered. Please login instead." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newReferralCode = await generateUniqueReferralCode();
    let referrer = null;
    let initialWalletBalance = 0;
    if (referredByCode) {
      referrer = await User.findOne({ referralCode: referredByCode.toUpperCase() });
      if (referrer) {
        initialWalletBalance = 20;
        await User.findByIdAndUpdate(referrer._id, { $inc: { walletBalance: 10, totalEarnings: 10 } });
      }
    }

    const user = await User.create({
      name: name.trim(),
      mobile: phone.mobile,
      password: hashedPassword,
      referralCode: newReferralCode,
      referredBy: referrer ? referrer._id : undefined,
      walletBalance: initialWalletBalance,
      referralRewardGiven: !!referrer,
      isNewUser: true,
    });

    // Auto-login can be handled client-side via credentials signIn; no session token needed here.
    return NextResponse.json({ success: true, message: "Registered successfully!", user: { name: user.name, mobile: user.mobile } }, { status: 201 });
  } catch (error: any) {
    console.error("REGISTER PASSWORD ERROR:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
