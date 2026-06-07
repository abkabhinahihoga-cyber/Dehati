'use client';
import React, { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

function ForgotPassword() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const canRequestOtp = mobile.replace(/\D/g, '').length >= 10;
  const canReset = canRequestOtp && otp.replace(/\D/g, '').length === 6 && newPassword.length >= 6;

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRequestOtp) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, purpose: 'forgot' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      setOtpSent(true);
      toast.success('OTP sent on WhatsApp');
    } catch (err: any) {
      toast.error(err.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReset) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      toast.success('Password reset successfully. Please log in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 auth-bg relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 card-premium glass"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">{t('resetPassword')}</h2>
        <form onSubmit={otpSent ? resetPassword : requestOtp} className="flex flex-col gap-4">
          <input
            type="tel"
            placeholder={t('enterMobileNumber')}
            className="w-full border rounded-xl py-2 px-3"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            disabled={otpSent || loading}
          />
          {otpSent && (
            <>
              <input
                type="text"
                placeholder={t('enterOtp')}
                className="w-full border rounded-xl py-2 px-3"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
              />
              <input
                type="password"
                placeholder={t('newPassword')}
                className="w-full border rounded-xl py-2 px-3"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </>
          )}
          <button
            type="submit"
            className={`btn-premium w-full ${canReset || (otpSent ? canReset : canRequestOtp) ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            disabled={loading || (!otpSent && !canRequestOtp) || (otpSent && !canReset)}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : otpSent ? t('resetPassword') : t('sendOtp')}
          </button>
        </form>
        <p className="mt-4 text-center cursor-pointer" onClick={() => router.push('/login')}>{t('backToLogin')}</p>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
