'use client'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, MapPin, Phone, Navigation, CreditCard, Loader2, Package, Store, Truck, Info } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import Image from 'next/image'

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";

function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // Reuse existing API and find the specific order
                const res = await axios.get(`/api/user/my-orders`); 
                if (res.data) {
                    // @ts-ignore
                    const found = res.data.find((o: any) => o._id === params.id);
                    setOrder(found);
                }
            } catch (error) {
                console.error("Error fetching order");
            } finally {
                setLoading(false);
            }
        };
        if(params.id) fetchOrder();
    }, [params.id]);

    if (loading) return <div className="h-screen flex items-center justify-center text-gray-500"><Loader2 className="animate-spin mr-2"/> Loading...</div>;
    if (!order) return <div className="h-screen flex items-center justify-center text-gray-500">Order not found</div>;

    // --- 👇 MODE RESPONSIVE LOGIC ---
    const deliveryType = order.deliveryType || 'home-delivery'; // 'hub-pickup' | 'farm-pickup' | 'home-delivery'
    const isPickup = deliveryType.includes('pickup');

    // 1. Dynamic Titles & Icons
    const getModeDetails = () => {
        if (deliveryType === 'hub-pickup') return { title: "Hub Pickup Location", icon: <Store className="text-blue-600" size={18}/>, color: "text-blue-600" };
        if (deliveryType === 'farm-pickup') return { title: "Farm (Seller) Location", icon: <Store className="text-green-700" size={18}/>, color: "text-green-700" };
        return { title: "Delivery Address", icon: <MapPin className="text-green-600" size={18}/>, color: "text-green-600" };
    }

    // 2. Dynamic Payment Text
    const getPaymentText = () => {
        if (order.paymentMethod === 'online') return "Paid Online";
        if (deliveryType === 'hub-pickup') return "Cash Payment at Hub";
        if (deliveryType === 'farm-pickup') return "Cash Payment to Seller";
        return "Cash on Delivery";
    }

    // 3. Dynamic Google Maps Link
    // Uses the saved latitude/longitude from the order
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${order.address?.latitude},${order.address?.longitude}`;

    return (
        <div className='min-h-screen bg-gray-50 pb-24'>
            {/* Header */}
            <div className='bg-white shadow-sm p-4 sticky top-0 z-50'>
                <div className='max-w-2xl mx-auto flex items-center gap-3'>
                    <button onClick={() => router.back()} className='p-2 hover:bg-gray-100 rounded-full transition'>
                        <ArrowLeft size={20} className="text-gray-600"/>
                    </button>
                    <div>
                        <h1 className='text-lg font-bold text-gray-900'>Order Details</h1>
                        <p className='text-xs text-gray-500'>#{order._id.slice(-8).toUpperCase()}</p>
                    </div>
                </div>
            </div>

            <div className='max-w-2xl mx-auto p-4 space-y-6'>
                
                {/* 1. STATUS CARD */}
                <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
                    <div className='flex items-center gap-4 mb-6'>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${order.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                            <Package size={24}/>
                        </div>
                        <div>
                            <p className='text-sm text-gray-500 font-medium uppercase tracking-wide'>Current Status</p>
                            <h2 className='text-xl font-bold text-gray-900 capitalize'>{order.status.replace(/_/g, " ")}</h2>
                        </div>
                    </div>
                    {/* Simple Progress Bar */}
                    <div className='w-full bg-gray-100 h-2 rounded-full overflow-hidden'>
                        <div 
                            className='bg-zinc-900 h-full rounded-full transition-all duration-1000' 
                            style={{width: order.status === 'delivered' ? '100%' : order.status === 'out_for_delivery' ? '75%' : '35%'}}
                        ></div>
                    </div>
                </div>

                {/* 2. ADDRESS / PICKUP LOCATION SECTION */}
                <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
                    <h3 className={`font-bold mb-4 flex items-center gap-2 ${getModeDetails().color}`}>
                        {getModeDetails().icon}
                        {getModeDetails().title}
                    </h3>

                    <div className='space-y-1 mb-6 pl-1'>
                        {/* Name */}
                        <p className='font-semibold text-gray-800 text-lg'>
                            {isPickup ? (order.connectedHub?.name || "Pickup Point") : order.address?.fullName}
                        </p>
                        
                        {/* Address Text */}
                        <p className='text-sm text-gray-600 leading-relaxed'>
                            {order.address?.fullAddress}
                        </p>
                        
                        {/* Phone */}
                        <p className='text-sm text-gray-500 pt-2 flex items-center gap-2'>
                            <Phone size={14}/> {order.address?.mobile}
                        </p>
                    </div>

                    {/* 👇 NAVIGATION BUTTON (Only shows for Pickups) */}
                    {isPickup && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex gap-2 items-start text-blue-800 text-xs mb-3">
                                <Info size={16} className="shrink-0 mt-0.5"/>
                                <p>Use the map below to navigate to the location for picking up your order.</p>
                            </div>
                            <a 
                                href={googleMapsUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className='flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95'
                            >
                                <Navigation size={18} /> Navigate via Google Maps
                            </a>
                        </div>
                    )}
                </div>

                {/* 3. PAYMENT INFO */}
                <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
                    <h3 className='font-bold text-gray-900 mb-4 flex items-center gap-2'>
                        <CreditCard size={18} className="text-gray-600"/> Payment Info
                    </h3>
                    <div className='flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100'>
                        <span className='text-sm font-medium text-gray-600'>Method</span>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${order.paymentMethod === 'online' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {getPaymentText()}
                        </span>
                    </div>
                    <div className='mt-4 flex justify-between items-center px-2'>
                        <span className='font-bold text-gray-800'>Total Amount</span>
                        <span className='font-bold text-xl text-green-700'>₹{order.totalAmount}</span>
                    </div>
                </div>

                {/* 4. ITEMS LIST */}
                <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
                    <h3 className='font-bold text-gray-900 mb-4'>Items Ordered</h3>
                    <div className='space-y-4'>
                        {order.items.map((item: any, i: number) => (
                            <div key={i} className='flex items-center gap-4 border-b border-gray-50 last:border-0 pb-4 last:pb-0'>
                                <div className='w-14 h-14 bg-gray-100 rounded-lg relative overflow-hidden shrink-0 border border-gray-200'>
                                    <Image src={item.images?.[0] || "/placeholder.png"} fill alt={item.name} className='object-cover'/>
                                </div>
                                <div className='flex-1'>
                                    <p className='font-bold text-gray-800 text-sm'>{item.name}</p>
                                    <p className='text-xs text-gray-500'>{item.quantity} {item.unit} x ₹{item.price}</p>
                                </div>
                                <p className='font-bold text-gray-900 text-sm'>₹{item.price * item.quantity}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default OrderDetailsPage