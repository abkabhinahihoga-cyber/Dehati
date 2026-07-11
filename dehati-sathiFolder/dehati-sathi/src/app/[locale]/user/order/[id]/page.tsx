'use client'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, MapPin, Phone, Navigation, CreditCard, Loader2, Package, Store, Truck, Info, Clock, CheckCircle2, QrCode } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import Image from 'next/image'
import { useLocale } from 'next-intl'

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";

function OrderDetailsPage() {
    const locale = useLocale();
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

    if (loading) return <div className="h-screen flex items-center justify-center text-gray-500"><Loader2 className="animate-spin mr-2"/> {locale === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}</div>;
    if (!order) return <div className="h-screen flex items-center justify-center text-gray-500">{locale === 'hi' ? 'ऑर्डर नहीं मिला' : 'Order not found'}</div>;

    // --- 👇 MODE RESPONSIVE LOGIC ---
    const deliveryType = order.deliveryType || 'home-delivery'; // 'hub-pickup' | 'farm-pickup' | 'home-delivery'
    const isPickup = deliveryType.includes('pickup');

    // 1. Dynamic Titles & Icons
    const getModeDetails = () => {
        if (deliveryType === 'hub-pickup') return { title: locale === 'hi' ? 'हब पिकअप स्थान' : "Hub Pickup Location", icon: <Store className="text-blue-600" size={18}/>, color: "text-blue-600" };
        if (deliveryType === 'farm-pickup') return { title: locale === 'hi' ? 'खेत (विक्रेता) का स्थान' : "Farm (Seller) Location", icon: <Store className="text-green-700" size={18}/>, color: "text-green-700" };
        return { title: locale === 'hi' ? 'डिलीवरी का पता' : "Delivery Address", icon: <MapPin className="text-green-600" size={18}/>, color: "text-green-600" };
    }

    // 2. Dynamic Payment Text
    const getPaymentText = () => {
        if (order.paymentMethod === 'online') return locale === 'hi' ? 'ऑनलाइन भुगतान किया गया' : "Paid Online";
        if (deliveryType === 'hub-pickup') return locale === 'hi' ? 'हब पर नकद भुगतान' : "Cash Payment at Hub";
        if (deliveryType === 'farm-pickup') return locale === 'hi' ? 'विक्रेता को नकद भुगतान' : "Cash Payment to Seller";
        return locale === 'hi' ? 'कैश ऑन डिलीवरी' : "Cash on Delivery";
    }

    // 3. Dynamic Google Maps Link
    // Uses the saved latitude/longitude from the order
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${order.address?.latitude},${order.address?.longitude}`;

    // 4. Determine OTP to display
    let otpLabel = "";
    let otpValue = "";
    if (deliveryType === 'farm-pickup' && order.status === 'ready') {
        otpLabel = locale === 'hi' ? 'पिकअप सत्यापन कोड' : 'Pickup Verification Code';
        otpValue = order.pickupOtp;
    } else if (deliveryType === 'hub-pickup' && order.status === 'ready_at_hub') {
        otpLabel = locale === 'hi' ? 'हब संग्रह कोड' : 'Hub Collection Code';
        otpValue = order.deliveryOtp;
    } else if (deliveryType === 'home-delivery' && order.status === 'out_for_delivery') {
        otpLabel = locale === 'hi' ? 'डिलीवरी सत्यापन कोड' : 'Delivery Verification Code';
        otpValue = order.deliveryOtp;
    }

    return (
        <div className='min-h-screen bg-gray-50 pb-24'>
            {/* Header */}
            <div className='bg-white shadow-sm p-4 sticky top-0 z-50'>
                <div className='max-w-2xl mx-auto flex items-center gap-3'>
                    <button onClick={() => router.back()} className='p-2 hover:bg-gray-100 rounded-full transition'>
                        <ArrowLeft size={20} className="text-gray-600"/>
                    </button>
                    <div>
                        <h1 className='text-lg font-bold text-gray-900'>{locale === 'hi' ? 'ऑर्डर विवरण' : 'Order Details'}</h1>
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
                            <p className='text-sm text-gray-500 font-medium uppercase tracking-wide'>{locale === 'hi' ? 'वर्तमान स्थिति' : 'Current Status'}</p>
                            <h2 className='text-xl font-bold text-gray-900 capitalize'>{order.status.replace(/_/g, " ")}</h2>
                        </div>
                    </div>
                    {/* Simple Progress Bar */}
                    <div className='w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-4'>
                        <div 
                            className='bg-zinc-900 h-full rounded-full transition-all duration-1000' 
                            style={{width: order.status === 'completed' ? '100%' : order.status === 'out_for_delivery' || order.status === 'picked_up' ? '75%' : '35%'}}
                        ></div>
                    </div>

                    {/* Show OTP if applicable */}
                    {otpValue && (
                        <div className="mt-6 bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-xs text-green-700 font-medium flex items-center gap-1"><QrCode size={14}/> {otpLabel}</p>
                                <p className="text-2xl font-black text-green-800 tracking-widest mt-1">{otpValue}</p>
                            </div>
                            <div className="text-right text-xs text-green-600 max-w-[120px]">
                                {locale === 'hi' ? 'अपना ऑर्डर प्राप्त करते समय यह कोड साझा करें।' : 'Share this code when receiving your order.'}
                            </div>
                        </div>
                    )}
                </div>

                {/* 1.5 TIMELINE */}
                {order.trackingLogs && order.trackingLogs.length > 0 && (
                    <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
                        <h3 className='font-bold text-gray-900 mb-4 flex items-center gap-2'>
                            <Clock size={18} className="text-gray-600"/> {locale === 'hi' ? 'ऑर्डर टाइमलाइन' : 'Order Timeline'}
                        </h3>
                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            {order.trackingLogs.map((log: any, idx: number) => (
                                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 group-[.is-active]:bg-green-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-bold text-slate-800 capitalize text-sm">{log.status.replace(/_/g, " ")}</div>
                                            <time className="text-xs font-medium text-amber-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                                        </div>
                                        <div className="text-slate-500 text-xs">{new Date(log.timestamp).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. ADDRESS / PICKUP LOCATION SECTION */}
                <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
                    <h3 className={`font-bold mb-4 flex items-center gap-2 ${getModeDetails().color}`}>
                        {getModeDetails().icon}
                        {getModeDetails().title}
                    </h3>

                    <div className='space-y-1 mb-6 pl-1'>
                        {/* Name */}
                        <p className='font-semibold text-gray-800 text-lg'>
                            {isPickup ? (order.connectedHub?.name || (locale === 'hi' ? 'पिकअप पॉइंट' : "Pickup Point")) : order.address?.fullName}
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
                                <p>{locale === 'hi' ? 'अपना ऑर्डर लेने के लिए स्थान पर नेविगेट करने के लिए नीचे दिए गए मानचित्र का उपयोग करें।' : 'Use the map below to navigate to the location for picking up your order.'}</p>
                            </div>
                            <a 
                                href={googleMapsUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className='flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95'
                            >
                                <Navigation size={18} /> {locale === 'hi' ? 'Google मानचित्र के माध्यम से नेविगेट करें' : 'Navigate via Google Maps'}
                            </a>
                        </div>
                    )}
                </div>

                {/* 3. PAYMENT INFO */}
                <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
                    <h3 className='font-bold text-gray-900 mb-4 flex items-center gap-2'>
                        <CreditCard size={18} className="text-gray-600"/> {locale === 'hi' ? 'भुगतान जानकारी' : 'Payment Info'}
                    </h3>
                    <div className='flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100'>
                        <span className='text-sm font-medium text-gray-600'>{locale === 'hi' ? 'तरीका' : 'Method'}</span>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${order.paymentMethod === 'online' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {getPaymentText()}
                        </span>
                    </div>
                    <div className='mt-4 flex justify-between items-center px-2'>
                        <span className='font-bold text-gray-800'>{locale === 'hi' ? 'कुल राशि' : 'Total Amount'}</span>
                        <span className='font-bold text-xl text-green-700'>₹{order.totalAmount}</span>
                    </div>
                </div>

                {/* 4. ITEMS LIST */}
                <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
                    <h3 className='font-bold text-gray-900 mb-4'>{locale === 'hi' ? 'ऑर्डर किए गए आइटम' : 'Items Ordered'}</h3>
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