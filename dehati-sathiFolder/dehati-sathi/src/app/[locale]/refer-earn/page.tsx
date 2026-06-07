'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Copy, Share2, Wallet, Users, Gift, Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

export default function ReferAndEarn() {
    const router = useRouter()
    const { status } = useSession()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        referralCode: '',
        referredCount: 0,
        totalEarnings: 0,
        walletBalance: 0
    })
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
            return
        }
        
        const fetchReferralData = async () => {
            try {
                const res = await axios.get('/api/user/referral')
                if (res.data.success) {
                    setData(res.data)
                }
            } catch (error) {
                toast.error("Failed to load referral data")
            } finally {
                setLoading(false)
            }
        }
        
        if (status === 'authenticated') {
            fetchReferralData()
        }
    }, [status, router])

    const handleCopy = () => {
        navigator.clipboard.writeText(data.referralCode)
        setCopied(true)
        toast.success("Referral code copied!")
        setTimeout(() => setCopied(false), 2000)
    }

    const handleShare = async () => {
        const shareText = `🌾 Dehati Sathi - Kisan Se Seedhe Aap Ke Paas! 🌾\n\nUse my code ${data.referralCode} to join Dehati Sathi and get ₹20 in your wallet instantly!\n\n✅ Farm-fresh produce\n✅ Lower than market prices\n✅ Support local farmers directly\n\nDownload the app now and start saving! 🚀`
        
        try {
            const response = await fetch('/icon.png')
            const blob = await response.blob()
            const file = new File([blob], 'dehati-sathi.png', { type: blob.type })

            const shareData: any = {
                title: 'Join Dehati Sathi',
                text: shareText,
                url: window.location.origin
            }

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                shareData.files = [file]
            }

            if (navigator.share) {
                await navigator.share(shareData)
            } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + window.location.origin)}`, '_blank')
            }
        } catch (error) {
            console.error('Error sharing:', error)
            if (navigator.share) {
                navigator.share({
                    title: 'Join Dehati Sathi',
                    text: shareText,
                    url: window.location.origin
                }).catch(console.error)
            } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + window.location.origin)}`, '_blank')
            }
        }
    }

    if (loading || status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-green-600 to-green-800 text-white pt-6 pb-12 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10">
                    <Gift size={200} className="-mr-10 -mt-10" />
                </div>
                
                <div className="max-w-2xl mx-auto relative z-10">
                    <button onClick={() => router.back()} className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all mb-6">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    
                    <h1 className="text-3xl font-bold mb-2">रेफर करें और कमाएं</h1>
                    <p className="text-green-100 opacity-90 max-w-md">
                        अपने दोस्तों को देहाती साथी पर आमंत्रित करें। उन्हें तुरंत ₹20 मिलेंगे, और उनके जुड़ने पर आपको ₹10 मिलेंगे!
                    </p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 -mt-8 relative z-20 space-y-6">
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center"
                    >
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium mb-1">वॉलेट बैलेंस</p>
                        <h3 className="text-2xl font-bold text-gray-900">₹{data.walletBalance}</h3>
                        <p className="text-[10px] text-green-600 font-bold mt-1 bg-green-50 px-2 py-0.5 rounded-full">हर ऑर्डर पर ₹5 का उपयोग करें</p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center"
                    >
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                            <Users className="w-6 h-6" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium mb-1">रेफर किए गए दोस्त</p>
                        <h3 className="text-2xl font-bold text-gray-900">{data.referredCount}</h3>
                        <p className="text-[10px] text-gray-400 mt-1">कुल कमाई: ₹{data.totalEarnings}</p>
                    </motion.div>
                </div>

                {/* Referral Code Box */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                    
                    <h3 className="text-lg font-bold text-gray-800 mb-6">आपका अनोखा रेफरल कोड</h3>
                    
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-4 flex items-center justify-between mb-8 group hover:border-green-400 transition-colors">
                        <span className="text-3xl font-black text-gray-700 tracking-widest pl-4">{data.referralCode}</span>
                        <button 
                            onClick={handleCopy}
                            className={`p-3 rounded-xl transition-all ${copied ? 'bg-green-100 text-green-600' : 'bg-white shadow-sm border text-gray-600 hover:bg-gray-100'}`}
                        >
                            {copied ? <CheckCircle2 className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                        </button>
                    </div>

                    <button 
                        onClick={handleShare}
                        className="w-full bg-green-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg hover:bg-green-700 hover:shadow-green-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Share2 className="w-5 h-5" />
                        दोस्तों के साथ शेयर करें
                    </button>
                </motion.div>

                {/* How it works */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-orange-500" /> यह कैसे काम करता है
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                            <div>
                                <h4 className="font-semibold text-gray-800">अपना कोड शेयर करें</h4>
                                <p className="text-sm text-gray-500">अपना रेफरल कोड उन दोस्तों को भेजें जो अभी तक देहाती साथी पर नहीं हैं।</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                            <div>
                                <h4 className="font-semibold text-gray-800">दोस्त का साइन अप</h4>
                                <p className="text-sm text-gray-500">आपके दोस्त को पंजीकरण के दौरान कोड दर्ज करने पर तुरंत उनके वॉलेट में ₹20 मिलते हैं।</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                            <div>
                                <h4 className="font-semibold text-gray-800">आपको इनाम मिलेगा</h4>
                                <p className="text-sm text-gray-500">आपको तुरंत अपने वॉलेट में ₹10 मिलेंगे। आप किसी भी ऑर्डर पर छूट के रूप में ₹5 का उपयोग कर सकते हैं।</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    )
}
