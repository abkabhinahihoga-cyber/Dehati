'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useSocket } from '@/components/SocketProvider';
import GeoUpdater from '@/components/GeoUpdater'; 
import { 
    Bike, MapPin, Phone, CheckCircle, Package, 
    Navigation, ArrowLeft, RefreshCw, CheckSquare, Square, X, Play 
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// 👇 FIXED IMPORT PATH: Points to 'components/seller/'
const DeliveryPathMap = dynamic(() => import('@/components/seller/DeliveryPathMap'), { 
    ssr: false,
    loading: () => (
        <div className="h-80 w-full bg-gray-100 animate-pulse rounded-2xl mb-8 flex items-center justify-center text-gray-400 font-bold">
            Loading Route Map...
        </div>
    )
});

export default function DeliveryDashboard() {
    const [orders, setOrders] = useState<any[]>([])
    const [stats, setStats] = useState({ active: 0, completed: 0, earnings: 0 }) 
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')
    
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isBulkProcessing, setIsBulkProcessing] = useState(false)
    const { socket } = useSocket();

    const fetchData = async () => {
        try {
            const res = await axios.get('/api/delivery/dashboard')
            if (res.data.success) {
                setOrders(res.data.orders)
                if (res.data.stats) setStats(res.data.stats)
            }
        } catch (error) { console.error(error) } 
        finally { setLoading(false) }
    }

    useEffect(() => {
        if (!socket) return;
        const handleNewOrder = (data: any) => {
            toast.info(`🔔 ${data.message}`); 
            fetchData(); 
        };
        socket.on("new-order-available", handleNewOrder);
        return () => { socket.off("new-order-available", handleNewOrder); }
    }, [socket]); 

    useEffect(() => { fetchData() }, [])

    // --- FILTERS ---
    const pendingRequests = orders.filter(o => 
        o.status !== 'delivered' && 
        !o.assignedDeliveryBoy && 
        (o.deliveryBoyStatus === 'pending' || o.isOpenForDelivery === true) 
    );
    
    const activeTasks = orders.filter(o => 
        o.status !== 'delivered' && 
        o.status !== 'cancelled' &&
        (o.deliveryBoyStatus === 'accepted' || (o.assignedDeliveryBoy && o.status === 'out_for_delivery'))
    );

    // Filter for "Start Run" logic
    const readyToStartTasks = activeTasks.filter(o => o.status === 'processing');
    const inProgressTasks = activeTasks.filter(o => o.status === 'out_for_delivery');
    
    const historyTasks = orders.filter(o => o.status === 'delivered');
    const displayOrders = activeTab === 'active' ? activeTasks : historyTasks;

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === pendingRequests.length) setSelectedIds([]) 
        else setSelectedIds(pendingRequests.map(o => o._id)) 
    }

    const handleAction = async (orderId: string, action: 'accept' | 'reject' | 'delivered') => {
        if(action === 'delivered' && !confirm("Confirm delivery?")) return;
        
        const toastId = toast.loading("Processing...")
        try {
            const res = await axios.put('/api/delivery/dashboard', { orderId, action })
            if (res.data.success) {
                toast.success(res.data.message, { id: toastId })
                setSelectedIds(prev => prev.filter(id => id !== orderId))
                fetchData() 
            }
        } catch (error) { toast.error("Action failed", { id: toastId }) }
    }

    const handleBulkAction = async (action: 'accept' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action.toUpperCase()} ${selectedIds.length} orders?`)) return;
        setIsBulkProcessing(true)
        const toastId = toast.loading(`Bulk ${action}ing...`)
        try {
            await Promise.all(selectedIds.map(id => axios.put('/api/delivery/dashboard', { orderId: id, action })));
            toast.success(`Done!`, { id: toastId })
            setSelectedIds([]) 
            fetchData() 
        } catch (error) { toast.error("Some orders failed.", { id: toastId }) } 
        finally { setIsBulkProcessing(false) }
    }

    // 👇 START DELIVERY RUN
    const handleStartDeliveryRun = async () => {
        if (readyToStartTasks.length === 0) return;
        if (!confirm(`Mark ${readyToStartTasks.length} orders as Out for Delivery?`)) return;

        const toastId = toast.loading("Starting delivery run...");
        try {
            await Promise.all(readyToStartTasks.map(order => 
                axios.put('/api/delivery/dashboard', { orderId: order._id, action: 'out_for_delivery' })
            ));
            toast.success("Delivery Started!", { id: toastId });
            fetchData();
        } catch (error) {
            toast.error("Failed to start run.", { id: toastId });
        }
    }

    if (loading) return <div className="h-screen flex items-center justify-center text-indigo-600 font-bold">Loading...</div>
    
    return (
        <div className="min-h-screen bg-gray-50 pb-32"> 
            {/* FORCE LIVE GPS TRACKING */}
            <GeoUpdater type="delivery" />

            {/* HEADER */}
            <div className="bg-indigo-600 p-6 pt-8 rounded-b-[2rem] shadow-xl text-white relative mb-6">
                <Link href="/" className="absolute top-6 left-6 p-2 bg-white/20 rounded-full hover:bg-white/30 backdrop-blur-md"><ArrowLeft size={24}/></Link>
                <button onClick={fetchData} className="absolute top-6 right-6 p-2 bg-white/20 rounded-full hover:bg-white/30 backdrop-blur-md"><RefreshCw size={24}/></button>

                <div className="flex flex-col items-center justify-center mb-6 mt-4">
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-md mb-3 shadow-inner"><Bike size={32}/></div>
                    <h1 className="text-2xl font-black">Delivery Partner</h1>
                </div>
                
                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                    <div className="bg-indigo-800/50 p-3 rounded-2xl text-center"><div className="text-xl font-black">{stats?.active || 0}</div><div className="text-[10px] uppercase opacity-70">Active</div></div>
                    <div className="bg-indigo-800/50 p-3 rounded-2xl text-center"><div className="text-xl font-black">{stats?.completed || 0}</div><div className="text-[10px] uppercase opacity-70">Done</div></div>
                    <div className="bg-white text-indigo-700 p-3 rounded-2xl text-center shadow-lg"><div className="text-xl font-black flex justify-center items-center">₹{stats?.earnings || 0}</div><div className="text-[10px] uppercase font-bold">Earned</div></div>
                </div>
            </div>

            <div className="px-6 space-y-6 max-w-lg mx-auto">
                
                {/* START RUN BUTTON */}
                {readyToStartTasks.length > 0 && activeTab === 'active' && (
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-2xl shadow-lg text-white flex items-center justify-between mb-6 animate-in slide-in-from-top-4">
                        <div>
                            <h3 className="font-bold text-lg">Ready to go?</h3>
                            <p className="text-xs text-orange-100">{readyToStartTasks.length} orders waiting for pickup</p>
                        </div>
                        <button 
                            onClick={handleStartDeliveryRun}
                            className="bg-white text-orange-600 px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition flex items-center gap-2"
                        >
                            <Play size={16} fill="currentColor"/> Start Run
                        </button>
                    </div>
                )}

                {/* DELIVERY MAP (Only shows when In Progress) */}
                {inProgressTasks.length > 0 && activeTab === 'active' && (
                    <div className="mb-8 h-80 w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative z-0">
                        <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold shadow-sm border border-gray-100 text-gray-700 flex items-center gap-2">
                            <Navigation size={12} className="text-blue-500" />
                            Route ({inProgressTasks.length} Stops)
                        </div>
                        {/* Passes the list of orders to optimize route */}
                        <DeliveryPathMap orders={inProgressTasks} />
                    </div>
                )}

                {/* PENDING REQUESTS */}
                {pendingRequests.length > 0 && activeTab === 'active' && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-lg font-bold text-black ml-1 flex items-center gap-2">
                                Assignments <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                            </h2>
                            <button onClick={toggleSelectAll} className="text-xs font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg">
                                {selectedIds.length === pendingRequests.length && pendingRequests.length > 0 ? <CheckSquare size={14}/> : <Square size={14}/>}
                                {selectedIds.length === pendingRequests.length ? "Deselect All" : "Select All"}
                            </button>
                        </div>
                        <div className="space-y-3">
                            {pendingRequests.map(order => {
                                const isSelected = selectedIds.includes(order._id);
                                return (
                                    <div key={order._id} className={`bg-white border rounded-xl p-3 shadow-sm relative transition-all ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/30' : 'border-gray-200'}`} onClick={() => toggleSelect(order._id)}>
                                        <div className="absolute top-3 left-3 z-10">
                                            {isSelected ? <div className="bg-indigo-600 text-white rounded-md p-0.5"><CheckSquare size={18} fill="currentColor" className="text-white"/></div> : <div className="text-gray-300"><Square size={20}/></div>}
                                        </div>
                                        <div className="ml-8"> 
                                            <div className="mb-3">
                                                <h3 className="font-bold text-gray-900 text-sm">#{order._id.substring(order._id.length-6)}</h3>
                                                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{order.address?.fullAddress}</p>
                                            </div>
                                            <div className="flex gap-3" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => handleAction(order._id, 'accept')} className="flex-1 py-1.5 bg-[#00b050] hover:bg-[#009040] text-white rounded-md font-bold text-xs shadow-sm">Accept</button>
                                                <button onClick={() => handleAction(order._id, 'reject')} className="flex-1 py-1.5 bg-[#e3000f] hover:bg-[#c00000] text-white rounded-md font-bold text-xs shadow-sm">Reject</button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ACTIVE TAB LIST */}
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex mt-2">
                    <button onClick={() => setActiveTab('active')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'active' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400'}`}>My Tasks</button>
                    <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400'}`}>History</button>
                </div>

                {displayOrders.length === 0 && activeTab === 'active' && inProgressTasks.length === 0 && readyToStartTasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Package size={48} className="mx-auto mb-3 opacity-20"/>
                        <p>No active tasks.</p>
                    </div>
                ) : (
                    displayOrders.map((order) => (
                        <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                             <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${order.status === 'out_for_delivery' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {order.status.replace(/_/g, ' ')}
                                        </span>
                                        <h3 className="text-lg font-black text-gray-800 mt-1">#{order._id.substring(order._id.length - 6)}</h3>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Collect</span>
                                        <h3 className="text-xl font-black text-indigo-600">
                                            {order.paymentMethod === 'cod' && !order.isPaid ? `₹${order.totalAmount}` : <span className="text-green-600 text-sm">PAID</span>}
                                        </h3>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 mb-4 bg-gray-50 p-3 rounded-xl">
                                    <MapPin size={18} className="text-indigo-600 shrink-0 mt-0.5"/>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{order.user?.name}</p>
                                        <p className="text-xs text-gray-500 leading-relaxed">{order.address?.fullAddress}</p>
                                    </div>
                                </div>

                                {activeTab === 'active' ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <a href={`tel:${order.user?.mobile}`} className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200"><Phone size={14}/> Call</a>
                                            <a href={`http://googleusercontent.com/maps.google.com/maps?daddr=${order.address?.lat || order.address?.latitude},${order.address?.lng || order.address?.longitude}`} target="_blank" className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200"><Navigation size={14}/> Map</a>
                                        </div>
                                        {order.status === 'out_for_delivery' && (
                                            <button onClick={() => handleAction(order._id, 'delivered')} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700"><CheckCircle size={18}/> Mark Delivered</button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-2 pt-3 border-t flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-400">Delivered Successfully</span>
                                        <CheckCircle size={16} className="text-green-500"/>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Bulk Actions UI */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-6 right-6 max-w-lg mx-auto bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between z-50 animate-in slide-in-from-bottom-5">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedIds([])} className="p-1 hover:bg-gray-700 rounded-full"><X size={16}/></button>
                        <span className="font-bold text-sm">{selectedIds.length} Selected</span>
                    </div>
                    <div className="flex gap-3">
                         <button disabled={isBulkProcessing} onClick={() => handleBulkAction('reject')} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-xl disabled:opacity-50">Reject All</button>
                        <button disabled={isBulkProcessing} onClick={() => handleBulkAction('accept')} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded-xl disabled:opacity-50">Accept ({selectedIds.length})</button>
                    </div>
                </div>
            )}
        </div>
    )
}