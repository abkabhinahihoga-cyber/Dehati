import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { normalizeIndianMobile } from "@/lib/phone";
import { verifyOtp, generateOtpSessionToken } from "@/lib/otp";
import { generateUniqueReferralCode } from "@/lib/referral";
import bcrypt from 'bcryptjs';
export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const { name, mobile, otp, password, referredByCode } = await req.json();

    if (!name || !mobile || !otp || !password) {
      return NextResponse.json(
        { message: "Name, Mobile, OTP, and Password are required." },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { message: "Name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Normalize & validate mobile
    const phone = normalizeIndianMobile(mobile);
    const code = String(otp).replace(/\D/g, "");

    if (code.length !== 6) {
      return NextResponse.json(
        { message: "Enter the 6 digit OTP sent on WhatsApp." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existUser = await User.findOne({ mobile: phone.mobile });
    if (existUser) {
      return NextResponse.json(
        { message: "Mobile number is already registered. Please login instead." },
        { status: 400 }
      );
    }

    // Verify OTP from Redis — throws on failure
    await verifyOtp({ mobile: phone.mobile, code });

    // Generate unique referral code
    const newReferralCode = await generateUniqueReferralCode();

    // Handle Referral Logic
    let referrer = null;
    let initialWalletBalance = 0;

    if (referredByCode) {
      referrer = await User.findOne({
        referralCode: referredByCode.toUpperCase(),
      });
      if (referrer) {
        initialWalletBalance = 20; // New user gets ₹20
        // Referrer gets ₹10
        await User.findByIdAndUpdate(referrer._id, {
          $inc: { walletBalance: 10, totalEarnings: 10 },
        });
      }
    }

    // Create user with hashed password
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      mobile: phone.mobile,
      password: passwordHash,
      referralCode: newReferralCode,
      referredBy: referrer ? referrer._id : undefined,
      walletBalance: initialWalletBalance,
      referralRewardGiven: !!referrer,
      isNewUser: true,
    });

    // Generate a session token so they can auto-login after registration
    const otpSessionToken = await generateOtpSessionToken(phone.mobile);

    return NextResponse.json(
      {
        success: true,
        message: "Registered successfully!",
        otpSessionToken,
        user: { name: user.name, mobile: user.mobile },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}