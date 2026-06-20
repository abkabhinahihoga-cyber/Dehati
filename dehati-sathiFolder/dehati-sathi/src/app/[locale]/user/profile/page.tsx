'use client'
import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Loader2, MapPin, Phone, Save, User, UploadCloud } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner' // Using sonner for professional toasts
import { useLocale } from 'next-intl'

function ProfilePage() {
    const locale = useLocale()
    const router = useRouter()
    const { update, data: session } = useSession()
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [imagePreview, setImagePreview] = useState('')
    
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        address: '',
    })

    // Fetch fresh data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // We can use session data for initial load for speed, then fetch fresh
                if(session?.user) {
                     setFormData(prev => ({...prev, name: session.user.name || ''}))
                     setImagePreview(session.user.image || '')
                }

                const res = await axios.get('/api/me')
                const u = res.data
                setFormData({
                    name: u.name || '',
                    mobile: u.mobile || '',
                    address: u.location?.address || '',
                })
                setImagePreview(u.image || '')
            } catch (error) {
                toast.error("Failed to load profile data")
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [session])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    // Handle Image Selection & Preview
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit check
                toast.error(locale === 'hi' ? 'छवि का आकार 2MB से कम होना चाहिए' : "Image size should be less than 2MB")
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            // Prepare payload. If imagePreview is base64 string, send it.
            // Note: For production, upload to Cloudinary/S3 first and send URL here.
            const payload = {
                ...formData,
                image: imagePreview.startsWith('data:') ? imagePreview : undefined
            }

            const res = await axios.put('/api/user/update-profile', payload)
            
            if (res.data.success) {
                // Update Client-side session immediately
                await update({
                    name: formData.name,
                    
                })
                toast.success(locale === 'hi' ? 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!' : "Profile updated successfully!")
                router.refresh()
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || (locale === 'hi' ? 'प्रोफ़ाइल अपडेट करने में विफल' : "Failed to update profile")
            toast.error(msg)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <ProfileSkeleton />
    }

    return (
        
        <div className="min-h-screen bg-gray-100 p-4 md:p-8 pb-24">
            {/* Header */}
            <div className="max-w-3xl mx-auto flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition border border-gray-200">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{locale === 'hi' ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile'}</h1>
                    <p className='text-sm text-gray-500'>{locale === 'hi' ? 'अपना व्यक्तिगत विवरण अपडेट करें' : 'Update your personal details'}</p>
                </div>
            </div>
                    
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
            >
                <form onSubmit={handleSubmit} className="p-6 md:p-10">
                    
                    {/* --- Image Upload Section --- */}
                    <div className="flex flex-col items-center mb-10">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageChange} 
                            accept="image/png, image/jpeg, image/jpg"
                            className="hidden" 
                        />
                        <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                            <div className="w-32 h-32 rounded-full border-4 border-green-50 bg-gray-100 overflow-hidden relative shadow-inner">
                                {imagePreview ? (
                                    <Image src={imagePreview} alt="Profile" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <User className="w-16 h-16" />
                                    </div>
                                )}
                            </div>
                            {/* Edit Overlay */}
                            <div className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center transition-opacity ${imagePreview ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                                <Camera className="text-white w-8 h-8" />
                            </div>
                        </div>
                        <p className='text-sm text-gray-500 mt-3'>{locale === 'hi' ? 'फोटो बदलने के लिए टैप करें' : 'Tap to change photo'}</p>
                    </div>

                    {/* --- Inputs Section --- */}
                    <div className="grid gap-6">
                        
                        <InputField 
                            label={locale === 'hi' ? 'पूरा नाम' : "Full Name"}
                            icon={<User />}
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder={locale === 'hi' ? 'अपना पूरा नाम दर्ज करें' : "Enter your full name"}
                            required
                        />

                         <InputField 
                            label={locale === 'hi' ? 'मोबाइल नंबर' : "Mobile Number"}
                            icon={<Phone />}
                            name="mobile"
                            type="tel"
                            value={formData.mobile}
                            onChange={handleChange}
                            placeholder="e.g. 9876543210"
                        />

                        {/* Address Textarea */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">{locale === 'hi' ? 'डिलीवरी का पता' : 'Delivery Address'}</label>
                            <div className="relative">
                                <div className="absolute left-4 top-4 text-gray-400">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <textarea 
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all resize-none text-gray-800 font-medium placeholder:text-gray-400"
                                    placeholder={locale === 'hi' ? 'गांव, पोस्ट, जिला दर्ज करें...' : "Enter Village, Post, District..."}
                                />
                            </div>
                        </div>
                    </div>

                    {/* --- Submit Button --- */}
                    <div className='mt-10'>
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-green-700 hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin w-5 h-5" /> {locale === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...'}
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" /> {locale === 'hi' ? 'परिवर्तन सहेजें' : 'Save Changes'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

// --- Reusable Input Field Component for cleaner code ---
const InputField = ({ label, icon, name, value, onChange, type = "text", placeholder, required = false }: any) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
            {label} {required && <span className='text-red-500'>*</span>}
        </label>
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                {React.cloneElement(icon, { className: "w-5 h-5" })}
            </div>
            <input 
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all text-gray-800 font-medium placeholder:text-gray-400"
                placeholder={placeholder}
            />
        </div>
    </div>
);

// --- Loading Skeleton for professional feel ---
const ProfileSkeleton = () => (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-3xl mx-auto mb-8 flex gap-4 items-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-10">
            <div className="flex justify-center mb-10">
                <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse"></div>
            </div>
            <div className="space-y-6">
                <div className="h-14 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="h-14 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
        </div>
    </div>
);

export default ProfilePage