'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Package, X, Eye, Truck, Store, Users, MapPin, Phone, Zap, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale } from 'next-intl'

export default function HubOrdersPage() {
    const locale = useLocale();
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'seller' | 'hub'>('seller')
    
    // Modal State
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const fetchOrders = () => {
        axios.get('/api/hub/orders')
            .then(res => {
                if(res.data.success) {
                    setOrders(res.data.orders);
                }
            })
            .catch(() => toast.error(locale === 'hi' ? 'ऑर्डर लोड करने में विफल' : "Failed to load orders"))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchOrders() }, [])

    // Filter displayed orders
    const displayedOrders = orders.filter(o => o.orderType === activeTab);

    // --- ACTIONS ---
    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            const res = await axios.put('/api/hub/orders', { orderId, status: newStatus });
            if (res.data.success) {
                toast.success(locale === 'hi' ? `स्थिति को ${newStatus} में अपडेट किया गया` : `Status updated to ${newStatus}`);
                updateLocalOrder(res.data.order);
            }
        } catch (error: any) { toast.error(error.response?.data?.message || (locale === 'hi' ? 'विफल' : "Failed")); }
    }

    const updateLocalOrder = (updated: any) => {
        setOrders(prev => prev.map(o => o._id === updated._id ? { ...updated, orderType: o.orderType } : o));
        if (selectedOrder && selectedOrder._id === updated._id) setSelectedOrder(updated);
    }

    const openDetails = (order: any) => {
        setSelectedOrder(order)
        setIsDetailsOpen(true)
    }

    if (loading) return <div className="p-8 text-indigo-600 font-bold">{locale === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}</div>

    return (
        <div className="max-w-7xl mx-auto relative p-4">
            <header className="mb-6">
                <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                    <Package className="text-indigo-600"/> {locale === 'hi' ? 'ऑर्डर प्रबंधित करें' : 'Manage Orders'}
                </h1>
            </header>

            {/* TABS */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button onClick={() => setActiveTab('seller')} className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'seller' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <Users size={18}/> {locale === 'hi' ? 'विक्रेता नेटवर्क ऑर्डर' : 'Seller Network Orders'}
                </button>
                <button onClick={() => setActiveTab('hub')} className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'hub' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <Store size={18}/> {locale === 'hi' ? 'मेरा हब इन्वेंटरी ऑर्डर' : 'My Hub Inventory Orders'}
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                        <tr>
                            <th className="p-4">{locale === 'hi' ? 'ऑर्डर आईडी' : 'Order ID'}</th>
                            <th className="p-4">{locale === 'hi' ? 'ग्राहक' : 'Customer'}</th>
                            <th className="p-4">{locale === 'hi' ? 'स्थिति' : 'Status'}</th>
                            <th className="p-4">{locale === 'hi' ? 'डिलीवरी की स्थिति' : 'Delivery Status'}</th>
                            <th className="p-4 text-right">{locale === 'hi' ? 'कार्रवाई' : 'Action'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {displayedOrders.map((order) => (
                            <tr 
                                key={order._id} 
                                onClick={() => openDetails(order)} 
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <td className="p-4 font-mono text-xs font-bold text-indigo-600">#{order._id.substring(order._id.length - 6)}</td>
                                <td className="p-4">
                                    <div className="font-bold">{order.user?.name}</div>
                                    <div className="text-xs text-gray-400">{order.user?.mobile}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {order.assignedDeliveryBoy ? (
                                        <div className="flex items-center gap-2 text-green-700 bg-green-50 px-2 py-1 rounded w-fit text-xs font-bold border border-green-100">
                                            <Truck size={12}/> {order.assignedDeliveryBoy.name}
                                        </div>
                                    ) : order.isOpenForDelivery ? (
                                        <div className="flex items-center gap-1 text-purple-600 font-bold text-xs bg-purple-50 px-2 py-1 rounded w-fit border border-purple-100 animate-pulse">
                                            <Zap size={12} fill="currentColor"/> {locale === 'hi' ? 'सभी के लिए खुला' : 'Open for All'}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">{locale === 'hi' ? 'रिलीज़ लंबित...' : 'Pending Release...'}</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <button className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-600 hover:text-white text-gray-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ml-auto">
                                        <Eye size={14}/> {locale === 'hi' ? 'देखें' : 'View'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {displayedOrders.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">{locale === 'hi' ? 'इस श्रेणी में कोई ऑर्डर नहीं है।' : 'No orders in this category.'}</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {isDetailsOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsDetailsOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">{locale === 'hi' ? 'ऑर्डर विवरण' : 'Order Details'} #{selectedOrder._id.substring(selectedOrder._id.length - 6)}</h2>
                            <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Management Actions */}
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                
                                {/* 1. STATUS */}
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1.5">{locale === 'hi' ? 'ऑर्डर की स्थिति' : 'Order Status'}</label>
                                    <select 
                                        value={selectedOrder.status} 
                                        disabled={activeTab === 'seller' || selectedOrder.status === 'delivered'}
                                        onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        <option value="pending">{locale === 'hi' ? 'लंबित' : 'Pending'}</option>
                                        <option value="processing">{locale === 'hi' ? 'प्रक्रिया में है' : 'Processing'}</option>
                                        <option value="out_for_delivery" disabled>{locale === 'hi' ? 'डिलीवरी के लिए बाहर' : 'Out for Delivery'}</option>
                                        <option value="delivered" disabled>{locale === 'hi' ? 'वितरित' : 'Delivered'}</option>
                                    </select>
                                    {activeTab === 'seller' && <p className="text-[10px] text-orange-500 mt-1">{locale === 'hi' ? 'स्थिति विक्रेता/ड्राइवर द्वारा प्रबंधित' : 'Status managed by Seller/Driver'}</p>}
                                </div>

                                {/* 2. DELIVERY INFO (READ ONLY) */}
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1.5">{locale === 'hi' ? 'डिलीवरी पार्टनर' : 'Delivery Partner'}</label>
                                    <div className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm font-medium flex items-center justify-between">
                                        {selectedOrder.assignedDeliveryBoy ? (
                                            <span className="flex items-center gap-2 text-green-700"><CheckCircle size={16}/> {selectedOrder.assignedDeliveryBoy.name}</span>
                                        ) : selectedOrder.isOpenForDelivery ? (
                                            <span className="flex items-center gap-2 text-purple-600"><Zap size={16} fill="currentColor"/> {locale === 'hi' ? 'सभी को जारी किया गया' : 'Released to All'}</span>
                                        ) : (
                                            <span className="text-gray-400">{locale === 'hi' ? 'अभी तक आवंटित नहीं' : 'Not assigned yet'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Info Sections */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 border rounded-lg">
                                    <p className="font-bold text-gray-500 text-xs uppercase mb-1">{locale === 'hi' ? 'ग्राहक' : 'Customer'}</p>
                                    <p className="font-bold">{selectedOrder.user?.name}</p>
                                    <p className="text-gray-500 flex items-center gap-1"><Phone size={12}/> {selectedOrder.user?.mobile}</p>
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <p className="font-bold text-gray-500 text-xs uppercase mb-1">{locale === 'hi' ? 'पता' : 'Address'}</p>
                                    <p className="line-clamp-2">{selectedOrder.address?.fullAddress}</p>
                                    <p className="text-gray-500 text-xs">{selectedOrder.address?.village}, {selectedOrder.address?.district}</p>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h3 className="font-bold text-gray-800 mb-2">{locale === 'hi' ? 'आइटम' : 'Items'}</h3>
                                <div className="border rounded-xl overflow-hidden">
                                    {selectedOrder.items.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between p-3 border-b last:border-0 text-sm">
                                            <span>{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                                            <span className="font-bold">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                    <div className="bg-gray-50 p-3 flex justify-between font-black text-indigo-700">
                                        <span>{locale === 'hi' ? 'कुल' : 'Total'}</span>
                                        <span>₹{selectedOrder.totalAmount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}