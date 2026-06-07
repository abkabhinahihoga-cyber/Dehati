'use client'
import axios from 'axios'
import { ArrowLeft, CheckCircle, Clock, MapPin, Package, Phone, Truck } from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSocket } from '@/components/SocketProvider' // Ensure you have this context provider
import { toast } from 'sonner'

// Dynamic Import for Map
const LiveMap = dynamic(() => import('@/components/LiveMap'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">Loading Live Map...</div>
})

export default function TrackOrderPage() {
    const { orderId } = useParams()
    const router = useRouter()
    const { socket } = useSocket()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchOrder = async () => {
        try {
            const res = await axios.get(`/api/user/order/${orderId}`)
            setOrder(res.data)
        } catch (error) {
            console.error("Failed to fetch order")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (orderId) fetchOrder()
    }, [orderId])

    // 👇 REAL-TIME STATUS UPDATES
    useEffect(() => {
        if (!socket || !orderId) return;

        const handleStatusUpdate = (data: any) => {
            if (data.orderId === orderId) {
                toast.info(`Order Status Updated: ${data.status.replace(/_/g, ' ')}`)
                fetchOrder() // Refresh data to get new status & driver info
            }
        }

        // Listen for specific room or global event based on your backend setup
        socket.on(`order-update-${orderId}`, handleStatusUpdate);
        
        return () => {
            socket.off(`order-update-${orderId}`, handleStatusUpdate);
        }
    }, [socket, orderId])

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-gray-500">Loading Tracking Info...</div>
    if (!order) return <div className="h-screen flex items-center justify-center text-red-500">Order not found</div>

    // --- TIMELINE LOGIC ---
    const steps = [
        { key: 'pending', label: 'Order Placed', icon: Package, date: order.createdAt },
        { key: 'processing', label: 'Processing', icon: Clock, date: order.updatedAt },
        { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, date: order.updatedAt },
        { key: 'delivered', label: 'Delivered', icon: CheckCircle, date: order.updatedAt }
    ]

    let currentStepIndex = 0;
    if (order.status === 'processing') currentStepIndex = 1;
    else if (order.status === 'out_for_delivery') currentStepIndex = 2;
    else if (order.status === 'delivered') currentStepIndex = 3;
    else if (order.status === 'cancelled') currentStepIndex = -1;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white sticky top-0 z-10 border-b border-gray-200 px-4 py-4 flex items-center gap-4 shadow-sm">
                <button onClick={() => router.back()} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                    <ArrowLeft size={20} className="text-gray-700"/>
                </button>
                <div>
                    <h1 className="text-lg font-bold text-gray-800">Track Order</h1>
                    <p className="text-xs text-gray-500">ID: #{order._id.toString().slice(-6).toUpperCase()}</p>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-6 space-y-6">
                
                {/* Product Info */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                     <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                        <Image src={order.items[0]?.images[0] || "/placeholder.png"} alt="Item" fill className="object-cover" />
                     </div>
                     <div className="flex-1">
                        <h3 className="font-bold text-gray-800 line-clamp-1">{order.items[0]?.name}</h3>
                        <p className="text-lg font-black text-green-700 mt-1">₹{order.totalAmount}</p>
                        <p className="text-xs text-gray-400 mt-1">{order.items.reduce((acc:any, i:any) => acc + i.quantity, 0)} Items • {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}</p>
                     </div>
                </div>

                {/* Status Timeline */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6">Order Status</h3>
                    <div className="relative pl-2">
                        <div className="absolute top-2 left-[19px] bottom-10 w-0.5 bg-gray-200"></div>
                        {steps.map((step, index) => {
                            const isCompleted = index <= currentStepIndex;
                            const Icon = step.icon;
                            return (
                                <div key={step.key} className="relative flex gap-4 mb-8 last:mb-0">
                                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300 text-gray-300'}`}>
                                        <Icon size={18} />
                                    </div>
                                    <div className={`flex-1 pt-1 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                                        <h4 className={`font-bold text-sm ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</h4>
                                        {isCompleted && (
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {new Date(step.date).toLocaleDateString()}
                                            </p>
                                        )}
                                        
                                        {/* Driver Info Card - Shows when Out For Delivery */}
                                        {step.key === 'out_for_delivery' && isCompleted && order.assignedDeliveryBoy && (
                                            <div className="mt-3 bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                                                <div className="w-10 h-10 rounded-full bg-indigo-200 overflow-hidden relative border-2 border-white shadow-sm">
                                                    <Image src={order.assignedDeliveryBoy.image || "/placeholder.png"} alt="Driver" fill className="object-cover"/>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-indigo-900">{order.assignedDeliveryBoy.name}</p>
                                                    <p className="text-[10px] text-indigo-600">Your Delivery Partner</p>
                                                </div>
                                                <a href={`tel:${order.assignedDeliveryBoy.mobile}`} className="bg-white p-2 rounded-full text-indigo-600 shadow-sm hover:bg-indigo-600 hover:text-white transition-colors"><Phone size={16}/></a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 👇 LIVE MAP SECTION */}
                {/* Shows only when Out For Delivery AND Driver is assigned */}
                {order.status === 'out_for_delivery' && order.assignedDeliveryBoy && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                Live Tracking
                            </h3>
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">ON THE WAY</span>
                        </div>
                        
                        <div className="flex-1 w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50 relative z-0">
                            <LiveMap 
                                driverId={order.assignedDeliveryBoy._id} 
                                initialLat={order.assignedDeliveryBoy.location?.coordinates?.[1]} 
                                initialLng={order.assignedDeliveryBoy.location?.coordinates?.[0]} 
                                destinationLat={order.address?.lat || order.address?.latitude}
                                destinationLng={order.address?.lng || order.address?.longitude}
                            />
                        </div>
                    </div>
                )}

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Delivery Address</h3>
                    <div className="flex gap-3">
                        <div className="mt-1"><MapPin size={20} className="text-gray-400"/></div>
                        <div>
                            <p className="font-bold text-sm text-gray-800">{order.address.fullName}</p>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{order.address.fullAddress}, {order.address.pincode}</p>
                            <p className="text-xs text-gray-400 mt-1">Mobile: {order.address.mobile}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}