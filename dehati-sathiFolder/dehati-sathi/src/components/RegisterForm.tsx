'use client'

import { ArrowLeft, Key, Leaf, Loader2, LogInIcon, MessageCircle, Phone, ShieldCheck, User } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { motion } from "motion/react"
import Image from 'next/image'
import googleImage from "@/assets/google.png"
import { useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

type propType = {
    previousStep: (s: number) => void
}

function RegisterForm({ previousStep }: propType) {
    const t = useTranslations('Auth');
    const common = useTranslations('Common');
    const searchParams = useSearchParams()
    const [name, setName] = useState("")
    const [mobile, setMobile] = useState("")
    const [otp, setOtp] = useState("")
    const [referredByCode, setReferredByCode] = useState("")
    const [otpSent, setOtpSent] = useState(false)
    const [devOtp, setDevOtp] = useState("")
    const [loading, setLoading] = useState(false)
    const [cooldown, setCooldown] = useState(0)
    const router = useRouter()

    // Pre-fill mobile if redirected from login
    useEffect(() => {
        const m = searchParams.get("mobile")
        if (m) setMobile(m)
    }, [searchParams])

    // Countdown timer for resend cooldown
    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [cooldown])

    const canRequestOtp = name.trim().length >= 2 && mobile.replace(/\D/g, "").length >= 10
    const canVerifyOtp = canRequestOtp && otp.replace(/\D/g, "").length === 6

    const requestOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canRequestOtp) return
        setLoading(true)

        try {
            const res = await fetch("/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile, purpose: "register" }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || "Failed to send OTP")

            setOtpSent(true)
            setDevOtp(data.devOtp || "")
            setCooldown(60)
            toast.success("OTP sent on WhatsApp")
        } catch (error: any) {
            toast.error(error.message || "Could not send OTP")
        } finally {
            setLoading(false)
        }
    }

    const registerAndLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canVerifyOtp) return
        setLoading(true)

        try {
            // Step 1: Register the user (this also verifies OTP internally)
            const regRes = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    mobile,
                    otp: otp.replace(/\D/g, ""),
                    referredByCode: referredByCode.trim() || undefined,
                }),
            })
            const regData = await regRes.json()
            if (!regRes.ok) throw new Error(regData.message || "Registration failed")

            // Step 2: Auto-login using the session token returned from registration
            const signInRes = await signIn("credentials", {
                mobile,
                otpSessionToken: regData.otpSessionToken,
                redirect: false,
            })

            if (signInRes?.error) throw new Error("Could not start your session")

            toast.success("Welcome to Dehati Sathi! 🎉")
            router.push("/welcome")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Registration failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='flex flex-col items-center justify-center min-h-screen px-6 py-10 auth-bg relative'>
            <button className='absolute top-6 left-6 flex items-center gap-2 text-green-700 hover:text-green-800 transition-colors bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-green-200 shadow-sm'
                onClick={() => previousStep(1)}
                type="button"
            >
                <ArrowLeft className='w-5 h-5' />
                <span className='font-medium'>{common('back')}</span>
            </button>
            
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
                        className='text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-green-500 mb-2'>
                        {t('createAccount')}
                    </motion.h1>
                    <p className='text-gray-600 flex items-center'>{t('joinDehatiSathi')}<Leaf className='w-5 h-5 text-green-600 ml-1' /></p>
                </div>

                <motion.form
                    onSubmit={otpSent ? registerAndLogin : requestOtp}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className='flex flex-col gap-5 w-full max-w-sm'>
                    
                    <div className='relative'>
                        <User className='absolute left-3 top-3.5 w-5 h-5 text-gray-400' />
                        <input type='text' placeholder={t('enterYourName')} className='w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-gray-800 focus-ring bg-white/80 backdrop-blur-sm'
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            disabled={otpSent || loading} />
                    </div>

                    <div className='relative'>
                        <Phone className='absolute left-3 top-3.5 w-5 h-5 text-gray-400' /> 
                        <input 
                            type='tel'
                            placeholder={t('enterMobileNumber')} 
                            className='w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-gray-800 focus-ring bg-white/80 backdrop-blur-sm'
                            onChange={(e) => setMobile(e.target.value)}
                            value={mobile}
                            disabled={otpSent || loading} 
                        />
                    </div>

                    {!otpSent && (
                        <div className='relative'>
                            <Key className='absolute left-3 top-3.5 w-5 h-5 text-gray-400' />
                            <input type='text' placeholder='Referral Code (Optional)' className='w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-gray-800 focus-ring bg-white/80 backdrop-blur-sm'
                                onChange={(e) => setReferredByCode(e.target.value.toUpperCase())}
                                value={referredByCode}
                                maxLength={6}
                                disabled={loading} />
                        </div>
                    )}

                    {otpSent && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className='relative'
                        >
                            <ShieldCheck className='absolute left-3 top-3.5 w-5 h-5 text-gray-400' />
                            <input
                                inputMode='numeric'
                                maxLength={6}
                                placeholder='Enter 6 digit WhatsApp OTP'
                                className='w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-gray-800 focus-ring bg-white/80 backdrop-blur-sm tracking-[0.35em]'
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                value={otp}
                                autoFocus
                            />
                            {devOtp && <p className='text-xs text-green-700 mt-2'>Dev OTP: {devOtp}</p>}
                        </motion.div>
                    )}
                    
                    <button
                        className={`btn-premium w-full font-semibold py-3 rounded-xl transition-all duration-200 shadow-md inline-flex items-center justify-center gap-2 ${(otpSent ? canVerifyOtp : canRequestOtp)
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                        disabled={!(otpSent ? canVerifyOtp : canRequestOtp) || loading}
                    >
                        {loading ? <Loader2 className='w-5 h-5 animate-spin' /> : otpSent ? <ShieldCheck className='w-5 h-5' /> : <MessageCircle className='w-5 h-5' />}
                        {otpSent ? "Verify & create account" : "Send WhatsApp OTP"}
                    </button>

                    {otpSent && (
                        <div className='flex items-center justify-between'>
                            <button type="button" className='text-sm font-medium text-green-700 hover:underline' onClick={() => { setOtpSent(false); setOtp(""); setDevOtp(""); }}>
                                Change details
                            </button>
                            <button
                                type="button"
                                className={`text-sm font-medium ${cooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-green-700 hover:underline'}`}
                                disabled={cooldown > 0 || loading}
                                onClick={(e) => { e.preventDefault(); setCooldown(0); requestOtp(e as any); }}
                            >
                                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                            </button>
                        </div>
                    )}

                    <div className='flex items-center gap-2 text-gray-400 text-sm mt-2'>
                        <span className='flex-1 h-px bg-gray-300'></span>
                        {common('or')}
                        <span className='flex-1 h-px bg-gray-300'></span>
                    </div>

                    <button type="button" className='w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 py-3 rounded-xl text-gray-700 font-medium transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm' onClick={() => signIn('google', { callbackUrl: "/" })}>
                        <Image src={googleImage} width={20} height={20} alt='google' />
                        {t('continueWithGoogle')}
                    </button>

                </motion.form>
                
                <p className='cursor-pointer text-gray-600 mt-6 text-sm flex items-center gap-1 justify-center' onClick={() => router.push("/login")}>
                    {t('alreadyHaveAccount')} <LogInIcon className='w-4 h-4 ml-1' /><span className='text-green-700 font-semibold hover:underline'>{t('logIn')}</span>
                </p>
            </motion.div>
        </div>
    );
}

export default RegisterForm
