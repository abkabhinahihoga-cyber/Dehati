'use client'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, Store, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import axios from 'axios'

export default function ConnectionsPage() {
    const router = useRouter();
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const res = await axios.get('/api/user/connections');
                if (res.data.success) setConnections(res.data.connections);
            } catch (error) {
                console.error("Failed to load connections");
            } finally {
                setLoading(false);
            }
        };
        fetchConnections();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white p-4 flex items-center gap-4 border-b sticky top-0 z-10 shadow-sm">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
                <h1 className="text-lg font-bold text-gray-800">Your Connections</h1>
            </div>

            <div className="p-4 grid grid-cols-1 gap-3">
                {loading ? (
                    <div className="text-center py-20 text-gray-400 text-sm animate-pulse">Loading shops...</div>
                ) : connections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Store size={48} className="mb-3 opacity-20" />
                        <p className="text-sm">You haven't followed any shops yet.</p>
                        <button onClick={() => router.push('/reels')} className="mt-4 text-green-600 font-bold text-xs bg-green-50 px-4 py-2 rounded-full">Explore Reels</button>
                    </div>
                ) : (
                    connections.map((shop) => (
                        <div 
                            key={shop._id} 
                            onClick={() => router.push(`/shop/${shop._id}`)}
                            className="bg-white p-3 rounded-2xl flex items-center gap-3 border border-gray-100 shadow-sm active:scale-95 transition-transform cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-full border-2 border-green-100 p-0.5 relative shrink-0">
                                <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-100">
                                    <Image src={shop.image || "/avatar.png"} fill alt="shop" className="object-cover" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 text-sm truncate">{shop.sellerDetails?.shopName || shop.name}</h3>
                                <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                                    <MapPin size={10} />
                                    <span className="truncate">{shop.location?.address || "Local Seller"}</span>
                                </div>
                            </div>
                            <button className="text-[10px] font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">Visit</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}