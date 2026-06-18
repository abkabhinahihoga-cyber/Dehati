'use client'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, Store, MapPin, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import axios from 'axios'
import { useLocale } from 'next-intl'

export default function ConnectionsPage() {
    const router = useRouter()
    const isHindi = useLocale() === 'hi'
    const [connections, setConnections] = useState<any[]>([])
    const [hubSellers, setHubSellers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'following' | 'discover'>('discover')

    const t = {
        title: isHindi ? 'दुकानें और विक्रेता' : 'Shops & Sellers',
        hubSellers: isHindi ? 'हब विक्रेता' : 'Hub Sellers',
        following: isHindi ? 'फॉलो कर रहे हैं' : 'Following',
        loading: isHindi ? 'दुकानें लोड हो रही हैं...' : 'Loading shops...',
        noShops: isHindi ? 'कोई दुकान नहीं मिली।' : 'No shops found.',
        exploreReels: isHindi ? 'रील्स देखें' : 'Explore Reels',
        localSeller: isHindi ? 'स्थानीय विक्रेता' : 'Local Seller',
        visit: isHindi ? 'दुकान देखें' : 'Visit Shop',
        unfollow: isHindi ? 'फॉलोइंग' : 'Following'
    }

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const res = await axios.get('/api/user/connections')
                if (res.data.success) {
                    setConnections(res.data.connections)
                    setHubSellers(res.data.hubSellers || [])
                }
            } catch {
                console.error("Failed to load connections")
            } finally {
                setLoading(false)
            }
        }
        fetchConnections()
    }, [])

    const displayList = activeTab === 'following' ? connections : hubSellers

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white px-4 pt-4 flex flex-col border-b sticky top-0 z-10 shadow-sm gap-2">
                <div className="flex items-center gap-4 py-2">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={22} className="text-gray-700" />
                    </button>
                    <h1 className="text-xl font-black text-gray-800 tracking-tight">{t.title}</h1>
                </div>
                <div className="flex gap-6 mt-2">
                    <button className={`pb-3 font-bold text-sm transition-all relative ${activeTab === 'discover' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => setActiveTab('discover')}>
                        {t.hubSellers}
                        {activeTab === 'discover' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full" />}
                    </button>
                    <button className={`pb-3 font-bold text-sm transition-all relative ${activeTab === 'following' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => setActiveTab('following')}>
                        {t.following} ({connections.length})
                        {activeTab === 'following' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full" />}
                    </button>
                </div>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-7xl mx-auto mt-2">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-gray-400 text-sm font-semibold animate-pulse flex flex-col items-center gap-2">
                        <Store className="w-8 h-8 opacity-50" />
                        {t.loading}
                    </div>
                ) : displayList.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                        <Store size={56} className="mb-4 opacity-20 text-indigo-600" />
                        <p className="text-base font-medium text-gray-500">{t.noShops}</p>
                        <button onClick={() => router.push('/reels')} className="mt-6 text-indigo-600 font-bold text-sm bg-indigo-50 hover:bg-indigo-100 transition-colors px-6 py-2.5 rounded-full shadow-sm">
                            {t.exploreReels}
                        </button>
                    </div>
                ) : (
                    displayList.map((shop) => {
                        const isFollowing = connections.some(c => c._id === shop._id)
                        return (
                            <div key={shop._id} onClick={() => router.push(`/shop/${shop._id}`)} className="bg-white p-4 rounded-3xl flex items-center gap-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 active:scale-[0.98] transition-all cursor-pointer group">
                                <div className="w-14 h-14 rounded-full border-2 border-indigo-50 p-0.5 relative shrink-0 group-hover:border-indigo-200 transition-colors">
                                    <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-50">
                                        <Image src={shop.image || "/avatar.png"} fill alt="shop" className="object-cover" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-800 text-base truncate group-hover:text-indigo-700 transition-colors">
                                        {shop.sellerDetails?.shopName || shop.name}
                                    </h3>
                                    <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                                        <MapPin size={12} className="shrink-0" />
                                        <span className="truncate">{shop.location?.address || t.localSeller}</span>
                                    </div>
                                </div>
                                <button className={`text-[10px] sm:text-xs font-bold px-4 py-2 rounded-full border flex items-center gap-1 transition-colors ${isFollowing ? 'text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100' : 'text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100 shadow-sm'}`}>
                                    {isFollowing ? t.unfollow : <><ExternalLink size={12} /> {t.visit}</>}
                                </button>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
