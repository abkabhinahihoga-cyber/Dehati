'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Store, MapPin, CheckCircle, ArrowLeft, Loader2, CheckSquare, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useLocale } from 'next-intl'

function BecomeSellerPage() {
    const router = useRouter()
    const isHindi = useLocale() === 'hi'
    const { update, data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [termsAccepted, setTermsAccepted] = useState(false)

    const [formData, setFormData] = useState({
        shopName: '',
        shopAddress: '',
    })

    const t = {
        title: isHindi ? 'विक्रेता बनें' : 'Become a Seller',
        subtitle: isHindi ? 'अपने खेत की उपज सीधे ग्राहकों को बेचना शुरू करें।' : 'Start selling your farm produce directly to customers.',
        shopName: isHindi ? 'दुकान / खेत का नाम' : 'Shop / Farm Name',
        shopNamePlaceholder: isHindi ? 'जैसे: राहुल का जैविक फार्म' : "e.g. Rahul's Organic Farm",
        shopAddress: isHindi ? 'दुकान का पता' : 'Shop Address',
        shopAddressPlaceholder: isHindi ? 'पूरा पता जहां से पिकअप होगा' : 'Full address where pickup will happen',
        terms: isHindi ? 'नियम और शर्तें' : 'Terms & Conditions',
        term1: isHindi ? 'मैं केवल ताज़ा और गुणवत्तापूर्ण उत्पाद बेचूंगा/बेचूंगी।' : 'I will only sell fresh and quality products.',
        term2: isHindi ? 'मैं सही मूल्य और विवरण प्रदान करूंगा/करूंगी।' : 'I will provide accurate pricing and descriptions.',
        term3: isHindi ? 'मैं समय पर ऑर्डर तैयार करूंगा/करूंगी।' : 'I will prepare orders on time.',
        term4: isHindi ? 'प्लेटफॉर्म की नीतियों का पालन करूंगा/करूंगी।' : 'I will follow the platform policies.',
        acceptTerms: isHindi ? 'मैं उपरोक्त सभी नियमों और शर्तों से सहमत हूं।' : 'I agree to all the above terms and conditions.',
        submit: isHindi ? 'आवेदन जमा करें' : 'Submit Application',
        submitting: isHindi ? 'जमा हो रहा है...' : 'Submitting...',
        back: isHindi ? 'वापस' : 'Back',
        pendingTitle: isHindi ? 'आवेदन समीक्षा में है' : 'Application Under Review',
        pendingMsg: isHindi ? 'विक्रेता बनने का आपका अनुरोध प्राप्त हो गया है। हमारी एडमिन टीम आपके विवरणों की पुष्टि कर रही है। स्वीकृति के बाद आपको सूचित किया जाएगा।' : 'We have received your request to become a seller. Our admin team is verifying your details. You will be notified once approved.',
        goHome: isHindi ? 'होम पर जाएं' : 'Go back to Home',
        pleaseAcceptTerms: isHindi ? 'कृपया नियम और शर्तें स्वीकार करें' : 'Please accept the terms and conditions',
    }

    // Redirect if already approved
    if (session?.user?.role === 'seller') {
        router.push('/seller/dashboard')
        return null
    }

    // Show "Pending" view if already applied
    if (session?.user?.sellerStatus === 'pending' || submitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full"
                >
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.pendingTitle}</h1>
                    <p className="text-gray-500 mb-8">{t.pendingMsg}</p>
                    <button onClick={() => router.push('/')} className="text-green-600 font-semibold hover:underline">
                        {t.goHome}
                    </button>
                </motion.div>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!termsAccepted) {
            return toast.error(t.pleaseAcceptTerms)
        }
        setLoading(true)
        try {
            const res = await axios.post('/api/seller/apply', formData)
            if (res.data.success) {
                await update({ sellerStatus: 'pending' })
                setSubmitted(true)
                toast.success(isHindi ? 'आवेदन सफलतापूर्वक जमा हो गया!' : 'Application Submitted Successfully!')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || (isHindi ? 'जमा करने में विफल' : 'Failed to submit'))
        } finally {
            setLoading(false)
        }
    }

    const termsItems = [t.term1, t.term2, t.term3, t.term4]

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-green-700 transition">
                    <ArrowLeft className="w-5 h-5" /> {t.back}
                </button>

                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-3xl shadow-xl overflow-hidden"
                >
                    <div className="bg-green-700 p-8 text-white text-center">
                        <Store className="w-16 h-16 mx-auto mb-4 opacity-90" />
                        <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
                        <p className="opacity-90">{t.subtitle}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.shopName}</label>
                            <div className="relative">
                                <Store className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                                    placeholder={t.shopNamePlaceholder}
                                    value={formData.shopName}
                                    onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.shopAddress}</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <textarea 
                                    required
                                    rows={3}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all resize-none"
                                    placeholder={t.shopAddressPlaceholder}
                                    value={formData.shopAddress}
                                    onChange={(e) => setFormData({...formData, shopAddress: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
                            <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" /> {t.terms}
                            </h3>
                            <ul className="space-y-3 mb-5">
                                {termsItems.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-green-700">
                                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <button 
                                type="button" 
                                onClick={() => setTermsAccepted(!termsAccepted)}
                                className="flex items-center gap-3 w-full text-left"
                            >
                                {termsAccepted ? (
                                    <CheckSquare className="w-5 h-5 text-green-600 shrink-0" />
                                ) : (
                                    <Square className="w-5 h-5 text-gray-400 shrink-0" />
                                )}
                                <span className={`text-sm font-semibold ${termsAccepted ? 'text-green-700' : 'text-gray-600'}`}>
                                    {t.acceptTerms}
                                </span>
                            </button>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || !termsAccepted}
                            className="w-full bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-800 transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {loading ? <><Loader2 className="animate-spin" /> {t.submitting}</> : t.submit}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}

export default BecomeSellerPage
