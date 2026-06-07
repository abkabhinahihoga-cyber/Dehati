import connectDb from "@/lib/db";
import { normalizeIndianMobile } from "@/lib/phone";
import { verifyOtp, generateOtpSessionToken } from "@/lib/otp";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { mobile, otp } = await req.json();
    const normalized = normalizeIndianMobile(mobile);
    const code = String(otp || "").replace(/\D/g, "");

    if (code.length !== 6) {
      return NextResponse.json(
        { message: "Enter the 6 digit OTP sent on WhatsApp." },
        { status: 400 }
      );
    }

    // Verify OTP in Redis — throws on failure
    await verifyOtp({ mobile: normalized.mobile, code });

    // Generate a one-time session token (10 min expiry)
    // This token is consumed by NextAuth credentials authorize()
    const otpSessionToken = await generateOtpSessionToken(normalized.mobile);

    return NextResponse.json({
      success: true,
      otpSessionToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to verify OTP" },
      { status: 400 }
    );
  }
}
