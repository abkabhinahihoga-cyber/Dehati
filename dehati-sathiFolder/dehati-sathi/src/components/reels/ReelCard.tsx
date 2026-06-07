'use client'
import React, { useRef, useState, useEffect } from 'react'
import { Heart, Share2, MessageCircle, X, Send, Volume2, VolumeX, Play } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import axios from 'axios'

interface ReelProps {
    video: any;
    isActive: boolean;
}

export default function ReelCard({ video, isActive }: ReelProps) {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastClickTime = useRef<number>(0);
    
    // Playback States
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true); 
    const [isBuffering, setIsBuffering] = useState(false);
    
    // Interaction States
    const [isLiked, setIsLiked] = useState(video.isLiked || false);
    const [likesCount, setLikesCount] = useState(video.likes?.length || 0);
    const [isConnected, setIsConnected] = useState(video.isConnected || false); 
    
    // UI States
    const [showBuzz, setShowBuzz] = useState(false);
    const [showHeartOverlay, setShowHeartOverlay] = useState(false);
    const [showPlayOverlay, setShowPlayOverlay] = useState(false);
    const [progress, setProgress] = useState(0);
    
    // Comments Data
    const [buzzes, setBuzzes] = useState<any[]>([]);
    const [newBuzz, setNewBuzz] = useState("");
    const [buzzCount, setBuzzCount] = useState(video.buzzCount || 0);

    // 🎥 Handle Active State
    useEffect(() => {
        if (isActive) {
            const playPromise = videoRef.current?.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(() => {
                        setIsMuted(true);
                        videoRef.current?.play();
                    });
            }
        } else {
            videoRef.current?.pause();
            setIsPlaying(false);
            if(videoRef.current) videoRef.current.currentTime = 0;
        }
    }, [isActive]);

    // ⏯️ Toggle Play/Pause
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
                setShowPlayOverlay(true);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
                setShowPlayOverlay(false);
                setTimeout(() => setShowPlayOverlay(false), 600);
            }
        }
    };

    // 🔊 Toggle Mute
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextMuteState = !isMuted;
        setIsMuted(nextMuteState);
        if(videoRef.current) videoRef.current.muted = nextMuteState;
    };

    // 👆 Handle Tap (Double vs Single)
    const handleVideoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastClickTime.current < DOUBLE_TAP_DELAY) {
            handleLike(true);
        } else {
            togglePlay();
        }
        lastClickTime.current = now;
    };

    // ❤️ Like Logic
    const handleLike = async (doubleTap = false) => {
        const newStatus = !isLiked;
        if (doubleTap) {
            setShowHeartOverlay(true);
            setTimeout(() => setShowHeartOverlay(false), 800);
            if (!isLiked) {
                setIsLiked(true);
                setLikesCount((prev: number) => prev + 1);
            }
        } else {
            setIsLiked(newStatus);
            setLikesCount((prev: number) => newStatus ? prev + 1 : prev - 1);
        }
        // await axios.post('/api/reels/like', { videoId: video._id });
    };

    // 🚀 SHARE LOGIC (FIXED)
    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Construct a shareable URL (adjust domain as needed)
        const shareUrl = `${window.location.origin}/reels?id=${video._id}`;
        const shareData = {
            title: `Watch this reel from ${video.seller?.name || "Dehati Sathi"}`,
            text: video.description,
            url: shareUrl,
        };

        try {
            // Check if Native Share API is supported (Mobile)
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback for Desktop: Copy to clipboard
                await navigator.clipboard.writeText(shareUrl);
                toast.success("Link copied to clipboard! 📋");
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    // Connect / Follow
    const handleConnect = async (e: any) => {
        e.stopPropagation();
        const prev = isConnected;
        setIsConnected(!prev);
        try {
            await axios.post('/api/user/connect', { targetUserId: video.seller._id });
            toast.success(prev ? "Unfollowed" : "Following!");
        } catch (error) {
            setIsConnected(prev);
            toast.error("Connection failed");
        }
    }

    // Navigation
    const goToShop = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/shop/${video.seller._id}`);
    };

    // Comments
    const openBuzz = async (e:any) => {
        e.stopPropagation();
        setShowBuzz(true);
        try {
            const res = await axios.get(`/api/reels/buzz?videoId=${video._id}`);
            if(res.data.success) setBuzzes(res.data.buzzes);
        } catch (e) {}
    };

    const postBuzz = async () => {
        if(!newBuzz.trim()) return;
        try {
            const res = await axios.post('/api/reels/buzz', { videoId: video._id, content: newBuzz });
            if(res.data.success) {
                setBuzzes([res.data.buzz, ...buzzes]);
                setNewBuzz("");
                setBuzzCount((prev: number) => prev + 1);
            }
        } catch (error) { toast.error("Failed to post") }
    };

    return (
        <div className="relative w-full h-[100dvh] bg-black snap-start shrink-0 flex items-center justify-center overflow-hidden">
            
            {/* VIDEO PLAYER */}
            <div className="relative w-full h-full cursor-pointer" onClick={handleVideoClick}>
                <video
                    ref={videoRef}
                    src={video.videoUrl}
                    className="w-full h-full object-cover"
                    loop
                    muted={isMuted}
                    playsInline
                    onWaiting={() => setIsBuffering(true)}
                    onPlaying={() => setIsBuffering(false)}
                    onTimeUpdate={() => {
                        if(videoRef.current) setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
                    }}
                />
                
                {/* Buffering */}
                {isBuffering && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Play/Pause Overlay */}
                {!isPlaying && !isBuffering && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
                        <div className="bg-black/40 p-4 rounded-full backdrop-blur-sm">
                            <Play size={40} className="fill-white text-white translate-x-1" />
                        </div>
                    </div>
                )}

                {/* Double Tap Heart */}
                <AnimatePresence>
                    {showHeartOverlay && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 0, rotate: -20 }}
                            animate={{ scale: 1.2, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0, opacity: 0, rotate: 20 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
                        >
                            <Heart size={100} className="fill-white text-white drop-shadow-2xl" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* SOUND CONTROL */}
            <button 
                onClick={toggleMute}
                className="absolute top-20 right-4 z-30 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all"
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* INFO OVERLAY */}
            <div className="absolute bottom-4 left-4 right-16 z-20 text-white pb-6">
                <div className="flex items-center gap-2 mb-3">
                    <div onClick={goToShop} className="w-10 h-10 rounded-full border-2 border-green-500 p-0.5 cursor-pointer hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-full overflow-hidden relative bg-gray-800">
                            <Image src={video.seller.image || "/avatar.png"} fill alt="seller" className="object-cover" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span onClick={goToShop} className="font-bold text-sm drop-shadow-md cursor-pointer hover:underline">
                            {video.seller.sellerDetails?.shopName || video.seller.name}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-200">📍 {video.seller.followersCount || 0} Followers</span>
                            <button 
                                onClick={handleConnect}
                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition flex items-center gap-1 ${
                                    isConnected ? 'bg-white/20 text-white' : 'bg-green-600 text-white'
                                }`}
                            >
                                {isConnected ? "Following" : "Follow"}
                            </button>
                        </div>
                    </div>
                </div>
                
                <p className="text-sm text-gray-100 line-clamp-2 drop-shadow-md leading-relaxed mb-3">
                    {video.description} 
                </p>
                
                {video.product && (
                    <div onClick={(e) => { e.stopPropagation(); router.push(`/product/${video.product._id}`); }} className="bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-lg flex items-center gap-3 w-fit cursor-pointer hover:bg-black/80 transition shadow-lg">
                        <div className="w-10 h-10 relative rounded overflow-hidden bg-white">
                            <Image src={video.product.images?.[0] || "/placeholder.png"} fill alt="p" className="object-cover"/>
                        </div>
                        <div>
                            <p className="text-xs font-bold truncate max-w-[140px] text-white">{video.product.name}</p>
                            <p className="text-[10px] text-green-400 font-bold">₹{video.product.price} <span className="text-gray-400 font-normal"> Shop Now →</span></p>
                        </div>
                    </div>
                )}
            </div>

            {/* SIDEBAR ACTIONS */}
            <div className="absolute bottom-24 right-2 z-30 flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-1">
                    <button onClick={(e) => {e.stopPropagation(); handleLike()}} className="active:scale-90 transition-transform">
                        <Heart size={32} className={isLiked ? "fill-red-500 text-red-500" : "text-white drop-shadow-lg"} />
                    </button>
                    <span className="text-white text-xs font-bold drop-shadow-md">{likesCount}</span>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                    <button onClick={openBuzz} className="active:scale-90 transition-transform">
                        <MessageCircle size={32} className="text-white drop-shadow-lg" />
                    </button>
                    <span className="text-white text-xs font-bold drop-shadow-md">{buzzCount}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    {/* 👇 SHARE BUTTON FIXED */}
                    <button onClick={handleShare} className="active:scale-90 transition-transform">
                        <Share2 size={32} className="text-white drop-shadow-lg" />
                    </button>
                    <span className="text-white text-xs font-bold drop-shadow-md">Share</span>
                </div>
            </div>

            {/* COMMENTS SHEET */}
            <AnimatePresence>
                {showBuzz && (
                    <>
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowBuzz(false)} className="absolute inset-0 bg-black/50 z-40" />
                        <motion.div 
                            initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }}
                            className="absolute bottom-0 w-full h-[60%] bg-white z-50 rounded-t-3xl flex flex-col overflow-hidden"
                        >
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <h3 className="font-bold text-gray-800">Buzz ({buzzCount})</h3>
                                <button onClick={() => setShowBuzz(false)}><X className="text-gray-500"/></button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {buzzes.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                                        <MessageCircle size={40} className="mb-2"/>
                                        <p className="text-sm">Start the conversation!</p>
                                    </div>
                                ) : (
                                    buzzes.map((b: any) => (
                                        <div key={b._id} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 relative overflow-hidden shrink-0">
                                                <Image src={b.user.image || "/avatar.png"} fill alt="u" className="object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">{b.user.name}</p>
                                                <p className="text-sm text-gray-700 leading-snug">{b.content}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2 items-center">
                                <input 
                                    value={newBuzz} 
                                    onChange={(e) => setNewBuzz(e.target.value)} 
                                    className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-green-500 text-black"
                                    placeholder="Add to the buzz..."
                                />
                                <button onClick={postBuzz} disabled={!newBuzz.trim()} className="p-2.5 bg-green-600 text-white rounded-full disabled:opacity-50 hover:bg-green-700 transition">
                                    <Send size={18} />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* PROGRESS BAR */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800/30 z-40">
                <div className="h-full bg-green-500 transition-all duration-100 linear" style={{ width: `${progress}%` }} />
            </div>
        </div>
    )
}