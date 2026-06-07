import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Ensure the user has a referral code, generate one if they don't
    if (!user.referralCode) {
      const generateReferralCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let newCode = generateReferralCode();
      while (await User.findOne({ referralCode: newCode })) {
        newCode = generateReferralCode();
      }

      user.referralCode = newCode;
      await user.save();
    }

    // Get stats: count how many people used this user's code
    const referredCount = await User.countDocuments({ referredBy: user._id });

    return NextResponse.json({
      success: true,
      referralCode: user.referralCode,
      referredCount,
      totalEarnings: user.totalEarnings || 0,
      walletBalance: user.walletBalance || 0,
    });

  } catch (error: any) {
    console.error("Referral API Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
