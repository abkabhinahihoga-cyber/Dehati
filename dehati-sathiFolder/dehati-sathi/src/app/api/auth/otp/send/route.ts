import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import { requestWhatsappOtp } from "@/lib/otp";
import { normalizeIndianMobile } from "@/lib/phone";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const { mobile, purpose = "login" } = await req.json();

    if (!mobile) {
      return NextResponse.json({ message: "Mobile number is required." }, { status: 400 });
    }

    // Validate & normalise
    const phone = normalizeIndianMobile(mobile);
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // ── Login path: redirect new numbers to register ─────────────────────────
    if (purpose === "login") {
      const user = await User.findOne({ mobile: phone.mobile });
      if (!user) {
        // Don't send OTP – let the UI redirect to /register
        return NextResponse.json({ success: true, isNewUser: true });
      }
    }

    // ── Register path: block already-registered numbers ───────────────────────
    if (purpose === "register") {
      const user = await User.findOne({ mobile: phone.mobile });
      if (user) {
        return NextResponse.json(
          { message: "Mobile number is already registered. Please login instead." },
          { status: 400 }
        );
      }
    }

    if (purpose === "forgot") {
        const user = await User.findOne({ mobile: phone.mobile });
        if (!user) {
          return NextResponse.json({ message: "Mobile number not registered." }, { status: 400 });
        }
        // proceed to send OTP
      }

    // Send OTP
    const result = await requestWhatsappOtp({ phone, ip });

    return NextResponse.json({
      success: true,
      message: "OTP sent on WhatsApp.",
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to send OTP." },
      { status: 400 }
    );
  }
}
