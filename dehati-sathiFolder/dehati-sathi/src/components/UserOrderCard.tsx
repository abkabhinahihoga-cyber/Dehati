'use client'
import { IOrder } from '@/app/models/order.model'
import React, { useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { 
    ChevronDown, ChevronUp, CreditCard, MapPin, Package, 
    Truck, Calendar, HelpCircle, Store, Navigation, ArrowRight, Edit2 
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

function UserOrderCard({ order }: { order: IOrder }) {
    const [expanded, setExpanded] = useState(false)
    const router = useRouter()

    const orderData = order as any;
    // Ensure address is an object
    const address = orderData.address || {};
    
    const safeLower = (str: any) => (str || "").toString().toLowerCase();
    const fullAddr = safeLower(address.fullAddress);
    const fullName = safeLower(address.fullName);
    const dbType = safeLower(orderData.deliveryType);
    const addrType = safeLower(address.pickupType);

    // ------------------------------------------------------------------
    // 1. DELIVERY MODE DETECTION (The "Strict" Fix)
    // ------------------------------------------------------------------
    let mode = 'home-delivery'; 

    // A. Check for Explicit "Pickup" in DB or Address
    // We IGNORE dbType if it is 'home-delivery' because that is the default value
    if (dbType.includes('hub') || addrType.includes('hub')) {
        mode = 'hub-pickup';
    }
    else if (dbType.includes('farm') || dbType.includes('seller') || addrType.includes('farm')) {
        mode = 'farm-pickup';
    }
    // B. Check the Boolean Flag
    // If isPickup is true, it CANNOT be home delivery.
    else if (address.isPickup === true || address.isPickup === "true") {
        if (fullAddr.includes("hub") || fullName.includes("hub") || fullName.includes("dehati")) {
            mode = 'hub-pickup';
        } else {
            // FIX: If it is a pickup but NOT a Hub, it is a Farm Pickup
            mode = 'farm-pickup';
        }
    }
    // C. Keyword Search (Last Resort)
    else {
        if (fullAddr.includes("hub") || fullName.includes("hub")) {
            mode = 'hub-pickup';
        } else if (
            fullName.includes("shop") || 
            fullName.includes("store") || 
            fullName.includes("point") ||
            fullAddr.includes("shop")
        ) {
            mode = 'farm-pickup'; 
        }
    }

    const isPickup = mode.includes('pickup');

    // ------------------------------------------------------------------
    // 2. NAVIGATION URL (The "Map" Fix)
    // ------------------------------------------------------------------
    let lat = null;
    let lng = null;

    // Try Hub Coords first
    if (orderData.connectedHub?.location?.coordinates) {
        lng = orderData.connectedHub.location.coordinates[0];
        lat = orderData.connectedHub.location.coordinates[1];
    }
    // Try Address Coords second
    if (!lat || !lng) {
        lat = address.latitude || address.lat;
        lng = address.longitude || address.lng;
    }

    // FIX: Use STANDARD Google Maps URL
    // Format: https://www.google.com/maps/search/?api=1&query=LAT,LNG
    let googleMapsUrl = "";
    if (lat && lng) {
        googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else {
        // Fallback to text search if no coords
        const query = encodeURIComponent(address.fullAddress || "Pickup Point");
        googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    }

    // ------------------------------------------------------------------
    // 3. UI HELPERS
    // ------------------------------------------------------------------
    const getAddressLabel = () => {
        if (mode === 'hub-pickup') return "Hub Pickup Point";
        if (mode === 'farm-pickup') return "Seller Shop Location";
        return "Delivery Address";
    }

    const getPaymentLabel = () => {
        if (orderData.paymentMethod === 'online') return "Online Payment";
        if (mode === 'hub-pickup') return "Cash at Hub";
        if (mode === 'farm-pickup') return "Pay Cash to Seller";
        return "Cash On Delivery";
    }

    const firstImage = order.items?.[0]?.images?.[0] || "/placeholder.png";
    
    // Only allow address change for true home delivery orders that are pending
    const canChangeAddress = mode === 'home-delivery' && 
                             ['pending', 'processing', 'driver_unavailable'].includes(safeLower(order.status));

    const getStatusColor = (status: string) => {
        switch (safeLower(status)) {
            case "pending": return "bg-yellow-50 text-yellow-700 border-yellow-200"
            case "processing": return "bg-blue-50 text-blue-700 border-blue-200"
            case "out_for_delivery": return "bg-purple-50 text-purple-700 border-purple-200"
            case "delivered": return "bg-green-50 text-green-700 border-green-200"
            case "cancelled": return "bg-red-50 text-red-700 border-red-200"
            case "driver_unavailable": return "bg-orange-50 text-orange-700 border-orange-200"
            default: return "bg-gray-50 text-gray-600 border-gray-200"
        }
    }

    const handleNavigate = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!googleMapsUrl) return;
        window.open(googleMapsUrl, '_blank');
    }

    const handleChangeAddress = (e: React.MouseEvent) => {
        e.stopPropagation();
        toast.info("Address change feature coming soon!");
    }

    return (
        <motion.div 
            className='bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden'
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
        >
            {/* HEADER */}
            <div className='flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 px-5 py-4 bg-gray-50/30'>
                <div className='flex items-center gap-4'>
                    <div className="relative w-14 h-14 rounded-lg border border-gray-200 overflow-hidden shrink-0 bg-white shadow-sm">
                        <Image src={firstImage} alt="Order Preview" fill className="object-cover" />
                        {order.items.length > 1 && (
                            <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-tl-md font-bold">
                                +{order.items.length - 1}
                            </div>
                        )}
                    </div>
                    <div className='flex flex-col gap-1'>
                        <div className='flex items-center gap-2 flex-wrap'>
                            <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wide font-bold border rounded-full ${getStatusColor(order.status)}`}>
                                {order.status?.replace(/_/g, " ")}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wide font-bold border rounded-full flex items-center gap-1 ${isPickup ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                {isPickup ? <Store size={10} /> : <Truck size={10} />}
                                {mode === 'hub-pickup' ? 'Hub Pickup' : mode === 'farm-pickup' ? 'Farm Pickup' : 'Home Delivery'}
                            </span>
                        </div>
                        <div className='flex items-center gap-2 text-xs text-gray-500'>
                            <span className='font-mono text-gray-400'>#{order?._id?.toString()?.slice(-6).toUpperCase()}</span>
                            <span className='flex items-center gap-1'><Calendar size={12} /> {new Date(order.createdAt!).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className='text-right hidden sm:block'>
                    <p className='text-xs text-gray-500'>Total Amount</p>
                    <p className='text-lg font-bold text-gray-800'>₹{order.totalAmount}</p>
                </div>
            </div>

            {/* BODY */}
            <div className='p-5 space-y-5'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                    {/* ADDRESS CARD */}
                    <div className='flex items-start gap-3 p-3.5 bg-gray-50/50 rounded-xl border border-gray-100'>
                        <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${isPickup ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                            {isPickup ? <Store size={14} /> : <MapPin size={14} />}
                        </div>
                        <div className='flex-1 min-w-0'>
                            <div className="flex justify-between items-center mb-0.5">
                                <p className='font-bold text-gray-800 text-xs uppercase tracking-wide'>{getAddressLabel()}</p>
                                
                                {isPickup && (
                                    <button onClick={handleNavigate} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors">
                                        <Navigation size={10} /> Navigate
                                    </button>
                                )}
                                
                                {canChangeAddress && (
                                    <button onClick={handleChangeAddress} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors">
                                        <Edit2 size={10} /> Change
                                    </button>
                                )}
                            </div>
                            <div className='text-gray-600 text-xs leading-relaxed'>
                                {mode === 'farm-pickup' && address.fullName && <p className="font-bold text-gray-800 mb-0.5">{address.fullName}</p>}
                                <p className="line-clamp-2">{address.fullAddress || "Address details unavailable"}</p>
                            </div>
                        </div>
                    </div>

                    {/* PAYMENT CARD */}
                    <div className='flex items-start gap-3 p-3.5 bg-gray-50/50 rounded-xl border border-gray-100'>
                        <div className="mt-0.5 p-1.5 rounded-full shrink-0 bg-gray-200 text-gray-600">
                            {orderData.paymentMethod === "cod" ? <Truck size={14}/> : <CreditCard size={14}/>}
                        </div>
                        <div>
                            <p className='font-bold text-gray-800 text-xs uppercase tracking-wide mb-0.5'>Payment Method</p>
                            <div className='flex items-center gap-2'>
                                <p className='text-gray-700 text-sm font-medium'>{getPaymentLabel()}</p>
                                <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${orderData.isPaid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                    {orderData.isPaid ? "Paid" : "Pending"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* EXPANDABLE ITEMS LIST */}
                <div className='border rounded-xl border-gray-200 overflow-hidden'>
                    <button onClick={() => setExpanded(prev => !prev)} className='w-full flex justify-between items-center px-4 py-2.5 bg-white hover:bg-gray-50 transition text-xs font-semibold text-gray-600 uppercase tracking-wide'>
                        <span className='flex items-center gap-2'><Package size={14} /> {order.items?.length || 0} Items</span>
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <AnimatePresence>
                        {expanded && (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className='border-t border-gray-200 bg-gray-50/30'>
                                <div className='p-2 space-y-2'>
                                    {order.items?.map((item: any, index: number) => (
                                        <div key={index} className='flex gap-3 items-center bg-white p-2 rounded-lg border border-gray-100 cursor-pointer' onClick={() => router.push(`/product/${item.product?._id || item.product}`)}>
                                            <div className='relative w-10 h-10 shrink-0 bg-gray-100 rounded overflow-hidden'>
                                                <Image src={item.images?.[0] || "/placeholder.png"} alt={item.name} fill className='object-cover' />
                                            </div>
                                            <div className='flex-1 min-w-0'>
                                                <p className='text-sm font-medium text-gray-800 truncate'>{item.name}</p>
                                                <p className='text-[10px] text-gray-500'>{item.quantity} x {item.unit}</p>
                                            </div>
                                            <p className='text-xs font-bold text-gray-700'>₹{item.price * item.quantity}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <div className='flex justify-end pt-4 border-t border-gray-100'>
                    <div className='sm:hidden block mr-auto'>
                         <p className='text-[10px] text-gray-400 font-bold uppercase'>Total</p>
                         <p className='text-lg font-bold text-gray-800'>₹{order.totalAmount}</p>
                    </div>
                    <button onClick={() => router.push(`/user/order/${order._id}`)} className='flex items-center gap-2 bg-zinc-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-md shadow-zinc-200 transition-all active:scale-95'>
                        Track Order <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

export default UserOrderCard