import connectDb from '@/lib/db';
import User from '@/app/models/user.model';
import { NextRequest, NextResponse } from 'next/server';
import { normalizeIndianMobile } from '@/lib/phone';
import { verifyOtp } from '@/lib/otp';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { mobile, otp, newPassword } = await req.json();

    if (!mobile || !otp || !newPassword) {
      return NextResponse.json({ message: 'Mobile, OTP, and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const phone = normalizeIndianMobile(mobile);
    const code = String(otp).replace(/\D/g, '');
    if (code.length !== 6) {
      return NextResponse.json({ message: 'Enter the 6 digit OTP sent on WhatsApp.' }, { status: 400 });
    }

    // Verify OTP
    await verifyOtp({ mobile: phone.mobile, code });

    // Find user
    const user = await User.findOne({ mobile: phone.mobile });
    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    // Hash new password and save
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return NextResponse.json({ success: true, message: 'Password reset successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('FORGOT PASSWORD ERROR:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
