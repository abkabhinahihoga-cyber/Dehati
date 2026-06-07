'use client'

import { Loader2 } from 'lucide-react'
import React, { FormEvent, useState } from 'react'
import { motion } from "motion/react"
import Image from 'next/image'
import googleImage from "@/assets/google.png"
import { useRouter } from '@/i18n/routing'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

function Login() {
    const t = useTranslations('Auth');
    const common = useTranslations('Common');
    const [mobile, setMobile] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const canLogin = mobile.replace(/\D/g, "").length >= 10 && password.length >= 4

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault()
        if (!canLogin) return
        setLoading(true)
        try {
            const res = await signIn('credentials', {
                mobile,
                password,
                redirect: false,
            })
            if (res?.error) throw new Error(res.error)
            toast.success('Logged in successfully')
            router.push('/')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='flex flex-col items-center justify-center min-h-screen px-6 py-10 auth-bg relative'>
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
                        {t('welcomeBack')}
                    </motion.h1>
                    <p className="text-gray-600">{t('loginWithPassword')}</p>
                </div>
                <motion.form
                    onSubmit={handleLogin}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className="flex flex-col gap-5 w-full max-w-sm"
                >
                    <div className="relative">
                        <input
                            type="tel"
                            placeholder={t('mobileNumber')}
                            className="w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-gray-800 focus-ring bg-white/80 backdrop-blur-sm"
                            onChange={(e) => setMobile(e.target.value)}
                            value={mobile}
                        />
                    </div>
                    <div className="relative">
                        <input
                            type="password"
                            placeholder={t('password')}
                            className="w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-gray-800 focus-ring bg-white/80 backdrop-blur-sm"
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                        />
                    </div>
                    <button
                        className={`btn-premium w-full font-semibold py-3 rounded-xl transition-all duration-200 shadow-md inline-flex items-center justify-center gap-2 ${canLogin ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        disabled={!canLogin || loading}
                    >
                        {loading ? <Loader2 className='w-5 h-5 animate-spin' /> : t('login')}
                    </button>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
                        <span className="flex-1 h-px bg-gray-300" />
                        {common('or')}
                        <span className="flex-1 h-px bg-gray-300" />
                    </div>
                    <button
                        type="button"
                        className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 py-3 rounded-xl text-gray-700 font-medium transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm"
                        onClick={() => signIn('google', { callbackUrl: '/' })}
                    >
                        <Image src={googleImage} width={20} height={20} alt='google' />
                        {t('continueWithGoogle')}
                    </button>
                </motion.form>
                <p className="cursor-pointer text-gray-600 mt-6 text-sm flex items-center gap-1 justify-center" onClick={() => router.push('/forgot-password')}>
                    {t('forgotPassword')}
                </p>
                <p className="cursor-pointer text-gray-600 mt-2 text-sm flex items-center gap-1 justify-center" onClick={() => router.push('/register')}>
                    {t('noAccount')} <span className="text-green-700 font-semibold hover:underline">{t('signUp')}</span>
                </p>
            </motion.div>
        </div>
    )
}

export default Login
