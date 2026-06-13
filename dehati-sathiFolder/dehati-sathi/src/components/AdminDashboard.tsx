'use client'
import React, { useEffect, useState } from 'react'
import { 
    Users, ShoppingBag, TrendingUp, LogOut, 
    CheckCircle, XCircle, Shield, Ban, MapPin, Plus, 
    Menu, X, ChevronLeft, Store, Truck, User, Search, 
    Package, Map, Phone, Bike, FileText,
    Layers, Trash, Image as ImageIcon, 
    ArrowUp, ArrowDown, ExternalLink, Loader2 
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'

export default function AdminDashboard() {
    // --- STATE ---
    const [stats, setStats] = useState<any>({ totalUsers: 0, totalOrders: 0, totalRevenue: 0, pendingApprovals: 0, totalHubs: 0 })
    const [users, setUsers] = useState<any[]>([])
    const [orders, setOrders] = useState<any[]>([])
    const [hubs, setHubs] = useState<any[]>([])
    const [deliveryRequests, setDeliveryRequests] = useState<any[]>([])
    
    // 👇 CMS State (Hero Slides)
    const [heroSlides, setHeroSlides] = useState<any[]>([])
    const [cmsMode, setCmsMode] = useState<'grocery' | 'student'>('grocery')
    const [showSlideForm, setShowSlideForm] = useState(false)
    const [reorderLoading, setReorderLoading] = useState<string | null>(null)
    const [slideForm, setSlideForm] = useState({ 
        title: '', subtitle: '', btnText: 'Shop Now', btnUrl: '/', bgImage: '', iconName: 'Leaf' 
    })

    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'orders' | 'hubs' | 'delivery' | 'content'>('overview')
    
    // Mobile State
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Drill-Down States
    const [selectedHub, setSelectedHub] = useState<any | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

    // User Filter State
    const [userFilter, setUserFilter] = useState<'all' | 'user' | 'seller' | 'deliveryBoy' | 'hub' | 'admin'>('all')

    // Create Hub Form State
    const [showHubForm, setShowHubForm] = useState(false)
    const [hubForm, setHubForm] = useState({
        hubName: '', address: '', lat: '', lng: '', 
        managerName: '', managerMobile: ''
    })

    // Edit Hub State
    const [editingHub, setEditingHub] = useState<any | null>(null)
    const [editHubForm, setEditHubForm] = useState({ hubName: '', address: '', lat: '', lng: '', managerName: '', managerMobile: '' })

    // --- FETCH DATA ---
    const fetchDashboardData = async () => {
        try {
            const res = await axios.get('/api/admin/dashboard')
            if (res.data.success) {
                setStats(res.data.stats)
                setUsers(res.data.users)
                setOrders(res.data.orders)
                setHubs(res.data.hubs || [])
            }
            const delRes = await axios.get('/api/admin/delivery-requests')
            if (delRes.data.success) {
                setDeliveryRequests(delRes.data.applicants)
            }
        } catch (error) {
            console.error("Dashboard Load Error", error)
        } finally {
            setLoading(false)
        }
    }

    // 👇 Fetch Slides (with Cache Busting)
    const fetchHeroSlides = async () => {
        try {
            const res = await axios.get(`/api/admin/hero-slides?mode=${cmsMode}&t=${Date.now()}`)
            if (res.data.success) {
                setHeroSlides(res.data.slides)
            }
        } catch (error) {
            console.error("Slide fetch error", error)
        }
    }

    useEffect(() => { fetchDashboardData() }, [])
    
    // Refresh slides when content tab is active or mode changes
    useEffect(() => { 
        if (activeTab === 'content') fetchHeroSlides() 
    }, [activeTab, cmsMode])

    // --- ACTIONS ---
    const handleUserAction = async (userId: string, action: string) => {
        if(!confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            await axios.put('/api/admin/dashboard', { userId, action })
            fetchDashboardData() 
        } catch (error) { alert("Action Failed") }
    }

    const handleDeliveryAction = async (id: string, action: 'approve' | 'reject') => {
        const toastId = toast.loading("Processing...");
        try {
            const res = await axios.put('/api/admin/delivery-requests', { applicantId: id, action })
            if(res.data.success) {
                toast.success(res.data.message, { id: toastId })
                setDeliveryRequests(prev => prev.filter(a => a._id !== id))
                setStats((prev: any) => ({ ...prev, pendingApprovals: prev.pendingApprovals - 1 }))
            }
        } catch (error) { 
            toast.error("Action failed", { id: toastId }) 
        }
    }

    const handleCreateHub = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/admin/dashboard', {
                action: 'create-hub',
                ...hubForm,
                lat: parseFloat(hubForm.lat),
                lng: parseFloat(hubForm.lng)
            });
            if(res.data.success) {
                alert("Hub Created Successfully!");
                setShowHubForm(false);
                setHubForm({ hubName: '', address: '', lat: '', lng: '', managerName: '', managerMobile: '' });
                fetchDashboardData();
            }
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to create hub");
        }
    }

    const handleDeleteHub = async (hubId: string, hubName: string) => {
        if (!confirm(`Delete hub "${hubName}"? This will unlink all connected users.`)) return;
        const toastId = toast.loading('Deleting hub...');
        try {
            await axios.delete(`/api/admin/dashboard?hubId=${hubId}`);
            toast.success('Hub deleted', { id: toastId });
            setHubs(prev => prev.filter(h => h._id !== hubId));
            setStats((prev: any) => ({ ...prev, totalHubs: prev.totalHubs - 1 }));
        } catch (error) {
            toast.error('Failed to delete hub', { id: toastId });
        }
    }

    const handleEditHub = (hub: any) => {
        setEditingHub(hub);
        setEditHubForm({
            hubName: hub.name || '',
            address: hub.location?.address || '',
            lat: hub.location?.coordinates?.[1]?.toString() || '',
            lng: hub.location?.coordinates?.[0]?.toString() || '',
            managerName: hub.managerId?.name || '',
            managerMobile: hub.managerId?.mobile || ''
        });
    }

    const handleSaveHub = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading('Saving hub...');
        try {
            const res = await axios.put('/api/admin/dashboard', {
                action: 'update-hub',
                hubId: editingHub._id,
                ...editHubForm
            });
            if (res.data.success) {
                toast.success('Hub updated!', { id: toastId });
                setEditingHub(null);
                fetchDashboardData();
            }
        } catch (error) {
            toast.error('Failed to update hub', { id: toastId });
        }
    }

    // 👇 Handle Slide Creation
    const handleCreateSlide = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/admin/hero-slides', { ...slideForm, mode: cmsMode });
            if(res.data.success) {
                toast.success("Slide Added");
                setShowSlideForm(false);
                setSlideForm({ title: '', subtitle: '', btnText: 'Shop Now', btnUrl: '/', bgImage: '', iconName: 'Leaf' });
                fetchHeroSlides();
            }
        } catch (error) { toast.error("Failed to add slide") }
    }

    // 👇 Handle Slide Deletion
    const handleDeleteSlide = async (id: string) => {
        if(!confirm("Delete this slide?")) return;
        try {
            await axios.delete(`/api/admin/hero-slides?id=${id}`);
            toast.success("Slide Deleted");
            fetchHeroSlides();
        } catch (error) { toast.error("Failed to delete") }
    }

    // 👇 UPDATED: Instant Swap (Optimistic UI)
    const handleReorder = async (id: string, direction: 'up' | 'down') => {
        if (reorderLoading) return; // Prevent double clicks
        
        const currentIndex = heroSlides.findIndex(s => s._id === id);
        if (currentIndex === -1) return;
        
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= heroSlides.length) return; // Boundary check

        // 1. Swap Locally (Instant UI update)
        const newSlides = [...heroSlides];
        const temp = newSlides[currentIndex];
        newSlides[currentIndex] = newSlides[targetIndex];
        newSlides[targetIndex] = temp;
        
        setHeroSlides(newSlides); 
        setReorderLoading(id); // Show loader on button

        // 2. Sync with Server
        try {
            const res = await axios.put('/api/admin/hero-slides', { id, direction, mode: cmsMode });
            if (!res.data.success) {
                toast.error("Sync failed, reverting...");
                fetchHeroSlides(); 
            }
        } catch (error) { 
            console.error(error);
            toast.error("Failed to move slide");
            fetchHeroSlides(); 
        } finally {
            setReorderLoading(null);
        }
    }

    // --- HELPER: FILTER USERS ---
    const getFilteredUsers = () => {
        if (userFilter === 'all') return users;
        return users.filter(u => u.role === userFilter);
    }
    
    // Hub Helpers
    const getHubUsers = (role: string) => selectedHub ? users.filter(u => u.connectedHub === selectedHub._id && u.role === role) : [];
    const getHubSellers = () => selectedHub ? users.filter(u => u.connectedHub === selectedHub._id && (u.sellerStatus === 'approved' || u.sellerStatus === 'pending')) : [];

    // --- RENDERERS ---

    const renderContentManagement = () => (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Layers size={20} className="text-indigo-600"/> Hero Section Manager</h3>
                    <p className="text-gray-500 text-sm mt-1">Manage slides for Dehati (Grocery) and Student Zone</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setCmsMode('grocery')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${cmsMode === 'grocery' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}>Grocery</button>
                        <button onClick={() => setCmsMode('student')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${cmsMode === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Student</button>
                    </div>
                    <button onClick={() => setShowSlideForm(true)} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 shadow-lg">
                        <Plus size={16}/> Add Slide
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300">
                {heroSlides.map((slide: any, index: number) => (
                    <div key={slide._id} className="group relative bg-white rounded-xl overflow-hidden shadow-md border border-gray-200 hover:shadow-xl transition-all flex flex-col">
                        <div className="relative aspect-video w-full">
                            <Image src={slide.bgImage} alt={slide.title} fill className="object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                                <h4 className="font-bold text-lg leading-tight">{slide.title}</h4>
                                <p className="text-xs opacity-80 line-clamp-2 mt-1">{slide.subtitle}</p>
                            </div>
                            <button onClick={() => handleDeleteSlide(slide._id)} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                <Trash size={14}/>
                            </button>
                            <div className={`absolute top-2 left-2 px-2 py-1 text-white text-[10px] rounded uppercase font-bold shadow-sm ${slide.mode === 'grocery' ? 'bg-green-600' : 'bg-indigo-600'}`}>
                                {slide.mode}
                            </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 flex items-center justify-between border-t mt-auto">
                            <div className="flex gap-2">
                                <button 
                                    type="button" 
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        e.stopPropagation(); 
                                        handleReorder(slide._id, 'up'); 
                                    }} 
                                    disabled={index === 0 || reorderLoading !== null}
                                    className={`p-1.5 border rounded transition-colors ${index === 0 ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`}
                                    title="Move Up"
                                >
                                    {reorderLoading === slide._id ? <Loader2 size={16} className="animate-spin text-indigo-600"/> : <ArrowUp size={16} className="text-gray-600"/>}
                                </button>
                                <button 
                                    type="button"
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        e.stopPropagation(); 
                                        handleReorder(slide._id, 'down'); 
                                    }} 
                                    disabled={index === heroSlides.length - 1 || reorderLoading !== null}
                                    className={`p-1.5 border rounded transition-colors ${index === heroSlides.length - 1 ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`}
                                    title="Move Down"
                                >
                                    {reorderLoading === slide._id ? <Loader2 size={16} className="animate-spin text-indigo-600"/> : <ArrowDown size={16} className="text-gray-600"/>}
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded border max-w-[150px] truncate">
                                <ExternalLink size={12}/> {slide.btnUrl}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {heroSlides.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                    <p className="text-gray-500 font-medium">No slides found for {cmsMode} mode.</p>
                    <button onClick={() => setShowSlideForm(true)} className="text-indigo-600 text-sm font-bold mt-2 hover:underline">Add your first slide</button>
                </div>
            )}
        </div>
    )

    const renderOverview = () => (
        <>
            {/* Alert Card for Pending Requests */}
            {deliveryRequests.length > 0 && (
                <div 
                    onClick={() => setActiveTab('delivery')}
                    className="mb-8 bg-indigo-900 rounded-2xl p-6 shadow-xl relative overflow-hidden cursor-pointer group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Bike size={100} className="text-white"/></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-white/20 text-indigo-100 text-xs font-bold px-2 py-1 rounded uppercase">Action Required</span>
                            </div>
                            <h2 className="text-3xl font-black text-white">{deliveryRequests.length} Pending Approvals</h2>
                            <p className="text-indigo-200 text-sm mt-1">Delivery partners waiting for verification.</p>
                        </div>
                        <div className="bg-white text-indigo-900 px-4 py-2 rounded-lg font-bold text-sm group-hover:scale-105 transition-transform">
                            Review Now &rarr;
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<Users className="text-blue-600"/>} label="Total Users" value={stats.totalUsers} color="bg-blue-50"/>
                <StatCard icon={<ShoppingBag className="text-purple-600"/>} label="Total Orders" value={stats.totalOrders} color="bg-purple-50"/>
                <StatCard icon={<TrendingUp className="text-green-600"/>} label="Total Revenue" value={`₹${stats.totalRevenue}`} color="bg-green-50"/>
                <StatCard icon={<MapPin className="text-orange-600"/>} label="Total Hubs" value={stats.totalHubs} color="bg-orange-50"/>
            </div>
        </>
    )

    const renderDeliveryRequests = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <Bike className="text-indigo-600"/> Pending Delivery Approvals
                </h3>
            </div>
            
            {deliveryRequests.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                    <div className="bg-green-50 p-4 rounded-full mb-3"><CheckCircle className="text-green-500" size={32}/></div>
                    <p className="text-gray-500 font-bold">All Caught Up!</p>
                    <p className="text-gray-400 text-sm">No pending applications.</p>
                </div>
            ) : (
                <div className="divide-y">
                    {deliveryRequests.map((app) => (
                        <div key={app._id} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-gray-50 transition-colors relative">
                            <div className="absolute top-4 right-4 bg-orange-50 text-orange-700 px-3 py-1 rounded-lg text-xs font-bold border border-orange-100">
                                Via: {app.connectedHub?.name || "Unknown Hub"}
                            </div>

                            <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden relative border">
                                {app.image ? <Image src={app.image} fill alt="user" className="object-cover"/> : <User className="w-8 h-8 m-auto text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>}
                            </div>

                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900">{app.deliveryDetails?.name}</h4>
                                <p className="text-sm text-gray-500 mb-3">S/o {app.deliveryDetails?.fatherName}</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 bg-white p-3 border rounded-lg">
                                    <div className="flex items-center gap-2"><Phone size={14}/> {app.deliveryDetails?.mobile}</div>
                                    <div className="flex items-center gap-2"><MapPin size={14}/> {app.deliveryDetails?.address}</div>
                                    <div className="flex items-center gap-2"><Truck size={14}/> {app.deliveryDetails?.vehicleType.toUpperCase()} ({app.deliveryDetails?.vehicleNumber})</div>
                                    <div className="flex items-center gap-2"><FileText size={14}/> License: {app.deliveryDetails?.drivingLicense}</div>
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-2 min-w-[140px]">
                                <button onClick={() => handleDeliveryAction(app._id, 'approve')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm">
                                    <CheckCircle size={16}/> Approve
                                </button>
                                <button onClick={() => handleDeliveryAction(app._id, 'reject')} className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                                    <XCircle size={16}/> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    const renderHubsList = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-lg">Manage Dehati Hubs</h3>
                <button onClick={() => setShowHubForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">
                    <Plus size={16}/> Add Hub
                </button>
            </div>
            
            {hubs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No Hubs Created Yet.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                            <tr>
                                <th className="p-4 whitespace-nowrap">Hub Name</th>
                                <th className="p-4 whitespace-nowrap">Location</th>
                                <th className="p-4 whitespace-nowrap">Manager</th>
                                <th className="p-4 whitespace-nowrap">Status</th>
                                <th className="p-4 whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {hubs.map((hub: any) => (
                                <tr key={hub._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedHub(hub)}>
                                    <td className="p-4 font-bold text-indigo-600 hover:underline">{hub.name}</td>
                                    <td className="p-4 text-gray-600 max-w-[200px] truncate">{hub.location?.address}</td>
                                    <td className="p-4 text-gray-600">
                                        {hub.managerId ? (
                                            <div className="flex flex-col">
                                                <span className="font-bold">{hub.managerId.name}</span>
                                                <span className="text-xs">{hub.managerId.mobile}</span>
                                            </div>
                                        ) : <span className="text-red-500">Unassigned</span>}
                                    </td>
                                    <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Active</span></td>
                                    <td className="p-4">
                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleEditHub(hub)}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteHub(hub._id, hub.name)}
                                                className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )

    const renderHubDetail = () => {
        if(!selectedHub) return null;
        const hubSellers = getHubSellers();
        const hubDelivery = getHubUsers('deliveryBoy');
        const hubConsumers = getHubUsers('user');

        return (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button onClick={() => setSelectedHub(null)} className="text-gray-500 hover:text-black flex items-center gap-1 text-sm font-bold mb-2">
                            <ChevronLeft size={16}/> Back to Hubs
                        </button>
                        <h2 className="text-2xl font-black text-gray-800">{selectedHub.name}</h2>
                        <p className="text-gray-500 text-sm">{selectedHub.location?.address}</p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-xl text-center text-gray-500 font-bold border border-dashed">
                    Stats: {hubSellers.length} Sellers, {hubDelivery.length} Delivery Boys, {hubConsumers.length} Users
                    <br/>
                    <span className="text-xs font-normal opacity-70">Detailed management inside Hub view coming soon.</span>
                </div>
            </div>
        )
    }

    const renderOrderDetail = () => {
        if (!selectedOrder) return null;
        const o = selectedOrder;

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white rounded-full transition-colors"><ChevronLeft size={24}/></button>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800">Order #{o._id.substring(o._id.length - 6)}</h2>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${o.status==='delivered'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{o.status}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><User size={18}/> Customer Details</h3>
                        <div>
                            <div className="text-sm font-bold text-gray-700">{o.userId?.name || 'Unknown User'}</div>
                            <div className="text-sm text-gray-500">{o.userId?.mobile}</div>
                            <div className="text-sm text-gray-500">{o.userId?.email}</div>
                        </div>
                        <div className="pt-4 border-t">
                            <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><Map size={18}/> Delivery Address</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{o.address?.street}, {o.address?.city}, {o.address?.pincode}</p>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Package size={18}/> Order Items</h3>
                        <div className="space-y-4">
                            {o.items?.map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-12 h-12 bg-gray-200 rounded-md shrink-0 overflow-hidden relative"></div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-800">{item.product?.name || 'Deleted Product'}</div>
                                        <div className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price}</div>
                                    </div>
                                    <div className="font-bold text-gray-800">₹{item.quantity * item.price}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Total Amount</span>
                            <span className="text-2xl font-black text-green-600">₹{o.totalAmount}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderOrdersList = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100"><h3 className="font-bold text-gray-800 text-lg">Global Order History</h3></div>
            {orders.length === 0 ? (
                <div className="p-12 text-center text-gray-400">No orders placed yet.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                            <tr>
                                <th className="p-4 whitespace-nowrap">Order ID</th>
                                <th className="p-4 whitespace-nowrap">Customer</th>
                                <th className="p-4 whitespace-nowrap">Items</th>
                                <th className="p-4 whitespace-nowrap">Total</th>
                                <th className="p-4 whitespace-nowrap">Status</th>
                                <th className="p-4 whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50 cursor-pointer group" onClick={() => setSelectedOrder(order)}>
                                    <td className="p-4 font-mono text-xs text-indigo-600 font-bold">#{order._id.substring(order._id.length - 6)}</td>
                                    <td className="p-4 font-bold text-gray-800">{order.userId?.name || 'Unknown'}</td>
                                    <td className="p-4 text-gray-500">{order.items?.length || 0} Items</td>
                                    <td className="p-4 text-gray-800 font-bold">₹{order.totalAmount}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                                            ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400 text-xs group-hover:text-indigo-600 font-bold">View Details &rarr;</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )

    const renderUsers = () => {
        const filteredUsers = getFilteredUsers();
        
        return (
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-bold text-gray-800 text-lg">Global User Management</h3>
                    <div className="flex flex-wrap gap-2">
                        {[{ id: 'all', label: 'All' }, { id: 'seller', label: 'Sellers' }, { id: 'user', label: 'Users' }, { id: 'deliveryBoy', label: 'Delivery' }, { id: 'hub', label: 'Hubs' }].map(f => (
                            <button key={f.id} onClick={() => setUserFilter(f.id as any)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${userFilter === f.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                            <tr><th className="p-4 whitespace-nowrap">User</th><th className="p-4 whitespace-nowrap">Role</th><th className="p-4 whitespace-nowrap">Hub</th><th className="p-4 whitespace-nowrap">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.mobile}</div>
                                    </td>
                                    <td className="p-4 uppercase text-xs font-bold text-gray-500">{user.role}</td>
                                    <td className="p-4 text-xs text-gray-500">{hubs.find(h => h._id === user.connectedHub)?.name || '-'}</td>
                                    <td className="p-4 flex gap-2">
                                        {user.sellerStatus === 'pending' && (
                                            <>
                                                <button onClick={() => handleUserAction(user._id, 'approve')} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200" title="Approve"><CheckCircle size={16}/></button>
                                                <button onClick={() => handleUserAction(user._id, 'reject')} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200" title="Reject"><XCircle size={16}/></button>
                                            </>
                                        )}
                                        <button onClick={() => handleUserAction(user._id, user.isBlocked ? 'unblock' : 'block')} className={`p-1.5 rounded ${user.isBlocked ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-500'}`}>
                                            {user.isBlocked ? <Shield size={16}/> : <Ban size={16}/>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No users found for filter: {userFilter}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    if (loading) return <div className="h-screen flex items-center justify-center text-indigo-600 font-bold">Loading Admin Panel...</div>

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20">
                <div className="font-black text-indigo-600 text-lg flex items-center gap-2"><Shield className="fill-indigo-600 text-white"/> Admin</div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-gray-100 rounded-lg"><Menu size={20}/></button>
            </div>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:block ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-indigo-600 flex items-center gap-2"><Shield className="fill-indigo-600 text-white"/> Admin</h2>
                    <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-gray-400"><X size={24}/></button>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <SidebarItem icon={<TrendingUp/>} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <SidebarItem icon={<Bike/>} label="Delivery Approvals" active={activeTab === 'delivery'} onClick={() => setActiveTab('delivery')} />
                    <SidebarItem icon={<Store/>} label="Manage Hubs" active={activeTab === 'hubs'} onClick={() => setActiveTab('hubs')} />
                    <SidebarItem icon={<Users/>} label="Global Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    <SidebarItem icon={<ShoppingBag/>} label="Global Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                    <SidebarItem icon={<Layers/>} label="Content & Hero" active={activeTab === 'content'} onClick={() => setActiveTab('content')} />
                    <Link href="/admin/catalog" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-gray-500 hover:bg-gray-50">
                        <Package size={20} /> Product Catalog
                    </Link>
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-all"><LogOut size={20}/> Logout</button>
                </div>
            </aside>
            
            {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-20 md:hidden"></div>}

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                            {activeTab === 'content' ? 'Content Management' : 'Dashboard Overview'}
                        </h1>
                         <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">{new Date().toDateString()}</p>
                    </div>
                </header>

                {/* CONTENT SWITCHER */}
                {selectedOrder ? renderOrderDetail() : 
                 selectedHub ? renderHubDetail() : (
                    <>
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'users' && renderUsers()}
                        {activeTab === 'hubs' && renderHubsList()}
                        {activeTab === 'orders' && renderOrdersList()} 
                        {activeTab === 'delivery' && renderDeliveryRequests()}
                        {activeTab === 'content' && renderContentManagement()}
                    </>
                )}

                {/* Slide Form Modal */}
                {showSlideForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Add {cmsMode === 'grocery' ? 'Grocery' : 'Student'} Slide</h3>
                                <button onClick={() => setShowSlideForm(false)}><XCircle size={24} className="text-gray-400"/></button>
                            </div>
                            <form onSubmit={handleCreateSlide} className="space-y-4">
                                <div><label className="text-xs font-bold text-gray-500">Image URL</label><input required className="w-full p-3 border rounded-xl" value={slideForm.bgImage} onChange={e => setSlideForm({...slideForm, bgImage: e.target.value})} placeholder="https://..." /></div>
                                <div><label className="text-xs font-bold text-gray-500">Title</label><input required className="w-full p-3 border rounded-xl" value={slideForm.title} onChange={e => setSlideForm({...slideForm, title: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-gray-500">Subtitle</label><textarea required className="w-full p-3 border rounded-xl" value={slideForm.subtitle} onChange={e => setSlideForm({...slideForm, subtitle: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-gray-500">Button Text</label><input required className="w-full p-3 border rounded-xl" value={slideForm.btnText} onChange={e => setSlideForm({...slideForm, btnText: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold text-gray-500">Button URL</label><input required className="w-full p-3 border rounded-xl" value={slideForm.btnUrl} onChange={e => setSlideForm({...slideForm, btnUrl: e.target.value})} placeholder="/student-zone" /></div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Icon</label>
                                    <select className="w-full p-3 border rounded-xl" value={slideForm.iconName} onChange={e => setSlideForm({...slideForm, iconName: e.target.value})}>
                                        <option value="Leaf">Leaf (Veg)</option>
                                        <option value="Truck">Truck (Delivery)</option>
                                        <option value="Smartphone">Smartphone</option>
                                        <option value="Book">Book (Student)</option>
                                        <option value="Apple">Apple</option>
                                        <option value="Carrot">Carrot</option>
                                        <option value="GraduationCap">Graduation Cap</option>
                                        <option value="Pencil">Pencil</option>
                                        <option value="ShoppingCart">Shopping Cart</option>
                                        <option value="Tag">Discount Tag</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Save Slide</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Hub Modal */}
                {editingHub && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">Edit Hub: {editingHub.name}</h3>
                                <button onClick={() => setEditingHub(null)} className="p-2 hover:bg-gray-100 rounded-full"><XCircle size={24} className="text-gray-400"/></button>
                            </div>
                            <form onSubmit={handleSaveHub} className="space-y-4">
                                <div><label className="block text-xs font-bold text-gray-500">Hub Name</label><input required type="text" className="w-full p-3 border rounded-xl" value={editHubForm.hubName} onChange={e => setEditHubForm({...editHubForm, hubName: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-gray-500">Address</label><input type="text" className="w-full p-3 border rounded-xl" value={editHubForm.address} onChange={e => setEditHubForm({...editHubForm, address: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500">Lat</label><input type="number" step="any" className="w-full p-3 border rounded-xl" value={editHubForm.lat} onChange={e => setEditHubForm({...editHubForm, lat: e.target.value})} /></div>
                                    <div><label className="block text-xs font-bold text-gray-500">Lng</label><input type="number" step="any" className="w-full p-3 border rounded-xl" value={editHubForm.lng} onChange={e => setEditHubForm({...editHubForm, lng: e.target.value})} /></div>
                                </div>
                                <div className="p-4 bg-indigo-50 rounded-xl space-y-3 border border-indigo-100">
                                    <h4 className="text-sm font-bold text-indigo-600">Update Manager (Optional)</h4>
                                    <div><label className="block text-xs font-bold text-gray-500">Manager Name</label><input type="text" placeholder="Manager Name" className="w-full p-3 bg-white border rounded-xl" value={editHubForm.managerName} onChange={e => setEditHubForm({...editHubForm, managerName: e.target.value})} /></div>
                                    <div><label className="block text-xs font-bold text-gray-500">Manager Mobile</label><input type="text" placeholder="10-digit mobile" className="w-full p-3 bg-white border rounded-xl" value={editHubForm.managerMobile} onChange={e => setEditHubForm({...editHubForm, managerMobile: e.target.value})} /></div>
                                    <p className="text-xs text-gray-400">If mobile matches an existing user, their role will be updated to Hub Manager.</p>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setEditingHub(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Hub Form Modal */}
                {showHubForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">Add New Hub</h3>
                                <button onClick={() => setShowHubForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><XCircle size={24} className="text-gray-400"/></button>
                            </div>
                            <form onSubmit={handleCreateHub} className="space-y-4">
                                <div><label className="block text-xs font-bold text-gray-500">Hub Name</label><input required type="text" className="w-full p-3 border rounded-xl" value={hubForm.hubName} onChange={e => setHubForm({...hubForm, hubName: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-gray-500">Address</label><input required type="text" className="w-full p-3 border rounded-xl" value={hubForm.address} onChange={e => setHubForm({...hubForm, address: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500">Lat</label><input required type="number" className="w-full p-3 border rounded-xl" value={hubForm.lat} onChange={e => setHubForm({...hubForm, lat: e.target.value})} /></div>
                                    <div><label className="block text-xs font-bold text-gray-500">Lng</label><input required type="number" className="w-full p-3 border rounded-xl" value={hubForm.lng} onChange={e => setHubForm({...hubForm, lng: e.target.value})} /></div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl space-y-4 border">
                                    <h4 className="text-sm font-bold text-indigo-600">Assign Manager</h4>
                                    <input required type="text" placeholder="Name" className="w-full p-3 bg-white border rounded-xl" value={hubForm.managerName} onChange={e => setHubForm({...hubForm, managerName: e.target.value})} />
                                    <input required type="text" placeholder="Mobile" className="w-full p-3 bg-white border rounded-xl" value={hubForm.managerMobile} onChange={e => setHubForm({...hubForm, managerMobile: e.target.value})} />
                                </div>
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Create Hub</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

function StatCard({ icon, label, value, color }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-4 rounded-full ${color}`}>{icon}</div>
            <div>
                <div className="text-gray-500 text-sm font-bold">{label}</div>
                <div className="text-2xl font-black text-gray-800">{value}</div>
            </div>
        </div>
    )
}

function SidebarItem({ icon, label, active, onClick }: any) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
            {icon} {label}
        </button>
    )
}