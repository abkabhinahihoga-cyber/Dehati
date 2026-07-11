'use client'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, Store, MapPin, ChevronRight, CheckCircle, Heart } from 'lucide-react'
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

    const t = {
        title: isHindi ? 'दुकानें और विक्रेता' : 'Shops & Sellers',
        hubSellers: isHindi ? 'आपके आस-पास की दुकानें' : 'Local Hub Shops',
        following: isHindi ? 'पसंदीदा दुकानें' : 'Favorite Shops',
        loading: isHindi ? 'दुकानें लोड हो रही हैं...' : 'Loading shops...',
        noShops: isHindi ? 'कोई दुकान नहीं मिली।' : 'No shops found.',
        exploreReels: isHindi ? 'रील्स देखें' : 'Explore Reels',
        localSeller: isHindi ? 'स्थानीय विक्रेता' : 'Local Seller',
        visit: isHindi ? 'दुकान देखें' : 'Visit Shop',
        followingStatus: isHindi ? 'आप फॉलो करते हैं' : 'Following'
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

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-5 shadow-md sticky top-0 z-10 flex items-center gap-4 rounded-b-2xl">
                <button onClick={() => router.back()} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm">
                    <ArrowLeft size={22} className="text-white" />
                </button>
                <h1 className="text-2xl font-black tracking-wide">{t.title}</h1>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-6">
                
                {loading ? (
                    <div className="text-center py-20 text-gray-400 font-semibold animate-pulse flex flex-col items-center gap-3">
                        <Store className="w-10 h-10 opacity-40 text-green-600" />
                        <span className="text-lg">{t.loading}</span>
                    </div>
                ) : (
                    <div className="space-y-10">

                        {/* Local Hub Sellers */}
                        {hubSellers.length > 0 && (
                            <section>
                                <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                                    <Store className="text-green-600" />
                                    {t.hubSellers}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {hubSellers.map((shop) => (
                                        <ShopCard key={shop._id} shop={shop} isFollowing={connections.some(c => c._id === shop._id)} router={router} t={t} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Followed Sellers */}
                        {connections.length > 0 && (
                            <section>
                                <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2 mt-8">
                                    <Heart className="text-orange-500" fill="currentColor" />
                                    {t.following}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {connections.map((shop) => (
                                        <ShopCard key={shop._id} shop={shop} isFollowing={true} router={router} t={t} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {hubSellers.length === 0 && connections.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm mt-6">
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                    <Store size={40} className="text-green-500 opacity-60" />
                                </div>
                                <p className="text-lg font-bold text-gray-600">{t.noShops}</p>
                                <button onClick={() => router.push('/reels')} className="mt-8 text-white font-bold text-lg bg-green-600 hover:bg-green-700 transition-colors px-10 py-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 flex items-center gap-2">
                                    {t.exploreReels} <ChevronRight size={20}/>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function ShopCard({ shop, isFollowing, router, t }: { shop: any, isFollowing: boolean, router: any, t: any }) {
    return (
        <div 
            onClick={() => router.push(`/shop/${shop._id}`)} 
            className="bg-white p-5 rounded-3xl flex flex-col gap-4 border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-all cursor-pointer hover:shadow-[0_8px_30px_-12px_rgba(34,197,94,0.3)] hover:border-green-100 group relative overflow-hidden"
        >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-50 to-orange-50 rounded-bl-full opacity-50 -z-0"></div>

            <div className="flex items-center gap-4 relative z-10">
                {/* Shop Image */}
                <div className="w-20 h-20 shrink-0 rounded-2xl p-1 bg-white shadow-sm border border-gray-100">
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-50">
                        <Image src={shop.image || "/avatar.png"} fill alt="shop" className="object-cover" />
                    </div>
                </div>

                {/* Shop Details */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-900 text-xl truncate group-hover:text-green-700 transition-colors">
                        {shop.sellerDetails?.shopName || shop.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1.5 font-medium">
                        <MapPin size={14} className="shrink-0 text-orange-500" />
                        <span className="truncate">{shop.location?.address || t.localSeller}</span>
                    </div>
                    {isFollowing && (
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mt-2">
                            <CheckCircle size={10} /> {t.followingStatus}
                        </div>
                    )}
                </div>
            </div>

            {/* Visit Button */}
            <button className="w-full mt-2 bg-green-50 group-hover:bg-green-600 text-green-700 group-hover:text-white border border-green-100 group-hover:border-green-600 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm">
                {t.visit} <ChevronRight size={18} />
            </button>
        </div>
    )
}
