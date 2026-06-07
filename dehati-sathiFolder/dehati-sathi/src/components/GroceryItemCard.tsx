'use client'
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from "framer-motion"
import Image from 'next/image';
import { Star, Zap, MapPin, Heart, Clock, Share2, Copy, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'sonner'; // Ensure toast is imported

// 🔥 CUSTOM WHATSAPP ICON (Official Brand SVG)
const WhatsAppIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382C17.119 14.205 15.396 13.36 15.078 13.254C14.76 13.149 14.53 13.096 14.3 13.449C14.07 13.802 13.416 14.562 13.222 14.792C13.028 15.021 12.834 15.057 12.481 14.88C12.128 14.704 10.991 14.331 9.642 13.129C8.566 12.169 7.84 10.985 7.628 10.614C7.416 10.244 7.606 10.048 7.783 9.872C7.942 9.714 8.136 9.467 8.313 9.255C8.49 9.043 8.543 8.884 8.666 8.637C8.79 8.39 8.719 8.178 8.631 8.002C8.543 7.825 7.837 6.096 7.537 5.408C7.254 4.755 6.954 4.843 6.742 4.843H6.124C5.912 4.843 5.559 4.931 5.259 5.249C4.959 5.567 4.111 6.361 4.111 7.985C4.111 9.609 5.294 11.18 5.453 11.392C5.612 11.604 7.766 15.082 11.192 16.423C13.911 17.487 14.476 17.293 15.059 17.205C15.906 17.077 17.119 16.407 17.384 15.665C17.649 14.924 17.649 14.288 17.578 14.165C17.508 14.041 17.278 13.971 16.925 13.794H17.472V14.382ZM12.009 21.821H12.004C10.223 21.821 8.566 21.362 7.128 20.47L6.786 20.268L3 21.261L4.01 17.567L3.792 17.22C2.821 15.679 2.309 13.896 2.309 12.062C2.309 6.708 6.662 2.356 12.018 2.356C14.611 2.356 17.049 3.365 18.881 5.199C20.713 7.033 21.722 9.471 21.722 12.067C21.717 17.425 17.364 21.821 12.009 21.821ZM12.009 0C5.357 0 0 5.393 0 12.067C0 14.2 0.555 16.29 1.619 18.135L0 24L5.999 22.427C7.755 23.385 9.805 24.002 12.004 24.002H12.009C18.661 24.002 24.018 18.609 24.018 11.935C24.018 8.847 22.713 5.86 20.526 3.673C18.339 1.486 15.352 0 12.009 0Z" />
    </svg>
)

interface GroceryItemCardProps {
  item: any;
  showTimer?: boolean; 
}

function GroceryItemCard({ item, showTimer = false }: GroceryItemCardProps) {
  const router = useRouter();
  const { latitude: userLat, longitude: userLng } = useSelector((state: RootState) => state.location);
  
  const isBook = item.productType === 'book';
  const [isWholesale, setIsWholesale] = useState(!isBook);
  const [isWishlisted, setIsWishlisted] = useState(false); 
  const [hasViewed, setHasViewed] = useState(false); 

  // Share State
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

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

  // --- TIMER LOGIC ---
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
      if (!showTimer || !item.saleEndTime) return;
      
      const calculateTimeLeft = () => {
          const diff = new Date(item.saleEndTime).getTime() - new Date().getTime();
          return diff > 0 ? Math.floor(diff / 1000) : 0;
      };

      setTimeLeft(calculateTimeLeft());

      const timer = setInterval(() => {
          setTimeLeft(calculateTimeLeft());
      }, 1000);
      
      return () => clearInterval(timer);
  }, [showTimer, item.saleEndTime]);

  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- ANALYTICS ---
  const trackInteraction = useCallback((type: 'view' | 'click' | 'wishlist' | 'share') => {
      if (!item._id) return;
      fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: item._id, category: item.category, type })
      }).catch(err => console.error(err));
  }, [item._id, item.category]);

  const handleImpression = () => { if (!hasViewed) { trackInteraction('view'); setHasViewed(true); } };
  
  const handleCardClick = () => {
      trackInteraction('click');
      router.push(`/product/${item._id}`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsWishlisted(!isWishlisted);
      trackInteraction('wishlist');
  };

  const handleToggle = (e: React.MouseEvent, mode: boolean) => {
      e.stopPropagation();
      setIsWholesale(mode);
  }

  const getImageSrc = (imgArray?: string[]) => {
      if (!imgArray || !Array.isArray(imgArray) || imgArray.length === 0) return "/placeholder.png";
      const firstImg = imgArray[0];
      return (firstImg.startsWith("http") || firstImg.startsWith("/")) ? firstImg : "/placeholder.png";
  }
  const validImage = getImageSrc(item.images);

  const distance = useMemo(() => {
      if (!userLat || !userLng || !item.location?.coordinates) return null;
      const [prodLng, prodLat] = item.location.coordinates;
      const R = 6371; 
      const dLat = (prodLat - userLat) * (Math.PI / 180);
      const dLon = (prodLng - userLng) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(userLat * (Math.PI / 180)) * Math.cos(prodLat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c; 
      return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)} km`;
  }, [userLat, userLng, item.location]);

  const discount = useMemo(() => {
      if (isBook && item.bookDetails?.printedPrice) {
          const mrp = Number(item.bookDetails.printedPrice);
          if (mrp > item.retailPrice) return Math.round(((mrp - item.retailPrice) / mrp) * 100);
      }
      if (item.mrpPrice && item.mrpPrice > item.retailPrice) {
          return Math.round(((item.mrpPrice - item.retailPrice) / item.mrpPrice) * 100);
      }
      return 0; 
  }, [item._id, isBook, item.bookDetails, item.retailPrice, item.mrpPrice]);

  const activePrice = isBook ? item.retailPrice : (isWholesale ? item.wholesalePrice : item.retailPrice)
  const originalPrice = isBook && item.bookDetails?.printedPrice ? item.bookDetails.printedPrice : (item.mrpPrice || activePrice);

  // --- 🔗 SOCIAL SHARE LOGIC (Ported from ProductView) ---
  const getShareContent = () => {
      const shareText = `✨ *Dehati Sathi Deal!* ✨\n\n📦 *${item.name}*\n💰 Offer Price: *₹${activePrice}* (MRP: ~₹${originalPrice}~)\n🔥 *${discount}% OFF* ⚡\n\n👇 *Buy Now:* ${window.location.origin}/product/${item._id}`;
      return shareText;
  }

  const shareToWhatsapp = (e: React.MouseEvent) => {
      e.stopPropagation();
      trackInteraction('share');
      const text = encodeURIComponent(getShareContent());
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      setShowShareMenu(false);
  };

  const copyToClipboard = (e: React.MouseEvent) => {
      e.stopPropagation();
      trackInteraction('share');
      navigator.clipboard.writeText(getShareContent());
      toast.success("Link copied!");
      setShowShareMenu(false);
  };

  const nativeShare = async (e: React.MouseEvent) => {
      e.stopPropagation();
      trackInteraction('share');
      if (navigator.share) {
          try {
              await navigator.share({ text: getShareContent() });
          } catch (err) { console.log('Share canceled'); }
      } else {
          toast.error("Share not supported");
      }
      setShowShareMenu(false);
  };

  const toggleShareMenu = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowShareMenu(!showShareMenu);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      onViewportEnter={handleImpression}
      onClick={handleCardClick}
      className={`h-full bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden relative group cursor-pointer ${isBook ? 'hover:border-indigo-200' : 'hover:border-green-200'}`}
    >
      {/* Discount Badge */}
      {discount > 0 && (
          <div className={`absolute top-3 left-3 z-10 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md flex items-center gap-1 ${isBook ? 'bg-indigo-600' : 'bg-green-600'}`}>
            <Zap size={10} fill='white'/> {discount}% OFF
          </div>
      )}

      {/* Wishlist Button */}
      <button onClick={handleWishlist} className="absolute top-3 right-3 z-20 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition active:scale-95">
        <Heart size={16} className={`transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
      </button>

      {/* Image Section */}
      <div className='relative aspect-[4/3] bg-gray-50 overflow-hidden shrink-0'>
        <Image src={validImage} fill alt={item.name} className='object-contain p-5 transition-transform duration-500 group-hover:scale-110'/>
        
        {isBook && item.bookDetails?.condition && (
            <div className='absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm uppercase tracking-wider font-bold'>
                {item.bookDetails.condition}
            </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className='p-4 flex flex-col flex-1'>
        <div className='flex justify-between items-start mb-1'>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isBook ? 'text-indigo-500' : 'text-gray-500'}`}>{item.category}</p>
            <div className='flex items-center gap-2'>
                <div className='flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-700 border border-yellow-100'>
                    {item.averageRating ? item.averageRating.toFixed(1) : "New"} 
                    <Star size={8} fill='currentColor' />
                    <span className='text-gray-400 font-normal'>({item.numReviews || 0})</span>
                </div>
            </div>
        </div>

        {/* Share & Location Row */}
        <div className="flex items-center justify-between mb-2 relative">
            {distance ? (
                <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                    <MapPin size={10} />
                    <span>{distance} away</span>
                </div>
            ) : <div></div>}
            
            {/* 🔗 CUSTOM SHARE MENU WRAPPER */}
            <div className="relative" ref={shareMenuRef}>
                <button 
                    onClick={toggleShareMenu}
                    className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 hover:text-blue-600 transition-colors"
                >
                    <Share2 size={14} />
                </button>

                {/* Dropdown Popup */}
                {showShareMenu && (
                    <div className="absolute right-0 top-8 w-44 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                        <div className="p-1">
                            <button onClick={shareToWhatsapp} className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors text-left">
                                <WhatsAppIcon className="text-green-500" size={16} /> WhatsApp
                            </button>
                            <button onClick={copyToClipboard} className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left">
                                <Copy size={16} className="text-gray-500" /> Copy Link
                            </button>
                            <button onClick={nativeShare} className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left">
                                <MoreHorizontal size={16} className="text-blue-500" /> More
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* 🔥 TIMER POSITION (Below Share) */}
        {showTimer && timeLeft !== null && (
            <div className="mb-2">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-50 border border-red-100">
                    <Clock className="w-3 h-3 text-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-red-600 tracking-wide font-mono">
                        Ends in {formatTime(timeLeft)}
                    </span>
                </div>
            </div>
        )}
        
        {/* Product Name */}
        <h3 className={`font-bold text-gray-800 line-clamp-2 text-sm md:text-base mb-1 transition-colors ${isBook ? 'group-hover:text-indigo-700' : 'group-hover:text-green-700'}`}>{item.name}</h3>

        {isBook && item.bookDetails?.author ? (
            <p className='text-xs text-gray-500 mb-3 line-clamp-1'>by {item.bookDetails.author}</p>
        ) : (
            !distance && <div className='mb-2'></div>
        )}
        
        {!isBook ? (
            <div className='flex bg-gray-100 p-1 rounded-lg mb-3 mt-auto'>
                <button onClick={(e) => handleToggle(e, true)} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${isWholesale ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Wholesale (3+)</button>
                <button onClick={(e) => handleToggle(e, false)} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${!isWholesale ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Retail (1-2)</button>
            </div>
        ) : (
            <div className="mt-auto h-2"></div>
        )}

        <div className='flex items-end gap-2 pt-2 border-t border-gray-50 mt-auto'>
          <span className={`text-lg md:text-xl font-extrabold ${isBook ? 'text-indigo-700' : 'text-green-700'}`}>₹{activePrice}</span>
          <span className='text-xs text-gray-400 line-through mb-1'>₹{originalPrice}</span>
          {!isBook && <span className='text-xs text-gray-500 mb-1 ml-auto'>per {item.unit}</span>}
        </div>
      </div>
    </motion.div>
  );
}

export default GroceryItemCard;