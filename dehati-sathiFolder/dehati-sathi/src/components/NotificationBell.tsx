'use client'
import React, { useState, useEffect } from 'react'
import { Bell, Check, X } from 'lucide-react'
import axios from 'axios'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function NotificationBell() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Poll for notifications every 30 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/user/notifications');
            if (res.data.success) {
                setNotifications(res.data.notifications);
                setUnreadCount(res.data.unreadCount);
            }
        } catch (e) {}
    };

    const handleOpen = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            try {
                await axios.put('/api/user/notifications'); // Mark read in backend
                setUnreadCount(0); // Clear locally immediately
            } catch (e) {}
        }
    };

    return (
        <div className="relative">
            <button onClick={handleOpen} className="relative p-2.5 hover:bg-gray-100 rounded-full transition shrink-0">
                <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-green-600 fill-green-100' : 'text-gray-600'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white font-bold">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-14 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-gray-800">Notifications</h3>
                                <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-10 text-center text-gray-400 text-sm">No new notifications.</div>
                                ) : (
                                    notifications.map((n) => (
                                        <div 
                                            key={n._id} 
                                            onClick={() => {
                                                if(n.type === 'order') router.push('/user/my-orders');
                                                else if(n.sender?._id) router.push(`/shop/${n.sender._id}`);
                                            }}
                                            className={`p-3 flex items-start gap-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-green-50/40' : ''}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-200 relative overflow-hidden shrink-0 border border-gray-100">
                                                {n.sender?.image ? (
                                                    <Image src={n.sender.image} fill alt="user" className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-600 font-bold">
                                                        <Bell size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-800 leading-snug">
                                                    <span className="font-bold">{n.sender?.name || "System"}</span> {n.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            {!n.read && <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}