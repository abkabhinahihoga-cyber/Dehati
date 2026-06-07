'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { User, CheckCircle, XCircle, Phone, MapPin, Building2, Bike, FileText, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

export default function AdminDeliveryRequests() {
    const [applicants, setApplicants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRequests = () => {
        axios.get('/api/admin/delivery-requests')
            .then(res => setApplicants(res.data.applicants))
            .catch(() => toast.error("Failed to load requests"))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchRequests() }, [])

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        const toastId = toast.loading("Processing...");
        try {
            const res = await axios.put('/api/admin/delivery-requests', { applicantId: id, action })
            if(res.data.success) {
                toast.success(res.data.message, { id: toastId })
                setApplicants(prev => prev.filter(a => a._id !== id))
            }
        } catch (error) { 
            toast.error("Action failed", { id: toastId }) 
        }
    }

    if (loading) return <div className="p-10 text-center text-indigo-600 font-bold flex flex-col items-center gap-2"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> Loading Applications...</div>

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-black text-gray-800 mb-2 flex items-center gap-3">
                <Building2 className="text-indigo-600" size={32}/> Final Approvals
            </h1>
            <p className="text-gray-500 mb-8">Review and hire delivery partners forwarded by Hub Managers.</p>

            <div className="grid gap-6">
                {applicants.map((app) => (
                    <div key={app._id} className="bg-white p-0 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row overflow-hidden relative group hover:shadow-md transition-all">
                        
                        {/* Hub Badge */}
                        <div className="bg-orange-50 text-orange-700 px-4 py-2 border-b border-orange-100 flex items-center gap-2 md:absolute md:top-0 md:right-0 md:rounded-bl-2xl md:border-b md:border-l text-xs font-bold w-full md:w-auto">
                            <StoreIcon className="w-3 h-3"/> Forwarded by: {app.connectedHub?.name || "Unknown Hub"}
                        </div>

                        {/* Profile Section */}
                        <div className="p-6 flex flex-col md:flex-row gap-6 flex-1">
                            <div className="flex-shrink-0">
                                <div className="w-20 h-20 bg-gray-100 rounded-full overflow-hidden relative border-2 border-white shadow-sm">
                                    {app.image ? <Image src={app.image} fill alt="user" className="object-cover"/> : <User className="w-10 h-10 m-auto text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>}
                                </div>
                            </div>
                            
                            <div className="flex-1 space-y-3">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{app.deliveryDetails?.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium">S/o {app.deliveryDetails?.fatherName}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-lg">
                                        <Phone size={16} className="text-indigo-600"/> 
                                        <span className="font-bold">{app.deliveryDetails?.mobile}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-lg">
                                        <Bike size={16} className="text-indigo-600"/> 
                                        <span className="capitalize font-bold">{app.deliveryDetails?.vehicleType}</span>
                                        {app.deliveryDetails?.vehicleNumber !== 'N/A' && <span className="text-xs bg-white border px-1.5 py-0.5 rounded">{app.deliveryDetails?.vehicleNumber}</span>}
                                    </div>
                                    <div className="col-span-1 sm:col-span-2 flex items-start gap-2 text-gray-600">
                                        <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0"/> 
                                        <span className="leading-snug">{app.deliveryDetails?.address}</span>
                                    </div>
                                </div>

                                {/* Conditionally Show License */}
                                {app.deliveryDetails?.drivingLicense !== 'N/A' && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 border-t pt-3 mt-1">
                                        <FileText size={14}/> Driving License: <span className="font-mono bg-gray-100 px-1 rounded">{app.deliveryDetails?.drivingLicense}</span>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                                    <Calendar size={12}/> Applied: {new Date(app.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row md:flex-col border-t md:border-t-0 md:border-l border-gray-100 divide-x md:divide-x-0 md:divide-y divide-gray-100 w-full md:w-48 bg-gray-50/50">
                            <button onClick={() => handleAction(app._id, 'approve')} className="flex-1 p-4 hover:bg-green-50 text-green-700 hover:text-green-800 font-bold flex flex-col items-center justify-center gap-1 transition-colors group">
                                <div className="p-2 bg-green-100 rounded-full group-hover:scale-110 transition-transform"><CheckCircle size={20}/></div>
                                <span className="text-sm">Approve</span>
                            </button>
                            <button onClick={() => handleAction(app._id, 'reject')} className="flex-1 p-4 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold flex flex-col items-center justify-center gap-1 transition-colors group">
                                <div className="p-2 bg-red-100 rounded-full group-hover:scale-110 transition-transform"><XCircle size={20}/></div>
                                <span className="text-sm">Reject</span>
                            </button>
                        </div>
                    </div>
                ))}

                {applicants.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="text-gray-300" size={32}/>
                        </div>
                        <h3 className="font-bold text-gray-500">All caught up!</h3>
                        <p className="text-sm text-gray-400">No applications pending final approval.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// Simple Icon Component for the badge
function StoreIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
    )
}