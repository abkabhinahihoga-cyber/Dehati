'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Store, MapPin, FileText, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

function BecomeSellerPage() {
    const router = useRouter()
    const { update, data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const [formData, setFormData] = useState({
        shopName: '',
        shopAddress: '',
        gstin: ''
    })

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
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Application Under Review</h1>
                    <p className="text-gray-500 mb-8">
                        We have received your request to become a seller. Our admin team is verifying your details. You will be notified once approved.
                    </p>
                    <button onClick={() => router.push('/')} className="text-green-600 font-semibold hover:underline">
                        Go back to Home
                    </button>
                </motion.div>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await axios.post('/api/seller/apply', formData)
            if (res.data.success) {
                // Update session to reflect 'pending' status immediately
                await update({ sellerStatus: 'pending' })
                setSubmitted(true)
                toast.success("Application Submitted Successfully!")
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-green-700 transition">
                    <ArrowLeft className="w-5 h-5" /> Back
                </button>

                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-3xl shadow-xl overflow-hidden"
                >
                    <div className="bg-green-700 p-8 text-white text-center">
                        <Store className="w-16 h-16 mx-auto mb-4 opacity-90" />
                        <h1 className="text-3xl font-bold mb-2">Become a Seller</h1>
                        <p className="opacity-90">Start selling your farm produce directly to customers.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Shop / Farm Name</label>
                            <div className="relative">
                                <Store className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                                    placeholder="e.g. Rahul's Organic Farm"
                                    value={formData.shopName}
                                    onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <textarea 
                                    required
                                    rows={3}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all resize-none"
                                    placeholder="Full address where pickup will happen"
                                    value={formData.shopAddress}
                                    onChange={(e) => setFormData({...formData, shopAddress: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">GSTIN (Optional)</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all uppercase"
                                    placeholder="Enter GSTIN if available"
                                    value={formData.gstin}
                                    onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-800 transition-all flex items-center justify-center gap-2 disabled:bg-gray-300"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Submit Application"}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}

export default BecomeSellerPage