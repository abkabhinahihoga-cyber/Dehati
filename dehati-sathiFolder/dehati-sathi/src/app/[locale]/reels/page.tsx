'use client'
import React, { useEffect, useState, useRef } from 'react'
import ReelCard from '@/components/reels/ReelCard'
import { Loader2, ArrowLeft, MapPin, MapPinOff } from 'lucide-react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'

export default function ReelsPage() {
    const router = useRouter()
    const [videos, setVideos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeIndex, setActiveIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)

    // 👇 1. Get Location from Global Redux Store (Synced with Navbar)
    const { latitude, longitude, address } = useSelector((state: RootState) => state.location);

    useEffect(() => {
        // Fetch initially or when location changes
        const lat = latitude || 0;
        const lng = longitude || 0;
        fetchReels(lat, lng);
    }, [latitude, longitude]); 

    const fetchReels = async (lat: number, lng: number) => {
        try {
            if (videos.length === 0) setLoading(true);
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

    const handleScroll = () => {
        if (containerRef.current) {
            const scrollPosition = containerRef.current.scrollTop;
            const windowHeight = containerRef.current.clientHeight;
            const index = Math.round(scrollPosition / windowHeight);
            if (index !== activeIndex && index >= 0 && index < videos.length) {
                setActiveIndex(index);
            }
        }
    };

    const isPersonalized = latitude !== 0 && longitude !== 0;

    return (
        <div className="bg-black h-[100dvh] w-full flex flex-col md:items-center relative overflow-hidden">
            
            {/* Header */}
            <div className="absolute top-0 left-0 w-full z-50 p-4 pt-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <button onClick={() => router.back()} className="text-white pointer-events-auto p-2 bg-black/20 backdrop-blur-md rounded-full hover:bg-black/40 transition">
                    <ArrowLeft size={24} />
                </button>
                
                <div className="flex flex-col items-center pointer-events-auto">
                    <h1 className="text-white font-bold text-lg tracking-wide drop-shadow-md">Dehati Reels</h1>
                    <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                        {isPersonalized ? (
                            <>
                                <MapPin size={10} className="text-green-400" />
                                <span className="text-[10px] text-gray-200 max-w-[150px] truncate">
                                    {address?.split(',')[0] || "Nearby"}
                                </span>
                            </>
                        ) : (
                            <>
                                <MapPinOff size={10} className="text-gray-400" />
                                <span className="text-[10px] text-gray-400">Global Feed</span>
                            </>
                        )}
                    </div>
                </div>
                
                <div className="w-10"></div>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <Loader2 className="animate-spin text-green-500 w-10 h-10" />
                    <p className="text-white text-sm font-medium animate-pulse">
                        {isPersonalized ? "Finding fresh crops near you..." : "Loading Global Feed..."}
                    </p>
                </div>
            ) : (
                /* Scroll Container */
                <div 
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="w-full h-full md:max-w-[420px] overflow-y-scroll snap-y snap-mandatory scrollbar-hide scroll-smooth"
                >
                    {videos.map((video, index) => (
                        <ReelCard key={video._id} video={video} isActive={index === activeIndex} />
                    ))}
                    
                    {videos.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-white p-10 text-center">
                            <p className="text-lg font-bold mb-2">No reels here yet! 🌾</p>
                            <p className="text-sm text-gray-400">
                                {isPersonalized ? "No sellers found in your 5km radius." : "Check back later for new content."}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}