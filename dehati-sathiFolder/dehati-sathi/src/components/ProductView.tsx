'use client'
import React, { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import { Star, Minus, Plus, ShoppingCart, ShieldCheck, Zap, Upload, Book, MapPin, Share2, Check, ArrowRight, Copy, MoreHorizontal, Gift, Wallet, Phone } from 'lucide-react' 
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, decreaseQuantity, increaseQuantity } from '@/redux/cartSlice'
import { RootState } from '@/redux/store'
import { toast } from 'sonner'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import GroceryItemCard from './GroceryItemCard'
import { useSession } from 'next-auth/react' 

// 🔥 CUSTOM WHATSAPP ICON (Official Brand SVG)
const WhatsAppIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382C17.119 14.205 15.396 13.36 15.078 13.254C14.76 13.149 14.53 13.096 14.3 13.449C14.07 13.802 13.416 14.562 13.222 14.792C13.028 15.021 12.834 15.057 12.481 14.88C12.128 14.704 10.991 14.331 9.642 13.129C8.566 12.169 7.84 10.985 7.628 10.614C7.416 10.244 7.606 10.048 7.783 9.872C7.942 9.714 8.136 9.467 8.313 9.255C8.49 9.043 8.543 8.884 8.666 8.637C8.79 8.39 8.719 8.178 8.631 8.002C8.543 7.825 7.837 6.096 7.537 5.408C7.254 4.755 6.954 4.843 6.742 4.843H6.124C5.912 4.843 5.559 4.931 5.259 5.249C4.959 5.567 4.111 6.361 4.111 7.985C4.111 9.609 5.294 11.18 5.453 11.392C5.612 11.604 7.766 15.082 11.192 16.423C13.911 17.487 14.476 17.293 15.059 17.205C15.906 17.077 17.119 16.407 17.384 15.665C17.649 14.924 17.649 14.288 17.578 14.165C17.508 14.041 17.278 13.971 16.925 13.794H17.472V14.382ZM12.009 21.821H12.004C10.223 21.821 8.566 21.362 7.128 20.47L6.786 20.268L3 21.261L4.01 17.567L3.792 17.22C2.821 15.679 2.309 13.896 2.309 12.062C2.309 6.708 6.662 2.356 12.018 2.356C14.611 2.356 17.049 3.365 18.881 5.199C20.713 7.033 21.722 9.471 21.722 12.067C21.717 17.425 17.364 21.821 12.009 21.821ZM12.009 0C5.357 0 0 5.393 0 12.067C0 14.2 0.555 16.29 1.619 18.135L0 24L5.999 22.427C7.755 23.385 9.805 24.002 12.004 24.002H12.009C18.661 24.002 24.018 18.609 24.018 11.935C24.018 8.847 22.713 5.86 20.526 3.673C18.339 1.486 15.352 0 12.009 0Z" />
    </svg>
)

function ProductView({ product, similarProducts, hubManager }: { product: any, similarProducts: any[], hubManager?: { name: string; mobile: string } | null }) {
    const dispatch = useDispatch()
    const router = useRouter()
    const { data: session } = useSession()
    
    const { latitude: userLat, longitude: userLng } = useSelector((state: RootState) => state.location);
    const cartItem = useSelector((state: RootState) => state.cart.cartData.find((i) => i._id === product._id))
    
    const [mainImage, setMainImage] = useState(product.images?.[0] || "/placeholder.png")
    const isBook = product.productType === 'book'
    const [isWholesale, setIsWholesale] = useState(!isBook) 
    const [reviewsList, setReviewsList] = useState(product.reviews || []) 
    const [displayRating, setDisplayRating] = useState(product.averageRating || 0)
    const [displayCount, setDisplayCount] = useState(product.numReviews || 0)
    
    // Review States
    const [reviewRating, setReviewRating] = useState(5)
    const [reviewComment, setReviewComment] = useState("")
    const [reviewImages, setReviewImages] = useState<File[]>([])
    const [reviewPreviews, setReviewPreviews] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)

    // Share State
    const [showShareMenu, setShowShareMenu] = useState(false);
    const shareMenuRef = useRef<HTMLDivElement>(null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [walletApplied, setWalletApplied] = useState(false);
    const walletDiscount = Math.min(5, walletBalance);

    useEffect(() => {
        // Fetch wallet balance
        axios.get('/api/user/referral').then(res => {
            if (res.data.walletBalance !== undefined) setWalletBalance(res.data.walletBalance);
        }).catch(() => {});
    }, [session?.user?.id]);

    // Close share menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setShowShareMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if(product) {
            setReviewsList(product.reviews || [])
            setDisplayRating(product.averageRating || 0)
            setDisplayCount(product.numReviews || 0)
            setMainImage(product.images?.[0] || "/placeholder.png")
            if (product.productType === 'book') setIsWholesale(false);
        }
    }, [product]) 

    const distance = useMemo(() => {
        if (!userLat || !userLng || !product.location?.coordinates) return null;
        const [prodLng, prodLat] = product.location.coordinates;
        const R = 6371; 
        const dLat = (prodLat - userLat) * (Math.PI / 180);
        const dLon = (prodLng - userLng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(userLat * (Math.PI / 180)) * Math.cos(prodLat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; 
        return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)} km`;
    }, [userLat, userLng, product.location]);

    const activePrice = isBook ? product.retailPrice : (isWholesale ? product.wholesalePrice : product.retailPrice)
    const originalPrice = product.bookDetails?.printedPrice 
        ? Number(product.bookDetails.printedPrice) 
        : Math.round(activePrice * 1.4);
    const discountPercentage = Math.round(((originalPrice - activePrice) / originalPrice) * 100);

    const getSellerType = (): 'hub' | 'seller' => {
        const sellerData = product.seller;
        if (sellerData && typeof sellerData === 'object') {
            if (sellerData.role === 'hub' || sellerData.role === 'admin') {
                return 'hub';
            }
        }
        return 'seller';
    };

    const isHubProduct = getSellerType() === 'hub';

    // --- 🔗 SOCIAL SHARE LOGIC ---
    const getShareContent = () => {
        const shopName = isHubProduct ? "Dehati Hub" : (product.seller?.sellerDetails?.shopName || "Local Seller");
        const shareText = `✨ *Dehati Sathi Deal!* ✨\n\n📦 *${product.name}*\n💰 Offer Price: *₹${activePrice}* (MRP: ~₹${originalPrice}~)\n🔥 *${discountPercentage}% OFF* ⚡\n\n📍 Sold by: ${shopName}\n\n👇 *Buy Now:* ${window.location.href}`;
        return shareText;
    }

    const shareToWhatsapp = () => {
        const text = encodeURIComponent(getShareContent());
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
        setShowShareMenu(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getShareContent());
        toast.success("Link copied to clipboard!");
        setShowShareMenu(false);
    };

    const nativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ text: getShareContent() });
            } catch (err) { console.log('Share canceled'); }
        } else {
            toast.error("System share not supported on this device.");
        }
        setShowShareMenu(false);
    };

    const handleAddToCart = () => {
        const qty = isBook ? 1 : (isWholesale ? 3 : 1)
        dispatch(addToCart({ 
            ...product, 
            quantity: qty, 
            price: activePrice,
            sellerType: getSellerType() 
        }))
        toast.success("Added to Cart")
    }

    const handleBuyNow = () => {
        if(!cartItem) {
            const qty = isBook ? 1 : (isWholesale ? 3 : 1)
            dispatch(addToCart({ 
                ...product, 
                quantity: qty, 
                price: activePrice,
                sellerType: getSellerType() 
            }))
        }
        router.push('/user/checkout')
    }

    const handleWhatsAppOrder = () => {
        // Always contact hub manager first, fall back to seller
        const contact = hubManager?.mobile || product.seller?.mobile;
        const contactName = hubManager?.name || product.seller?.name || 'Seller';
        if (!contact) {
            toast.error("Hub manager contact not available");
            return;
        }
        const productUrl = window.location.href;
        const imageUrl = product.images?.[0] || '';
        const text = encodeURIComponent(
            `नमस्ते ${contactName} जी! 🙏\n\nमैं यह सामान ऑर्डर करना चाहता हूँ:\n\n` +
            `📦 *${product.name}*\n` +
            `💰 कीमत: ₹${activePrice}\n` +
            `🔗 लिंक: ${productUrl}\n` +
            (imageUrl ? `🖼️ फोटो: ${imageUrl}\n` : '') +
            `\nकृपया उपलब्धता और डिलीवरी की जानकारी दें।`
        );
        window.open(`https://wa.me/91${contact.replace(/\D/g, '').slice(-10)}?text=${text}`, '_blank');
    }

    const handlePhoneOrder = () => {
        const contact = hubManager?.mobile || product.seller?.mobile;
        if (!contact) {
            toast.error("Hub manager contact not available");
            return;
        }
        window.open(`tel:${contact}`, '_self');
    }

    const handleReviewImage = (e: React.ChangeEvent<HTMLInputElement>) => {
       if(e.target.files) {
           const files = Array.from(e.target.files)
           setReviewImages([...reviewImages, ...files])
           const newPreviews = files.map(f => URL.createObjectURL(f))
           setReviewPreviews([...reviewPreviews, ...newPreviews])
       }
    }

    const submitReview = async () => {
       if(!reviewComment) return toast.error("Please write a comment")
       if(!session) return toast.error("Please login first")
       setSubmitting(true)
       try {
           const formData = new FormData()
           formData.append("productId", product._id)
           formData.append("rating", String(reviewRating))
           formData.append("comment", reviewComment)
           reviewImages.forEach(file => formData.append("images", file))
           const res = await axios.post('/api/product/review', formData, { headers: { 'Content-Type': 'multipart/form-data' }})
           if(res.data.success) {
               toast.success("Review Submitted!")
               const newReview = { name: session?.user?.name || "You", rating: reviewRating, comment: reviewComment, createdAt: new Date().toISOString(), images: reviewPreviews }
               setReviewsList((prev: any) => [newReview, ...prev])
               setDisplayCount(displayCount + 1)
               setReviewComment(""); setReviewImages([]); setReviewPreviews([]); setReviewRating(5);
               router.refresh()
           }
       } catch (error: any) { toast.error(error.response?.data?.message || "Failed to submit") } 
       finally { setSubmitting(false) }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Images */}
            <div className="lg:col-span-5 space-y-4">
                <div className="relative aspect-[4/5] bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <Image src={mainImage} fill alt={product.name} className="object-contain p-6" />
                    {isBook && product.bookDetails?.condition && (
                        <div className='absolute top-4 left-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md'>
                            {product.bookDetails.condition} Condition
                        </div>
                    )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {product.images?.map((img: string, i: number) => (
                        <div key={i} onClick={() => setMainImage(img)} className={`relative w-20 h-20 rounded-lg border-2 cursor-pointer flex-shrink-0 bg-white ${mainImage === img ? 'border-green-600' : 'border-gray-200'}`}>
                            <Image src={img} fill alt="thumb" className="object-cover rounded-md" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Details */}
            <div className="lg:col-span-7 space-y-6">
                <div>
                    <div className='flex justify-between items-start relative'>
                        <div className='flex items-center gap-2 mb-2'>
                            <span className={`font-bold text-xs uppercase tracking-wider px-2 py-0.5 rounded ${isBook ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                                {product.category}
                            </span>
                            {isBook && <span className='text-xs text-gray-500'>• {product.bookDetails?.type === 'notes' ? 'Handwritten Notes' : 'Printed Book'}</span>}
                        </div>
                        
                        {/* 🔗 CUSTOM SHARE MENU */}
                        <div className="relative" ref={shareMenuRef}>
                            <button 
                                onClick={() => setShowShareMenu(!showShareMenu)}
                                className="p-2 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 rounded-full text-gray-600 transition-all active:scale-95"
                                title="Share"
                            >
                                <Share2 size={20} />
                            </button>

                            {/* Dropdown Popup */}
                            {showShareMenu && (
                                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                                    <div className="p-1">
                                        <button onClick={shareToWhatsapp} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors">
                                            {/* 🔥 Using Custom SVG for Brand Accuracy */}
                                            <WhatsAppIcon className="text-green-500" /> WhatsApp
                                        </button>
                                        <button onClick={copyToClipboard} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                            <Copy size={18} className="text-gray-500" /> Copy Link
                                        </button>
                                        <button onClick={nativeShare} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                            <MoreHorizontal size={18} className="text-blue-500" /> More Options
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1 pr-10">{product.name}</h1>
                    
                    {isBook && product.bookDetails?.author && (
                        <p className='text-gray-500 text-sm mt-1 font-medium'>
                            by <span className='text-gray-800'>{product.bookDetails.author}</span>
                            {product.bookDetails.publication && <span> • {product.bookDetails.publication}</span>}
                        </p>
                    )}

                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} fill={i < Math.round(displayRating) ? "currentColor" : "none"} className={i < Math.round(displayRating) ? "" : "text-gray-300"} />
                                ))}
                            </div>
                            <span className="text-sm text-gray-500">({displayCount} Reviews)</span>
                        </div>

                        {distance && (
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-xs font-bold text-gray-600">
                                <MapPin size={14} className="text-gray-500" />
                                <span>{distance} away</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    {!isBook && (
                        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                            <button onClick={() => setIsWholesale(true)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isWholesale ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}>Wholesale (3+ units)</button>
                            <button onClick={() => setIsWholesale(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isWholesale ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>Retail (1-2 units)</button>
                        </div>
                    )}
                    
                    <div className="flex items-end gap-3 mb-6">
                        <span className={`text-4xl font-extrabold ${isBook ? 'text-indigo-700' : 'text-green-700'}`}>₹{activePrice}</span>
                        <span className="text-gray-400 line-through mb-1.5 text-lg">₹{originalPrice}</span>
                        <span className='mb-2 text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded'>{discountPercentage}% OFF</span>
                        {!isBook && <span className="text-sm text-gray-500 mb-1.5 ml-auto">Stock: {product.stock} {product.unit}</span>}
                    </div>

                    {/* ✨ CART CONTROLS */}
                    {product.stock !== undefined && product.stock <= 0 ? (
                        <div className="p-5 rounded-2xl border bg-red-50 border-red-200 flex items-center justify-center shadow-sm">
                            <span className="font-bold text-red-600 text-lg flex items-center gap-2"><ShieldCheck size={20}/> Out of Stock</span>
                        </div>
                    ) : cartItem ? (
                        <div className={`p-5 rounded-2xl border shadow-sm transition-all ${isBook ? 'bg-indigo-50 border-indigo-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <Check size={18} className={isBook ? 'text-indigo-600' : 'text-green-600'} />
                                    <span className={`font-bold ${isBook ? 'text-indigo-800' : 'text-green-800'}`}>Added to Cart</span>
                                </div>
                                <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-100 p-1">
                                    <button onClick={() => dispatch(decreaseQuantity(product._id))} className="p-2 hover:bg-gray-100 rounded-md transition-colors"><Minus size={16}/></button>
                                    <span className="w-8 text-center font-bold text-gray-800">{cartItem.quantity}</span>
                                    <button onClick={() => dispatch(increaseQuantity(product._id))} className="p-2 hover:bg-gray-100 rounded-md transition-colors"><Plus size={16}/></button>
                                </div>
                            </div>
                            <button onClick={() => router.push('/user/cart')} className={`w-full py-3 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${isBook ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'}`}>
                                Proceed to Cart <ArrowRight size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <button onClick={handleAddToCart} className={`flex-1 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 ${isBook ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}>
                                <ShoppingCart size={20} /> Add to Cart
                            </button>
                            <button onClick={handleBuyNow} className={`flex-1 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${isBook ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}>
                                <Zap size={20} /> Buy Now
                            </button>
                        </div>
                    )}

                    {/* 📞 DIRECT ORDER BUTTONS */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <button onClick={handleWhatsAppOrder} className="flex-1 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#128C7E] shadow-sm">
                            <WhatsAppIcon size={20} className="text-white" /> Order via WhatsApp
                        </button>
                        <button onClick={handlePhoneOrder} className="flex-1 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 bg-blue-100 text-blue-800 hover:bg-blue-200 shadow-sm">
                            <Phone size={20} /> Call to Order
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-50 p-5 rounded-xl">
                        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Book size={18}/> Description</h3>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description || "No description provided."}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl bg-white">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><ShieldCheck size={20}/></div>
                        {isHubProduct ? (
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Sold By (Hub)</p>
                                <p className="font-semibold text-gray-900">Dehati Hub</p>
                                <p className="text-xs text-gray-500">Hub Manager: {hubManager?.name || product.seller?.name || "Hub Manager"}</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Sold By (Seller)</p>
                                <p className="font-semibold text-gray-900">{product.seller?.sellerDetails?.shopName || "Local Shop"}</p>
                                <p className="text-xs text-gray-500">Hub Contact: {hubManager?.name || product.seller?.name || "Verified Seller"}</p>
                            </div>
                        )}
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* 🎁 REFER & EARN BANNER */}
                <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-5 shadow-lg">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
                    <div className="absolute -right-2 bottom-0 w-20 h-20 bg-white/10 rounded-full" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                            <Gift className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-bold text-sm">रेफर किए गए प्रत्येक मित्र के लिए ₹10 कमाएं! 🎉</p>
                            <p className="text-white/80 text-xs mt-0.5">अपना कोड शेयर करें। उन्हें ₹20 मिलते हैं। आपको ₹10 मिलते हैं।</p>
                        </div>
                        <button
                            onClick={() => router.push('/refer-earn')}
                            className="bg-white text-green-700 font-bold text-xs px-3 py-2 rounded-xl shrink-0 hover:bg-green-50 transition-all active:scale-95 shadow-sm"
                        >
                            Refer Now
                        </button>
                    </div>
                </div>

                {/* 💰 WALLET COUPON */}
                {walletBalance > 0 && (
                    <div className={`border-2 rounded-2xl p-4 transition-all ${ walletApplied ? 'border-green-400 bg-green-50' : 'border-dashed border-green-300 bg-white' }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Wallet className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">Wallet Balance: ₹{walletBalance}</p>
                                    <p className="text-gray-500 text-xs">
                                        {walletApplied ? `₹${walletDiscount} discount will be applied at checkout` : `Apply ₹${walletDiscount} off at checkout`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                const next = !walletApplied;
                                setWalletApplied(next);
                                if (typeof window !== 'undefined') {
                                    localStorage.setItem('applyWalletAtCheckout', next ? 'true' : 'false');
                                }
                            }}
                                className={`font-bold text-xs px-4 py-2 rounded-xl transition-all ${ walletApplied ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200' }`}
                            >
                                {walletApplied ? '✓ Applied' : 'Apply'}
                            </button>
                        </div>
                        {walletApplied && (
                            <div className="mt-3 text-xs text-green-700 bg-green-100 px-3 py-2 rounded-lg font-medium">
                                💡 ₹{walletDiscount} will be deducted from your wallet automatically at checkout!
                            </div>
                        )}
                    </div>
                )}

                <hr className="border-gray-200" />

                {/* Reviews Section */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Customer Reviews</h3>
                    <div className="bg-white border border-gray-200 p-5 rounded-xl mb-8 shadow-sm">
                        <p className="text-sm font-bold text-gray-700 mb-3">Rate this product</p>
                        <div className="flex gap-1 mb-4">
                            {[1,2,3,4,5].map((star) => (
                                <Star key={star} size={28} className={`cursor-pointer ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} onClick={() => setReviewRating(star)} />
                            ))}
                        </div>
                        <textarea className="w-full p-3 border border-gray-200 rounded-xl text-sm mb-3 outline-none focus:ring-2 focus:ring-green-500" placeholder="Write your review..." rows={3} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                        <div className='flex gap-2 mb-4 overflow-x-auto'>
                            <label className='w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 text-gray-400 hover:text-green-600'>
                                <Upload size={20} />
                                <input type="file" multiple accept="image/*" hidden onChange={handleReviewImage} />
                            </label>
                            {reviewPreviews.map((src, i) => (
                                <div key={i} className='relative w-16 h-16 flex-shrink-0'><Image src={src} fill alt="preview" className='object-cover rounded-lg' /></div>
                            ))}
                        </div>
                        <button onClick={submitReview} disabled={submitting} className="bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50">
                            {submitting ? "Posting..." : "Post Review"}
                        </button>
                    </div>

                    <div className="space-y-6">
                        {reviewsList.length === 0 && <p className="text-gray-500 italic">No reviews yet.</p>}
                        {reviewsList.slice().reverse().map((rev: any, index: number) => (
                            <div key={index} className="border-b border-gray-100 pb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold">{rev.name ? rev.name[0] : "U"}</div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{rev.name}</p>
                                            <div className="flex text-yellow-400 text-[10px]">
                                                {[...Array(5)].map((_, i) => (<Star key={i} size={10} fill={i < rev.rating ? "currentColor" : "none"} className={i < rev.rating ? "" : "text-gray-300"} />))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400" suppressHydrationWarning>
                                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : "Just now"}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">{rev.comment}</p>
                                {rev.images && rev.images.length > 0 && (
                                    <div className='flex gap-2 overflow-x-auto'>
                                        {rev.images.map((img: string, i: number) => (
                                            <div key={i} className='relative w-20 h-20 flex-shrink-0'><Image src={img} fill alt="review pic" className='object-cover rounded-lg border' /></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-12 mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Similar Products</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {similarProducts.map((item: any) => (
                        <GroceryItemCard key={item._id} item={item} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ProductView