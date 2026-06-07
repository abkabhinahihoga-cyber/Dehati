import { Loader2, Key } from 'lucide-react';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import googleImage from '@/assets/google.png';

function PasswordRegisterForm() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

  const canRegister = name.trim().length >= 2 && mobile.replace(/\D/g, '').length >= 10 && password.length >= 4;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRegister) return;
    setLoading(true);
    try {
      const res = await fetch('/api/register-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          mobile,
          password,
          referredByCode: referralCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      // Auto-login after registration
      const signInRes = await signIn('credentials', { mobile, password, redirect: false });
      if (signInRes?.error) {
        toast.success('Registered! Please log in.');
        router.push('/login');
        return;
      }
      toast.success('Welcome to Dehati Sathi! 🎉');
      router.push('/welcome');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (referralCode.trim()) {
      localStorage.setItem('pendingReferralCode', referralCode.trim().toUpperCase());
    }
    signIn('google', { callbackUrl: '/welcome' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md p-8 card-premium glass"
    >
      <div className="flex flex-col items-center mb-8">
        <motion.h1
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-green-500 mb-2"
        >
          {t('createAccount')}
        </motion.h1>
        <p className="text-gray-600">{t('joinDehatiSathi')}</p>
      </div>
      <form onSubmit={handleRegister} className="flex flex-col gap-5 w-full max-w-sm">
        <div className="relative">
          <input
            type="text"
            placeholder={t('enterYourName')}
            className="w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-gray-800 focus-ring bg-white/80 backdrop-blur-sm"
            onChange={(e) => setName(e.target.value)}
            value={name}
            disabled={loading}
          />
        </div>
        <div className="relative">
          <input
            type="tel"
            placeholder={t('enterMobileNumber')}
            className="w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-gray-800 focus-ring bg-white/80 backdrop-blur-sm"
            onChange={(e) => setMobile(e.target.value)}
            value={mobile}
            disabled={loading}
          />
        </div>
        <div className="relative">
          <input
            type="password"
            placeholder={t('password')}
            className="w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-gray-800 focus-ring bg-white/80 backdrop-blur-sm"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            disabled={loading}
          />
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Referral Code (Optional)"
            className="w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-gray-800 focus-ring bg-white/80 backdrop-blur-sm"
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            value={referralCode}
            maxLength={6}
            disabled={loading}
          />
        </div>
        <button
          className={`btn-premium w-full font-semibold py-3 rounded-xl transition-all duration-200 shadow-md inline-flex items-center justify-center gap-2 ${canRegister ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          disabled={!canRegister || loading}
          type="submit"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('register')}
        </button>
        <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
          <span className="flex-1 h-px bg-gray-300"></span>
          or
          <span className="flex-1 h-px bg-gray-300"></span>
        </div>
        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 py-3 rounded-xl text-gray-700 font-medium transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm"
          onClick={handleGoogleSignIn}
        >
          <Image src={googleImage} width={20} height={20} alt='google' />
          {t('continueWithGoogle')}
        </button>
        <p className="cursor-pointer text-gray-600 mt-6 text-sm flex items-center gap-1 justify-center" onClick={() => router.push('/login')}>
          {t('alreadyHaveAccount')} <span className="text-green-700 font-semibold hover:underline">{t('logIn')}</span>
        </p>
      </form>
    </motion.div>
  );
}

export default PasswordRegisterForm;
