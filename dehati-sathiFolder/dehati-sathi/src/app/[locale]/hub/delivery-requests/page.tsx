'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { User, CheckCircle, XCircle, Phone, FileText, Bike } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { useLocale } from 'next-intl'

export default function HubDeliveryRequests() {
    const locale = useLocale();
    const [applicants, setApplicants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRequests = () => {
        axios.get('/api/hub/delivery-requests')
            .then(res => setApplicants(res.data.applicants))
            .catch(() => toast.error(locale === 'hi' ? 'अनुरोध लोड करने में विफल' : "Failed to load requests"))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchRequests() }, [])

    const handleAction = async (id: string, action: 'forward' | 'reject') => {
        try {
            const res = await axios.put('/api/hub/delivery-requests', { applicantId: id, action })
            if(res.data.success) {
                toast.success(res.data.message)
                setApplicants(prev => prev.filter(a => a._id !== id))
            }
        } catch (error) { toast.error(locale === 'hi' ? 'कार्रवाई विफल' : "Action failed") }
    }

    if (loading) return <div className="p-8 text-indigo-600 font-bold">{locale === 'hi' ? 'आवेदन लोड हो रहे हैं...' : 'Loading Applications...'}</div>

    return (
        <div className="max-w-5xl mx-auto p-4">
            <h1 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
                <Bike className="text-indigo-600"/> {locale === 'hi' ? 'डिलीवरी आवेदन' : 'Delivery Applications'}
            </h1>

            <div className="grid gap-4">
                {applicants.map((app) => (
                    <div key={app._id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex-shrink-0 overflow-hidden relative border">
                            {app.image ? <Image src={app.image} fill alt="user" className="object-cover"/> : <User className="w-8 h-8 m-auto text-gray-400"/>}
                        </div>
                        
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">{app.deliveryDetails?.name}</h3>
                            <p className="text-sm text-gray-500 mb-2">S/O {app.deliveryDetails?.fatherName}</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 mt-3 bg-gray-50 p-4 rounded-xl">
                                <p className="flex items-center gap-2"><Phone size={14}/> {app.deliveryDetails?.mobile}</p>
                                <p className="flex items-center gap-2"><Bike size={14}/> {app.deliveryDetails?.vehicleType.toUpperCase()} ({app.deliveryDetails?.vehicleNumber})</p>
                                <p className="flex items-center gap-2 col-span-2"><FileText size={14}/> {locale === 'hi' ? 'लाइसेंस: ' : 'License: '} {app.deliveryDetails?.drivingLicense}</p>
                                <p className="text-xs text-gray-400 col-span-2 mt-1">{locale === 'hi' ? 'पता: ' : 'Address: '} {app.deliveryDetails?.address}</p>
                            </div>
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                            <button onClick={() => handleAction(app._id, 'forward')} className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
                                <CheckCircle size={16}/> {locale === 'hi' ? 'एडमिन को अग्रेषित करें' : 'Forward to Admin'}
                            </button>
                            <button onClick={() => handleAction(app._id, 'reject')} className="flex-1 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
                                <XCircle size={16}/> {locale === 'hi' ? 'अस्वीकार करें' : 'Reject'}
                            </button>
                        </div>
                    </div>
                ))}
                {applicants.length === 0 && <div className="text-center p-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed">{locale === 'hi' ? 'कोई लंबित आवेदन नहीं।' : 'No pending applications.'}</div>}
            </div>
        </div>
    )
}