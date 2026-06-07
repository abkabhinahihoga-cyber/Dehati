'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Store, MapPin, Check, Loader2 } from 'lucide-react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function HubSelectorModal({ 
    isOpen, 
    onClose, 
    forceSelection = false 
}: { 
    isOpen: boolean; 
    onClose: () => void;
    forceSelection?: boolean;
}) {
    const [hubs, setHubs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { latitude, longitude } = useSelector((state: RootState) => state.location)
    const { data: session, update } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (!isOpen) return;

        const fetchHubs = async () => {
            try {
                const res = await axios.get('/api/hub/all')
                if (res.data.success) {
                    let fetchedHubs = res.data.hubs;
                    
                    // Sort by distance if user location is available
                    if (latitude && longitude) {
                        fetchedHubs = fetchedHubs.map((hub: any) => {
                            if (hub.location?.coordinates) {
                                const [lng, lat] = hub.location.coordinates;
                                const distance = getDistanceInMeters(latitude, longitude, lat, lng);
                                return { ...hub, distance };
                            }
                            return { ...hub, distance: Infinity };
                        }).sort((a: any, b: any) => a.distance - b.distance);
                    }
                    
                    setHubs(fetchedHubs);
                }
            } catch (error) {
                console.error("Failed to fetch hubs", error)
            } finally {
                setLoading(false)
            }
        }
        fetchHubs()
    }, [isOpen, latitude, longitude])

    const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; 
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; 
    }

    const selectHub = async (hubId: string) => {
        if (!session?.user) {
            toast.error("Please login to select a hub")
            return
        }

        setSaving(true)
        try {
            const res = await axios.post('/api/user/update-hub', { hubId })
            if (res.data.success) {
                toast.success("Hub connected successfully!")
                // Force full page reload so session refreshes completely (fixes double-click issue)
                await update()
                onClose()
                setTimeout(() => { window.location.href = '/'; }, 300)
            }
        } catch (error) {
            toast.error("Failed to connect to hub")
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
                >
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-100">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-2xl font-extrabold text-green-800 flex items-center gap-2">
                                <Store size={24} />
                                Connect to a Hub
                            </h2>
                            {!forceSelection && (
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-green-700/80">Select your nearest hub to see available products and delivery options in your area.</p>
                    </div>

                    <div className="p-4 max-h-[60vh] overflow-y-auto bg-gray-50/50">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-green-600">
                                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                <p className="text-sm font-semibold animate-pulse">Finding hubs near you...</p>
                            </div>
                        ) : hubs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No hubs found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {hubs.map((hub) => {
                                    const isCurrent = session?.user?.connectedHub === hub._id;
                                    const distanceKm = hub.distance && hub.distance !== Infinity ? (hub.distance / 1000).toFixed(1) : null;
                                    
                                    return (
                                        <button
                                            key={hub._id}
                                            onClick={() => selectHub(hub._id)}
                                            disabled={saving}
                                            className={`w-full text-left p-4 rounded-2xl transition-all border-2 group relative overflow-hidden
                                                ${isCurrent 
                                                    ? 'bg-green-50 border-green-500 shadow-sm' 
                                                    : 'bg-white border-transparent hover:border-green-200 hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between relative z-10">
                                                <div>
                                                    <h3 className={`font-bold text-lg mb-1 ${isCurrent ? 'text-green-800' : 'text-gray-800 group-hover:text-green-700'}`}>
                                                        {hub.name}
                                                    </h3>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <MapPin size={12} /> {hub.address || "Hub location"}
                                                        </span>
                                                        {distanceKm && (
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${Number(distanceKm) > 3.5 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                                {distanceKm} km away {Number(distanceKm) > 3.5 && '(Pickup only)'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                                                    ${isCurrent ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 group-hover:bg-green-100 group-hover:text-green-600'}`}>
                                                    {isCurrent ? <Check size={18} /> : <Store size={16} />}
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                    {saving && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-20">
                            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
