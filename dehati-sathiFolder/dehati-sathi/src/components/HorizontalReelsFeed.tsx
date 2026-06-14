'use client'
import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { PlayCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

export default function HorizontalReelsFeed() {
    const router = useRouter()
    const t = useTranslations('Nav')
    const [videos, setVideos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Get Location from Global Redux Store
    const { latitude, longitude } = useSelector((state: RootState) => (state as any).location || { latitude: 0, longitude: 0 });

    useEffect(() => {
        const lat = latitude || 0;
        const lng = longitude || 0;
        fetchReels(lat, lng);
    }, [latitude, longitude]); 

    const fetchReels = async (lat: number, lng: number) => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/reels/feed?lat=${lat}&lng=${lng}`);
            if (res.data.success) {
                setVideos(res.data.videos);
            }
        } catch (error) {
            console.error("Failed to load reels", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="py-6 px-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-pink-600" /> {t('reels') || 'Reels'}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-32 h-56 shrink-0 bg-gray-200 animate-pulse rounded-xl" />
                ))}
            </div>
        </div>
    )

    if (videos.length === 0) return null;

    return (
        <div className="py-6 px-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-pink-600" /> {t('reels') || 'Reels'}
            </h2>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {videos.map((video) => (
                    <div 
                        key={video._id}
                        onClick={() => router.push('/reels')}
                        className="w-32 h-56 shrink-0 rounded-xl overflow-hidden relative cursor-pointer snap-start shadow-sm border border-gray-100 group"
                    >
                        {video.thumbnailUrl ? (
                            <Image src={video.thumbnailUrl} alt="Reel" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <video 
                                src={video.videoUrl} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                autoPlay 
                                muted 
                                loop 
                                playsInline 
                            />
                        )}
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        
                        {/* Content */}
                        <div className="absolute bottom-0 left-0 w-full p-2">
                            <div className="text-white text-xs font-bold truncate drop-shadow-md">
                                {video.product?.name || "Product"}
                            </div>
                            <div className="text-gray-200 text-[10px] truncate drop-shadow-md">
                                {video.seller?.name || "Seller"}
                            </div>
                        </div>

                        {/* Play Icon Overlay */}
                        <div className="absolute top-2 right-2 text-white/80">
                            <PlayCircle className="w-5 h-5" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
