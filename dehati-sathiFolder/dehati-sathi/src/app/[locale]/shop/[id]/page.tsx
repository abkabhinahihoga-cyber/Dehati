'use client'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, MapPin, UserPlus, UserCheck, Grid, PlayCircle, Star, MessageCircle, ShoppingBag } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import axios from 'axios'
import { toast } from 'sonner'

export default function ShopProfile() {
    const router = useRouter();
    const { id } = useParams();
    
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'products' | 'reels' | 'reviews'>('products');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const fetchShop = async () => {
            try {
                const res = await axios.get(`/api/shop/${id}`);
                if (res.data.success) {
                    setData(res.data);
                    setIsConnected(res.data.isConnected);
                }
            } catch (error) {
                toast.error("Could not load shop details");
            } finally {
                setLoading(false);
            }
        };
        if(id) fetchShop();
    }, [id]);

    const handleConnect = async () => {
        const prev = isConnected;
        setIsConnected(!prev);
        // Optimistic update for UI
        setData((prevData: any) => ({
            ...prevData,
            seller: {
                ...prevData.seller,
                followersCount: prevData.seller.followersCount + (prev ? -1 : 1)
            }
        }));

        try {
            await axios.post('/api/user/connect', { targetUserId: id });
            toast.success(prev ? "Unfollowed" : "Following!");
        } catch (error) {
            setIsConnected(prev); // Revert
            toast.error("Connection failed");
        }
    };

    // 👇 NEW: Handle Message Button Click
    const handleMessage = async () => {
        try {
            // 1. Create or Get Conversation ID
            const res = await axios.post('/api/chat/create', { targetUserId: id });
            
            if (res.data.success) {
                // 2. Redirect to the Chat Interface
                router.push(`/chat/${res.data.conversationId}`);
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                toast.error("Please login to chat");
                router.push('/login');
            } else {
                toast.error("Could not start chat");
                console.error(error);
            }
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-white"><div className="animate-pulse text-green-600 font-bold">Loading Shop...</div></div>;
    if (!data) return <div className="h-screen flex items-center justify-center text-gray-500">Shop not found</div>;

    const { seller, products, reels, reviews, shopRating, reviewCount } = data;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            
            {/* 1. Header Section */}
            <div className="bg-white pb-4 rounded-b-3xl shadow-sm border-b border-gray-100 relative overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-green-400 to-emerald-600 relative">
                    <button onClick={() => router.back()} className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30">
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <div className="px-5">
                    <div className="relative -mt-12 mb-3 flex justify-between items-end">
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-md relative overflow-hidden bg-gray-200">
                            <Image src={seller.image || "/avatar.png"} fill alt="Shop" className="object-cover" />
                        </div>
                        
                        <div className="flex gap-2 mb-2">
                            {/* 👇 UPDATED: Message Button */}
                            <button 
                                onClick={handleMessage}
                                className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <MessageCircle size={20} />
                            </button>
                            
                            <button 
                                onClick={handleConnect}
                                className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${
                                    isConnected ? 'bg-gray-100 text-gray-700 border border-gray-200' : 'bg-green-600 text-white shadow-lg shadow-green-200'
                                }`}
                            >
                                {isConnected ? <><UserCheck size={16}/> Following</> : <><UserPlus size={16}/> Follow</>}
                            </button>
                        </div>
                    </div>

                    <h1 className="text-2xl font-black text-gray-800">{seller.sellerDetails?.shopName || seller.name}</h1>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                        <MapPin size={14} />
                        <span>{seller.location?.address || "Local Seller"}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 mt-4 py-3 border-t border-b border-gray-50">
                        <div className="text-center">
                            <span className="block font-bold text-gray-800 text-lg">{seller.followersCount || 0}</span>
                            <span className="text-xs text-gray-400 uppercase font-bold tracking-wide">Followers</span>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-gray-800 text-lg">{products.length}</span>
                            <span className="text-xs text-gray-400 uppercase font-bold tracking-wide">Products</span>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-gray-800 text-lg">
                                {shopRating} <Star size={12} className="inline text-yellow-400 -mt-1 fill-yellow-400"/>
                            </span>
                            <span className="text-xs text-gray-400 uppercase font-bold tracking-wide">{reviewCount} Reviews</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Tabs */}
            <div className="flex justify-center mt-2 sticky top-0 bg-gray-50 z-20 pt-2 pb-2">
                <div className="bg-white p-1 rounded-full shadow-sm border border-gray-100 flex w-[95%] max-w-md justify-between">
                    <button onClick={() => setActiveTab('products')} className={`flex-1 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1 transition-all ${activeTab === 'products' ? 'bg-green-100 text-green-700' : 'text-gray-400'}`}>
                        <Grid size={14} /> Products
                    </button>
                    <button onClick={() => setActiveTab('reels')} className={`flex-1 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1 transition-all ${activeTab === 'reels' ? 'bg-pink-100 text-pink-600' : 'text-gray-400'}`}>
                        <PlayCircle size={14} /> Reels
                    </button>
                    <button onClick={() => setActiveTab('reviews')} className={`flex-1 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1 transition-all ${activeTab === 'reviews' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400'}`}>
                        <Star size={14} /> Reviews
                    </button>
                </div>
            </div>

            {/* 3. Content Area */}
            <div className="px-4 mt-4">
                
                {/* --- PRODUCTS TAB --- */}
                {activeTab === 'products' && (
                    <div className="grid grid-cols-2 gap-4">
                        {products.length === 0 ? (
                            <div className="col-span-2 flex flex-col items-center justify-center py-12 text-gray-400">
                                <ShoppingBag size={48} className="mb-2 opacity-20"/>
                                <p className="text-sm">No products listed yet.</p>
                            </div>
                        ) : (
                            products.map((p: any) => (
                                <div key={p._id} onClick={() => router.push(`/product/${p._id}`)} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all">
                                    <div className="relative h-32 w-full rounded-xl overflow-hidden mb-3 bg-gray-100">
                                        <Image src={p.images?.[0] || "/placeholder.png"} fill alt={p.name} className="object-cover" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm truncate">{p.name}</h3>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-green-600 font-bold text-sm">₹{p.price}</p>
                                        <p className="text-[10px] text-gray-400">{p.unit}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- REELS TAB --- */}
                {activeTab === 'reels' && (
                    <div className="grid grid-cols-3 gap-1">
                        {reels.length === 0 ? (
                            <div className="col-span-3 text-center py-12 text-gray-400 text-sm">No reels uploaded yet.</div>
                        ) : (
                            reels.map((r: any) => (
                                <div key={r._id} onClick={() => router.push(`/reels?id=${r._id}`)} className="relative aspect-[9/16] bg-black cursor-pointer group">
                                    <video src={r.videoUrl} className="w-full h-full object-cover opacity-90" />
                                    <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-[10px] font-bold drop-shadow-md">
                                        <PlayCircle size={10} fill="white" /> {r.views || 0}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- REVIEWS TAB --- */}
                {activeTab === 'reviews' && (
                    <div className="space-y-4">
                        {reviews.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-sm">No reviews yet.</div>
                        ) : (
                            reviews.map((rev: any, index: number) => (
                                <div key={index} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 relative overflow-hidden shrink-0">
                                            <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-700 font-bold text-xs">
                                                {rev.name?.[0] || "U"}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-sm text-gray-800">{rev.name}</h4>
                                                <span className="text-[10px] text-gray-400">{new Date(rev.createdAt || Date.now()).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex text-yellow-400 my-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={12} fill={i < rev.rating ? "currentColor" : "none"} className={i < rev.rating ? "" : "text-gray-300"} />
                                                ))}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{rev.comment}</p>
                                            
                                            <div onClick={() => router.push(`/product/${rev.product}`)} className="mt-3 flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                                <div className="w-8 h-8 relative rounded overflow-hidden">
                                                    <Image src={rev.productImage || "/placeholder.png"} fill alt="prod" className="object-cover"/>
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium truncate">{rev.productName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}