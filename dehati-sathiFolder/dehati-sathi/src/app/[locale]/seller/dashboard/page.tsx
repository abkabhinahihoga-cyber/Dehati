'use client'
import React, { useEffect, useState, useRef } from 'react'
import { 
    Package, Plus, DollarSign, ListChecks, Store, TrendingUp, 
    Loader2, ArrowLeft, Trash2, CheckCircle, Video, PlayCircle, 
    Upload, Clock, Users, X, Edit3, Check, MessageCircle, Send, FilePenLine, MapPin, Share2, ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Image from 'next/image'
import { toast } from 'sonner'
import { useLocale } from 'next-intl'

// --- INTERFACES ---
interface Product {
    _id: string;
    name: string;
    category: string;
    wholesalePrice: number;
    retailPrice: number;
    stock: number;
    unit: string;
    images: string[];
}

interface Order {
    _id: string;
    createdAt: string;
    status: string;
    paymentMethod: string;
    orderRevenue: number;
    address: { fullName: string; fullAddress: string };
    items: { 
        name: string; 
        quantity: number; 
        product: { name: string; images: string[] } 
    }[];
}

interface Reel {
    _id: string;
    videoUrl: string;
    thumbnailUrl: string;
    description: string;
    views: number;
    likes: string[];
    product?: Product;
}

interface Follower {
    _id: string;
    name: string;
    image?: string;
    email: string;
}

interface Conversation {
    _id: string;
    otherUser: { name: string; image?: string };
    lastMessage: string;
    lastMessageAt: string;
}

function SellerDashboard() {
    const router = useRouter();
    const isHindi = useLocale() === 'hi';

    // Start with 'inventory' or 'messages' depending on priority
    const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'channel' | 'messages'>('inventory')
    const [loading, setLoading] = useState(true)
    
    // --- DATA STATE ---
    const [products, setProducts] = useState<Product[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [reels, setReels] = useState<Reel[]>([])
    const [followers, setFollowers] = useState<Follower[]>([])
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [stats, setStats] = useState({ revenue: 0, pending: 0, completed: 0, total: 0 })

    // --- INVENTORY EDIT STATE ---
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValues, setEditValues] = useState<Partial<Product>>({})
    const [saving, setSaving] = useState(false)

    // --- REEL UPLOAD STATE ---
    const [showUploadModal, setShowUploadModal] = useState(false);
    
    // --- REJECT MODAL STATE ---
    const [rejectOrderState, setRejectOrderState] = useState<{isOpen: boolean, orderId: string, reason: string}>({ isOpen: false, orderId: "", reason: "" });
    // --- VERIFY PICKUP MODAL STATE ---
    const [verifyPickupState, setVerifyPickupState] = useState<{isOpen: boolean, orderId: string, otp: string}>({ isOpen: false, orderId: "", otp: "" });
    const [rejectionVerifyState, setRejectionVerifyState] = useState<{isOpen: boolean, orderId: string, otp: string}>({ isOpen: false, orderId: "", otp: "" });
    
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [reelDesc, setReelDesc] = useState("");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [uploadingReel, setUploadingReel] = useState(false);
    
    // Upload Progress
    const [uploadProgress, setUploadProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const uploadStartTime = useRef<number>(0);

    const t = {
        back: isHindi ? 'होम पर वापस जाएं' : 'Back to Home',
        title: isHindi ? 'दुकानदार डैशबोर्ड' : 'Seller Dashboard',
        subtitle: isHindi ? 'अपनी दुकान, ग्राहक, और वीडियो प्रबंधित करें।' : 'Manage your shop, orders, messages, and channel.',
        addReel: isHindi ? 'वीडियो डालें' : 'Add Reel',
        addProduct: isHindi ? 'सामान जोड़ें' : 'Add Product',
        revenue: isHindi ? 'कुल कमाई' : 'Total Revenue',
        pendingOrders: isHindi ? 'पेंडिंग ऑर्डर' : 'Pending Orders',
        followers: isHindi ? 'फॉलोअर्स' : 'Followers',
        activeChats: isHindi ? 'मैसेज' : 'Active Chats',
        tabInventory: isHindi ? 'मेरा सामान' : 'My Inventory',
        tabOrders: isHindi ? 'ऑर्डर' : 'Customer Orders',
        tabMessages: isHindi ? 'मैसेज' : 'Messages',
        tabChannel: isHindi ? 'वीडियो (रील्स)' : 'Channel & Community',
        product: isHindi ? 'सामान' : 'Product',
        prices: isHindi ? 'मूल्य (W/R)' : 'Prices (W/R)',
        stock: isHindi ? 'स्टॉक' : 'Stock',
        actions: isHindi ? 'बदलाव' : 'Actions',
        noOrders: isHindi ? 'कोई ऑर्डर नहीं मिला।' : 'No orders found.',
        orderId: isHindi ? 'ऑर्डर ID' : 'Order ID',
        customer: isHindi ? 'ग्राहक' : 'Customer',
        items: isHindi ? 'सामान' : 'Items',
        earnings: isHindi ? 'कमाई' : 'Earnings',
        status: isHindi ? 'स्थिति' : 'Status',
        noMessages: isHindi ? 'अभी तक कोई संदेश नहीं।' : 'No messages yet.',
        reply: isHindi ? 'उत्तर दें' : 'Reply',
        recentFollowers: isHindi ? 'हाल ही के फॉलोअर्स' : 'Recent Followers',
        noFollowersYet: isHindi ? 'अभी तक कोई फॉलोअर्स नहीं।' : 'No followers yet.',
        yourReels: isHindi ? 'आपके वीडियो' : 'Your Reels',
        noReels: isHindi ? 'अभी तक कोई वीडियो अपलोड नहीं किया गया' : 'No Reels Uploaded Yet',
        boostEngagement: isHindi ? 'छोटे वीडियो के साथ बिक्री बढ़ाएं!' : 'Boost engagement with short videos!',
        uploadReel: isHindi ? 'वीडियो अपलोड करें' : 'Upload Reel',
        uploadNewReel: isHindi ? 'नया वीडियो अपलोड करें' : 'Upload New Reel',
        clickSelectVideo: isHindi ? 'वीडियो चुनने के लिए क्लिक करें' : 'Click to select video',
        caption: isHindi ? 'कैप्शन लिखें...' : 'Write a caption...',
        linkProduct: isHindi ? '-- सामान लिंक करें (वैकल्पिक) --' : '-- Link Product (Optional) --',
        uploading: isHindi ? 'अपलोड हो रहा है...' : 'Uploading...',
        publishReel: isHindi ? 'वीडियो डालें' : 'Publish Reel',
        deleteProduct: isHindi ? 'क्या आप इस सामान को हटाना चाहते हैं?' : 'Delete this product?',
        productDeleted: isHindi ? 'सामान हटा दिया गया' : 'Product deleted',
        failedDelete: isHindi ? 'हटाने में विफल' : 'Failed to delete',
        updatedSuccess: isHindi ? 'सफलतापूर्वक अपडेट किया गया' : 'Updated successfully',
        updateFailed: isHindi ? 'अपडेट करने में विफल' : 'Failed to update',
        statusUpdated: isHindi ? 'स्थिति अपडेट की गई' : 'Order marked as',
        loadFailed: isHindi ? 'डेटा लोड करने में विफल' : 'Failed to load dashboard data',
        deleteReelPrompt: isHindi ? 'क्या आप इस वीडियो को हटाना चाहते हैं?' : 'Delete this reel?',
        reelDeleted: isHindi ? 'वीडियो हटा दिया गया' : 'Reel deleted',
        reelUploadSuccess: isHindi ? 'वीडियो सफलतापूर्वक अपलोड हुआ!' : 'Reel uploaded successfully!',
    }

    // --- INITIAL FETCH ---
    useEffect(() => {
        fetchAllData()
    }, [])

    const fetchAllData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Inventory
            const resProd = await axios.get('/api/seller/products')
            if (resProd.data.success) setProducts(resProd.data.products)

            // 2. Fetch Orders & Stats
            const resOrd = await axios.get('/api/seller/orders')
            if (resOrd.data.success) {
                setOrders(resOrd.data.orders)
                setStats(resOrd.data.stats)
            }

            // 3. Fetch Reels & Followers
            try {
                const resReels = await axios.get('/api/seller/reels');
                if (resReels.data.success) {
                    setReels(resReels.data.reels);
                    if(resReels.data.followers) setFollowers(resReels.data.followers); 
                }
            } catch (e) { console.log("Reels API not ready") }

            // 4. Fetch Conversations (Messages)
            try {
                const resChat = await axios.get('/api/chat/conversations');
                if (resChat.data.success) {
                    setConversations(resChat.data.conversations);
                }
            } catch (e) { console.log("Chat API not ready") }

        } catch (error) {
            console.error("Failed to load data")
            toast.error(t.loadFailed)
        } finally {
            setLoading(false)
        }
    }

    // --- ACTION: NEW SELLER ORDER ACTIONS ---
    const handleOrderAction = async (orderId: string, action: string, extraData: any = {}) => {
        try {
            const res = await axios.post(`/api/seller/orders/${orderId}/action`, { action, ...extraData });
            if(res.data.success) {
                toast.success(res.data.message || t.updatedSuccess);
                fetchAllData(); // Refresh to get latest state
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || t.updateFailed);
        }
    }

    const handleRejectOrder = (orderId: string) => {
        setRejectOrderState({ isOpen: true, orderId, reason: "" });
    }

    const submitRejectOrder = () => {
        if (!rejectOrderState.reason) {
            toast.error(isHindi ? "कृपया कारण चुनें" : "Please select a reason");
            return;
        }
        handleOrderAction(rejectOrderState.orderId, "reject", { reason: rejectOrderState.reason });
        setRejectOrderState({ isOpen: false, orderId: "", reason: "" });
    }

    const handleVerifyPickup = (orderId: string) => {
        setVerifyPickupState({ isOpen: true, orderId, otp: "" });
    }

    const submitVerifyPickup = () => {
        if (!verifyPickupState.otp || verifyPickupState.otp.length < 4) {
            toast.error(isHindi ? 'कृपया सही पिकअप कोड दर्ज करें' : 'Please enter the valid pickup code');
            return;
        }
        handleOrderAction(verifyPickupState.orderId, 'verify_pickup', { otp: verifyPickupState.otp });
        setVerifyPickupState({ isOpen: false, orderId: "", otp: "" });
    }

    // --- ACTION: INVENTORY EDITING ---
    const startEditing = (product: Product) => {
        setEditingId(product._id)
        setEditValues({
            wholesalePrice: product.wholesalePrice,
            retailPrice: product.retailPrice,
            stock: product.stock
        })
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditValues({})
    }

    const saveQuickEdit = async () => {
        if (!editingId) return
        setSaving(true)
        try {
            const formData = new FormData();
            formData.append("wholesalePrice", String(editValues.wholesalePrice));
            formData.append("retailPrice", String(editValues.retailPrice));
            formData.append("stock", String(editValues.stock));
            
            // Append required fields for validation if needed by backend
            const currentProduct = products.find(p => p._id === editingId);
            if(currentProduct) {
                formData.append("name", currentProduct.name);
                formData.append("category", currentProduct.category);
                formData.append("unit", currentProduct.unit);
            }

            await axios.put(`/api/seller/product/${editingId}`, formData)
            
            setProducts(prev => prev.map(p => p._id === editingId ? { ...p, ...editValues } as Product : p))
            toast.success(t.updatedSuccess)
            setEditingId(null)
        } catch (error) {
            toast.error(t.updateFailed)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t.deleteProduct)) return;
        try {
            await axios.delete(`/api/seller/product/${id}`);
            setProducts(prev => prev.filter(p => p._id !== id));
            toast.success(t.productDeleted);
        } catch (error) {
            toast.error(t.failedDelete);
        }
    }

    // --- ACTION: REEL UPLOAD ---
    const handleReelUpload = async () => {
        if (!videoFile) return toast.error("Please select a video");
        setUploadingReel(true);
        setUploadProgress(0);
        setTimeLeft("Calculating...");
        uploadStartTime.current = Date.now();

        try {
            // 1. Get Signature
            const timestamp = Math.round((new Date()).getTime() / 1000);
            const paramsToSign = {
                timestamp: timestamp,
                folder: "dehati_reels",
                eager: "w_300,h_300,c_pad,ac_none", 
            };

            const signRes = await axios.post("/api/auth/cloudinary-sign", { paramsToSign });
            const { signature, apiKey, cloudName } = signRes.data;

            if (!apiKey || !cloudName) throw new Error("Server configuration error");

            // 2. Upload to Cloudinary
            const formData = new FormData();
            formData.append("file", videoFile);
            formData.append("api_key", apiKey);
            formData.append("timestamp", timestamp.toString());
            formData.append("signature", signature);
            formData.append("folder", "dehati_reels");
            formData.append("eager", "w_300,h_300,c_pad,ac_none");

            const uploadRes = await axios.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, 
                formData, 
                {
                    onUploadProgress: (progressEvent) => {
                        const total = progressEvent.total || 0;
                        const current = progressEvent.loaded;
                        const percent = Math.round((current * 100) / total);
                        setUploadProgress(percent);

                        if (percent > 0 && percent < 100) {
                            const timeElapsed = (Date.now() - uploadStartTime.current) / 1000;
                            const uploadSpeed = current / timeElapsed; 
                            const remainingBytes = total - current;
                            if (uploadSpeed > 0) {
                                const secondsLeft = Math.round(remainingBytes / uploadSpeed);
                                setTimeLeft(secondsLeft < 60 ? `${secondsLeft}s remaining` : `${Math.ceil(secondsLeft / 60)}m remaining`);
                            }
                        } else if (percent === 100) {
                            setTimeLeft("Processing video...");
                        }
                    }
                }
            );

            const { secure_url, eager } = uploadRes.data;
            const thumbnailUrl = eager?.[0]?.secure_url || secure_url.replace(/\.[^/.]+$/, ".jpg");

            // 3. Save Metadata
            const metaRes = await axios.post('/api/seller/reels/upload', {
                videoUrl: secure_url,
                thumbnailUrl: thumbnailUrl,
                description: reelDesc,
                productId: selectedProductId || undefined
            });

            if (metaRes.data.success) {
                toast.success(t.reelUploadSuccess);
                setReels([metaRes.data.reel, ...reels]);
                setShowUploadModal(false);
                setVideoFile(null);
                setReelDesc("");
                setSelectedProductId("");
            }
        } catch (error: any) {
            console.error("Upload failed", error);
            if (error.code === 'ECONNABORTED') toast.error("Upload timed out. Check internet.");
            else toast.error(error.message || "Upload failed.");
        } finally {
            setUploadingReel(false);
            setUploadProgress(0);
            setTimeLeft(null);
        }
    };

    const handleDeleteReel = async (id: string) => {
        if(!confirm(t.deleteReelPrompt)) return;
        try {
            await axios.delete(`/api/seller/reels/${id}`); 
            setReels(prev => prev.filter(r => r._id !== id));
            toast.success(t.reelDeleted);
        } catch(e) { toast.error("Failed to delete reel") }
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 md:px-8 relative">
            <div className="max-w-7xl mx-auto">
                {/* --- HEADER --- */}
                <div className='mb-6'>
                    <Link href="/" className='inline-flex items-center gap-2 text-gray-500 hover:text-green-700 font-medium transition-colors'>
                        <ArrowLeft className='w-5 h-5' /> {t.back}
                    </Link>
                </div>

                <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
                    <div>
                        <h1 className='text-3xl font-bold text-gray-800 flex items-center gap-3'>
                            <Store className='text-green-600 w-8 h-8' /> {t.title}
                        </h1>
                        <p className='text-gray-500 mt-1'>{t.subtitle}</p>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowUploadModal(true)} 
                            className='bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-teal-200 transition-all flex items-center gap-2'
                        >
                            <Video className='w-5 h-5 text-white' /> 
                            <span className="text-white">{t.addReel}</span>
                        </button>
                        
                        <Link href="/seller/add-grocery" className='bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-green-200 transition-all flex items-center gap-2'>
                            <Plus className='w-5 h-5' /> {t.addProduct}
                        </Link>
                    </div>
                </div>

                {/* --- STATS CARDS --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={<DollarSign/>} label={t.revenue} value={`₹${stats.revenue}`} color="bg-green-100 text-green-700" />
                    <StatCard icon={<ListChecks/>} label={t.pendingOrders} value={stats.pending} color="bg-orange-100 text-orange-700" />
                    <StatCard icon={<Users/>} label={t.followers} value={followers.length} color="bg-blue-100 text-blue-700" />
                    <StatCard icon={<MessageCircle/>} label={t.activeChats} value={conversations.length} color="bg-indigo-100 text-indigo-700" />
                </div>

                {/* --- TABS --- */}
                <div className='flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto pb-2'>
                    {['inventory', 'orders', 'messages', 'channel'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-2 px-4 text-base sm:text-lg font-bold transition-all whitespace-nowrap capitalize rounded-t-xl ${activeTab === tab ? 'text-green-800 border-b-4 border-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                        >
                            {tab === 'channel' ? t.tabChannel : tab === 'orders' ? t.tabOrders : tab === 'messages' ? t.tabMessages : t.tabInventory}
                        </button>
                    ))}
                </div>

                {/* --- MAIN CONTENT AREA --- */}
                <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]'>
                    {loading ? (
                        <div className='p-20 flex justify-center'><Loader2 className='animate-spin text-green-600 w-10 h-10' /></div> 
                    ) : activeTab === 'inventory' ? (
                        /* ================== INVENTORY TAB ================== */
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                            {products.map((item) => {
                                const isEditing = editingId === item._id;
                                return (
                                    <div key={item._id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col ${isEditing ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                                        <div className="relative w-full h-40 bg-gray-100 flex-shrink-0 border-b border-gray-100">
                                            {item.images[0] ? <Image src={item.images[0]} fill alt={item.name} className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={40}/></div>}
                                            <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md shadow text-xs font-bold text-gray-700">{item.category}</div>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <h3 className="font-bold text-lg text-gray-800 line-clamp-1 mb-2">{item.name}</h3>
                                            
                                            {isEditing ? (
                                                <div className="space-y-3 mb-4 flex-1">
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 font-bold uppercase">Wholesale Price (₹)</label>
                                                        <input type="number" className="w-full p-2 border border-gray-300 bg-white rounded-lg text-sm font-bold" value={editValues.wholesalePrice} onChange={e => setEditValues({...editValues, wholesalePrice: Number(e.target.value)})} placeholder="Wholesale"/>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 font-bold uppercase">Retail Price (₹)</label>
                                                        <input type="number" className="w-full p-2 border border-gray-300 bg-white rounded-lg text-sm font-bold text-green-700" value={editValues.retailPrice} onChange={e => setEditValues({...editValues, retailPrice: Number(e.target.value)})} placeholder="Retail"/>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 font-bold uppercase">Stock Quantity</label>
                                                        <input type="number" className="w-full p-2 border border-gray-300 bg-white rounded-lg text-sm font-bold" value={editValues.stock} onChange={e => setEditValues({...editValues, stock: Number(e.target.value)})}/>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 mb-4 flex-1">
                                                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                        <span className="text-xs text-gray-500 font-bold">Wholesale:</span>
                                                        <span className="font-bold text-gray-700">₹{item.wholesalePrice}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-green-50 p-2 rounded-lg border border-green-100">
                                                        <span className="text-xs text-green-800 font-bold">Retail:</span>
                                                        <span className="font-black text-green-700 text-lg">₹{item.retailPrice}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2 px-1">
                                                        <span className="text-xs text-gray-500 font-bold">Stock:</span>
                                                        <span className={`px-2 py-1 rounded-md text-sm font-black ${item.stock > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.stock} <span className="text-[10px]">{item.unit}</span></span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                                                {isEditing ? (
                                                    <div className="flex gap-2">
                                                        <button onClick={saveQuickEdit} disabled={saving} className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-sm"><Check size={18}/> Save</button>
                                                        <button onClick={cancelEditing} className="p-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 shadow-sm"><X size={18}/></button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => {
                                                                if (navigator.share) {
                                                                    navigator.share({
                                                                        title: item.name,
                                                                        url: `${window.location.origin}/product/${item._id}`
                                                                    })
                                                                } else {
                                                                    navigator.clipboard.writeText(`${window.location.origin}/product/${item._id}`);
                                                                    toast.success(isHindi ? "लिंक कॉपी किया गया!" : "Link copied!");
                                                                }
                                                            }} className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 py-1.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors text-sm"><Share2 size={16}/> {isHindi ? "शेयर" : "Share"}</button>
                                                            
                                                            <Link href={`/product/${item._id}`} className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 py-1.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors text-sm"><ExternalLink size={16}/> {isHindi ? "देखें" : "View"}</Link>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => startEditing(item)} className="flex-1 bg-indigo-50 border border-indigo-100 text-indigo-700 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"><Edit3 size={16}/> Edit</button>
                                                            <Link href={`/seller/edit-product/${item._id}`} className="p-2.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors"><FilePenLine size={18}/></Link>
                                                            <button onClick={() => handleDelete(item._id)} className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={18}/></button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : activeTab === 'orders' ? (
                        /* ================== ORDERS TAB ================== */
                        <div className='p-2 sm:p-4 bg-gray-50/50 min-h-[400px]'>
                            {orders.length === 0 ? (
                                <div className='p-20 text-center text-gray-500'>{t.noOrders}</div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                    {orders.map((order) => (
                                        <div key={order._id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow flex flex-col relative overflow-hidden">
                                            {/* Status Badge Background Color strip */}
                                            <div className={`absolute top-0 left-0 w-1.5 h-full ${
                                                order.status === 'delivered' ? 'bg-green-500' :
                                                order.status === 'cancelled' ? 'bg-red-500' :
                                                'bg-yellow-400'
                                            }`} />
                                            
                                            <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100 pl-3">
                                                <div className="pr-2">
                                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">ORDER #{order._id.slice(-6).toUpperCase()}</span>
                                                    <h3 className="font-black text-lg sm:text-xl text-gray-800 mt-2 line-clamp-1">{order.address?.fullName || "Guest"}</h3>
                                                    <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-start gap-1">
                                                        <MapPin size={16} className="shrink-0 mt-0.5 text-gray-400"/>
                                                        <span className="line-clamp-2 leading-tight">{order.address?.fullAddress}</span>
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="bg-green-50 text-green-800 text-lg sm:text-xl font-black px-3 py-1 rounded-xl border border-green-100">₹{order.orderRevenue}</span>
                                                    <p className="text-[10px] font-bold text-indigo-700 mt-2 uppercase bg-indigo-50 px-2 py-0.5 rounded-md inline-block border border-indigo-100">{order.paymentMethod}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 mb-4 pl-3">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t.items}</p>
                                                <div className="space-y-2">
                                                    {order.items.map((i: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-3 bg-gray-50/80 p-2 sm:p-2.5 rounded-xl border border-gray-100">
                                                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden relative shrink-0">
                                                                {i.product?.images?.[0] ? <Image src={i.product.images[0]} fill alt="product" className="object-cover"/> : <Package size={20} className="text-gray-300"/>}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-gray-800 text-sm sm:text-base line-clamp-1">{i.name || i.product?.name}</p>
                                                                <p className="text-xs font-bold text-indigo-600 bg-indigo-50 inline-block px-1.5 py-0.5 rounded mt-0.5">Qty: {i.quantity}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-gray-100 pl-3">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Actions</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {order.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleOrderAction(order._id, 'accept')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors flex-1">Accept</button>
                                                            <button onClick={() => handleRejectOrder(order._id)} className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-xl text-sm transition-colors border border-red-200 flex-1">Reject</button>
                                                        </>
                                                    )}
                                                    {order.status === 'processing' && (
                                                        <button onClick={() => handleOrderAction(order._id, 'ready')} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors w-full">Mark as Ready</button>
                                                    )}
                                                    {order.status === 'ready' && (
                                                        <button onClick={() => handleVerifyPickup(order._id)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors w-full flex items-center justify-center gap-2"><CheckCircle size={16}/> Verify Pickup Code</button>
                                                    )}
                                                    {order.qualityStatus === 'rejected_pending_verification' && order.status === 'under_review' && (
                                                        <>
                                                            <div className="w-full bg-red-50 p-2 rounded-lg text-red-700 text-xs font-bold mb-2 border border-red-200">
                                                                Hub rejected quality. Get Rejection Code from Hub. Penalty: ₹20
                                                            </div>
                                                            <button onClick={() => handleVerifyRejection(order._id)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-xl text-sm transition-colors flex-1">Verify Penalty</button>
                                                        </>
                                                    )}
                                                    {order.qualityStatus === 'rejected' && (order.status === 'under_review' || order.status === 'rejected') && (
                                                        <>
                                                            <div className="w-full bg-red-50 p-2 rounded-lg text-red-700 text-xs font-bold mb-2 border border-red-200">
                                                                Quality Rejected. Penalty applied.
                                                            </div>
                                                            {order.disputeStatus === 'none' && (
                                                                <button onClick={() => handleOrderAction(order._id, 'dispute_rejection')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors flex-1">Raise Dispute</button>
                                                            )}
                                                            {order.disputeStatus === 'raised' && (
                                                                <span className="text-sm font-bold text-red-600 w-full text-center">Dispute under review by Admin</span>
                                                            )}
                                                        </>
                                                    )}
                                                    {(order.status === 'completed' || order.status === 'picked_up' || order.status === 'rejected' || order.status === 'cancelled' || order.status === 'ready_at_hub' || order.status === 'out_for_delivery') && order.qualityStatus !== 'rejected' && (
                                                        <div className={`w-full text-center py-2 px-4 rounded-xl text-sm font-bold capitalize ${
                                                            order.status === 'completed' || order.status === 'picked_up' ? 'bg-green-100 text-green-800' :
                                                            order.status === 'rejected' || order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {order.status.replace(/_/g, " ")}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'messages' ? (
                        /* ================== MESSAGES TAB ================== */
                        <div className="p-0">
                            {conversations.length === 0 ? (
                                <div className="text-center py-20 text-gray-400">
                                    <MessageCircle size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>{t.noMessages}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {conversations.map((conv) => (
                                        <div key={conv._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => router.push(`/chat/${conv._id}`)}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gray-200 relative overflow-hidden border border-gray-200">
                                                    <Image src={conv.otherUser?.image || "/avatar.png"} fill alt="user" className="object-cover" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{conv.otherUser?.name || "Unknown User"}</h4>
                                                    <p className="text-sm text-gray-500 truncate max-w-[200px] md:max-w-md">{conv.lastMessage}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-[10px] text-gray-400 font-medium">{new Date(conv.lastMessageAt).toLocaleDateString()}</span>
                                                <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold flex items-center gap-2 group-hover:bg-indigo-100 transition-colors">
                                                    {t.reply} <Send size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ================== CHANNEL TAB ================== */
                        <div className="p-6">
                            
                            {/* Followers Section */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> {t.recentFollowers}</h3>
                                {followers.length === 0 ? (
                                    <p className="text-gray-400 text-sm">{t.noFollowersYet}</p>
                                ) : (
                                    <div className="flex gap-4 overflow-x-auto pb-2">
                                        {followers.map(f => (
                                            <div key={f._id} className="flex flex-col items-center gap-2 min-w-[80px]">
                                                <div className="w-12 h-12 rounded-full border border-gray-200 relative overflow-hidden">
                                                    <Image src={f.image || "/avatar.png"} fill alt={f.name} className="object-cover" />
                                                </div>
                                                <p className="text-xs text-gray-700 font-medium truncate w-full text-center">{f.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <hr className="border-gray-100 my-6" />

                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Video className="w-5 h-5 text-pink-600" /> {t.yourReels}</h3>
                            </div>

                            {reels.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                                    <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-md font-bold text-gray-800">{t.noReels}</h3>
                                    <p className="text-gray-500 mb-4 text-sm">{t.boostEngagement}</p>
                                    <button onClick={() => setShowUploadModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-purple-700">{t.uploadReel}</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {reels.map((reel) => (
                                        <div key={reel._id} className="relative group rounded-xl overflow-hidden aspect-[9/16] bg-black shadow-md border border-gray-100">
                                            <video src={reel.videoUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
                                            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md flex items-center gap-1">
                                                <TrendingUp size={12}/> {reel.views || 0}
                                            </div>
                                            <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent text-white">
                                                <p className="text-xs font-bold line-clamp-1">{reel.description}</p>
                                                {reel.product && <p className="text-[10px] text-green-300 mt-0.5">🔗 {reel.product.name}</p>}
                                            </div>
                                            <button onClick={() => handleDeleteReel(reel._id)} className="absolute top-2 left-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- REJECT MODAL --- */}
            {rejectOrderState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isHindi ? 'ऑर्डर अस्वीकार करें' : 'Reject Order'}
                            </h2>
                            <button onClick={() => setRejectOrderState({ isOpen: false, orderId: "", reason: "" })} className="text-gray-400 hover:text-gray-600">
                                <X />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">
                                {isHindi ? 'अस्वीकार करने का कारण चुनें' : 'Select a reason for rejection'}
                            </label>
                            <select 
                                className="w-full p-3 border rounded-lg"
                                value={rejectOrderState.reason}
                                onChange={(e) => setRejectOrderState(prev => ({ ...prev, reason: e.target.value }))}
                            >
                                <option value="">{isHindi ? '-- कारण चुनें --' : '-- Select a reason --'}</option>
                                <option value={isHindi ? "आउट ऑफ स्टॉक (स्टॉक उपलब्ध नहीं है)" : "Out of Stock"}>{isHindi ? "आउट ऑफ स्टॉक (स्टॉक उपलब्ध नहीं है)" : "Out of Stock"}</option>
                                <option value={isHindi ? "मैं अभी उपलब्ध नहीं हूँ" : "I am currently unavailable"}>{isHindi ? "मैं अभी उपलब्ध नहीं हूँ" : "I am currently unavailable"}</option>
                                <option value={isHindi ? "उत्पाद क्षतिग्रस्त या खराब है" : "Product is damaged or defective"}>{isHindi ? "उत्पाद क्षतिग्रस्त या खराब है" : "Product is damaged or defective"}</option>
                                <option value={isHindi ? "गलत कीमत अपडेट की गई थी" : "Incorrect price was listed"}>{isHindi ? "गलत कीमत अपडेट की गई थी" : "Incorrect price was listed"}</option>
                                <option value={isHindi ? "अन्य" : "Other"}>{isHindi ? "अन्य" : "Other"}</option>
                            </select>
                            
                            <button 
                                onClick={submitRejectOrder}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all"
                            >
                                {isHindi ? 'ऑर्डर अस्वीकार करें' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VERIFY PICKUP MODAL --- */}
            {verifyPickupState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <CheckCircle className="text-green-600 w-6 h-6" />
                                {isHindi ? 'पिकअप सत्यापित करें' : 'Verify Pickup'}
                            </h2>
                            <button onClick={() => setVerifyPickupState({ isOpen: false, orderId: "", otp: "" })} className="text-gray-400 hover:text-gray-600"><X /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                                {isHindi
                                    ? 'ग्राहक के पास एक 4-अंकीय पिकअप कोड है जो उनके ऑर्डर पेज पर दिखाई देता है। नीचे वह कोड दर्ज करें।'
                                    : 'The customer has a 4-digit pickup code shown on their order page. Enter that code below to confirm handover.'}
                            </div>
                            <input
                                type="number"
                                maxLength={4}
                                placeholder={isHindi ? 'ग्राहक का 4-अंकीय कोड' : "Customer's 4-digit code"}
                                className="w-full p-4 border-2 border-gray-200 rounded-xl text-2xl font-bold text-center tracking-widest focus:border-green-500 focus:outline-none"
                                value={verifyPickupState.otp}
                                onChange={(e) => setVerifyPickupState(prev => ({ ...prev, otp: e.target.value.slice(0, 4) }))}
                            />
                            <button
                                onClick={submitVerifyPickup}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                {isHindi ? 'पिकअप की पुष्टि करें' : 'Confirm Pickup'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- UPLOAD MODAL --- */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Video className="text-purple-600"/> {t.uploadNewReel}</h3>
                            {!uploadingReel && <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>}
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {!uploadingReel && (
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-500 transition-colors bg-gray-50 cursor-pointer relative">
                                    <input type="file" accept="video/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                                    {videoFile ? (
                                        <div className="flex flex-col items-center text-purple-600">
                                            <CheckCircle className="w-8 h-8 mb-2" />
                                            <p className="font-bold text-sm truncate w-full px-4">{videoFile.name}</p>
                                            <p className="text-xs text-gray-500">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="font-bold text-sm">{t.clickSelectVideo}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!uploadingReel && (
                                <>
                                    <textarea className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" rows={2} placeholder={t.caption} value={reelDesc} onChange={(e) => setReelDesc(e.target.value)} />
                                    <select className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                                        <option value="">{t.linkProduct}</option>
                                        {products.map(p => (<option key={p._id} value={p._id}>{p.name} (₹{p.retailPrice})</option>))}
                                    </select>
                                </>
                            )}

                            {uploadingReel && (
                                <div className="py-4 space-y-3">
                                    <div className="flex justify-between text-xs font-bold text-gray-600">
                                        <span>{t.uploading}</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                    <div className="flex items-center justify-center gap-1.5 text-xs text-purple-600 font-medium bg-purple-50 py-2 rounded-lg">
                                        <Clock size={14} />
                                        <span>{timeLeft || "Estimating..."}</span>
                                    </div>
                                </div>
                            )}

                            {!uploadingReel && (
                                <button onClick={handleReelUpload} disabled={!videoFile} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 flex justify-center items-center gap-2">
                                    <Upload className="w-5 h-5" /> {t.publishReel}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Verify Quality Rejection Modal */}
            {rejectionVerifyState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Verify Rejection</h3>
                        <p className="text-sm text-gray-600 mb-4">The hub has rejected your product quality. Please ask the Hub Delivery Boy for the Rejection Code to verify and proceed. A penalty of ₹20 will be applied.</p>
                        
                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-500 uppercase">Rejection Code</label>
                            <input 
                                type="text" 
                                className="w-full mt-1 p-3 border border-gray-300 rounded-xl font-bold tracking-widest text-center text-lg focus:ring-2 focus:ring-red-500 focus:outline-none" 
                                placeholder="----"
                                maxLength={4}
                                value={rejectionVerifyState.otp}
                                onChange={(e) => setRejectionVerifyState({ ...rejectionVerifyState, otp: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setRejectionVerifyState({ isOpen: false, orderId: "", otp: "" })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors">Cancel</button>
                            <button onClick={submitVerifyRejection} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors">Verify</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function StatCard({ icon, label, value, color }: any) {
    return (
        <div className={`p-5 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center gap-4`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>{icon}</div>
            <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wide">{label}</p><p className="text-xl font-extrabold text-gray-800">{value}</p></div>
        </div>
    )
}

export default SellerDashboard
