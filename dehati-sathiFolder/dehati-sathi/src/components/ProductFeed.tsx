'use client'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import GroceryItemCard from './GroceryItemCard'
import HorizontalRail from './HorizontalRail'
import CountdownTimer from './CountdownTimer' // Ensure this exists
import { BookOpen, Store, MapPinOff, Loader2, SearchX, Filter, RefreshCw, X, Sparkles, Compass, Flame, TrendingUp, Tag, Frown, Zap } from 'lucide-react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { GROCERY_CATEGORIES, BOOK_CATEGORIES, HUB_GROCERY_CATEGORIES } from '@/lib/constants'

interface ProductFeedProps {
    searchProducts?: any[]; 
    isSearch?: boolean;     
}

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'distance_asc' | 'discount_desc';

export default function ProductFeed({ searchProducts = [], isSearch = false }: ProductFeedProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeCategory = searchParams.get('category') || "";

    const { mode } = useSelector((state: RootState) => state.mode)
    const { latitude, longitude, permissionGranted } = useSelector((state: RootState) => state.location)
    const { data: session } = useSession()
    const hasConnectedHub = !!(session?.user as any)?.connectedHub;
    
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)
    
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const observer = useRef<IntersectionObserver | null>(null)

    const [sort, setSort] = useState<SortOption>('relevance')
    const [showFilters, setShowFilters] = useState(false)
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
    const [minRating, setMinRating] = useState(0)
    const [minDiscount, setMinDiscount] = useState(0) 
    const [refreshKey, setRefreshKey] = useState(0); 

    const RADIUS_KM = 5; 
    const isGrocery = mode === 'grocery';
    const filterCategories = isGrocery ? GROCERY_CATEGORIES : BOOK_CATEGORIES;

    // Rails State
    const [rails, setRails] = useState<{ 
        deals: any[], 
        trending: any[], 
        under99: any[], 
        budgetPriceCap: number 
    }>({ 
        deals: [], 
        trending: [], 
        under99: [], 
        budgetPriceCap: isGrocery ? 49 : 99 
    })
    const [railsLoading, setRailsLoading] = useState(true)

    // 1. RESET FEED
    useEffect(() => {
        if (isSearch) return;
        setLoading(true); 
        setPage(1);
        setHasMore(true);
    }, [mode, sort, priceRange, minRating, activeCategory, minDiscount, isSearch, refreshKey]);

    // 2. FETCH RAILS
    useEffect(() => {
        if (isSearch || activeCategory) return; 

        const fetchRails = async () => {
            setRailsLoading(true);
            try {
                const res = await axios.get(`/api/products/rails?lat=${latitude}&lng=${longitude}&mode=${mode}`);
                if (res.data.success) {
                    setRails(res.data.data);
                }
            } catch (e) { console.error("Rails Error", e) }
            finally { setRailsLoading(false) }
        }
        fetchRails();
    }, [latitude, longitude, hasConnectedHub, isSearch, activeCategory, mode]); 

    // 3. FETCH DATA
    useEffect(() => {
        if (isSearch) return;

        const fetchFeed = async () => {
            if (page === 1 && products.length === 0) setLoading(true);

            try {
                const params = new URLSearchParams({
                    lat: (latitude || 0).toString(),
                    lng: (longitude || 0).toString(),
                    mode: mode,
                    radius: RADIUS_KM.toString(),
                    sort: sort,
                    minPrice: priceRange.min.toString(),
                    maxPrice: priceRange.max.toString(),
                    minRating: minRating.toString(),
                    category: activeCategory, 
                    minDiscount: minDiscount.toString(),
                    page: page.toString() 
                });

                if (isRefetching) params.append('refresh', 'true');

                const res = await axios.get(`/api/products/feed?${params.toString()}`);
                
                if (res.data.success) {
                    setProducts(prev => page === 1 ? res.data.products : [...prev, ...res.data.products]);
                    setHasMore(res.data.hasMore);
                }
            } catch (error) { console.error("Feed Error", error); } 
            finally { setLoading(false); setIsRefetching(false); }
        };

        if (permissionGranted || hasConnectedHub || (!latitude && !longitude)) {
            const timeoutId = setTimeout(() => fetchFeed(), 50);
            return () => clearTimeout(timeoutId);
        }
    }, [latitude, longitude, hasConnectedHub, mode, permissionGranted, isSearch, sort, priceRange, minRating, activeCategory, minDiscount, page, refreshKey]); 

    // Helpers
    const handleRefresh = () => { if (!latitude || !longitude || isRefetching) return; setIsRefetching(true); setProducts([]); setPage(1); setRefreshKey(prev => prev + 1); };
    const updateCategory = (cat: string) => { const params = new URLSearchParams(searchParams.toString()); if (cat === "") params.delete('category'); else params.set('category', cat); router.push(`/?${params.toString()}`); };
    const lastElementRef = useCallback((node: HTMLDivElement) => { if (loading || isRefetching || isSearch) return; if (observer.current) observer.current.disconnect(); observer.current = new IntersectionObserver(entries => { if (entries[0].isIntersecting && hasMore) setPage(prev => prev + 1); }); if (node) observer.current.observe(node); }, [loading, isRefetching, hasMore, isSearch]);

    const displayProducts = isSearch ? searchProducts : products;
    const aiRecommendations = displayProducts.filter(p => p.isAiRecommendation);
    const standardFeed = displayProducts.filter(p => !p.isAiRecommendation);

    // For new users with no location, we still render the feed and let it load with fallback coords

    return (
        <div className="w-full md:w-[90%] lg:w-[85%] mx-auto mt-4 md:mt-6 pb-24 px-4 md:px-0">
             
             {/* HEADER */}
             <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-end justify-between">
                    <div className="flex items-center gap-2">
                        {isGrocery ? <Store className="text-green-700 w-6 h-6"/> : <BookOpen className="text-indigo-600 w-6 h-6"/>}
                        <div>
                            <h2 className={`text-xl md:text-2xl font-bold ${isGrocery ? 'text-green-800' : 'text-indigo-800'}`}>
                                {isSearch ? 'Search Results' : (activeCategory ? activeCategory : (isGrocery ? 'Daily Essentials' : 'Student Library'))}
                            </h2>
                            {!isSearch && <p className='text-[10px] md:text-xs text-gray-400 font-medium'>{RADIUS_KM}km Radius • {isGrocery ? 'Farm Fresh' : 'Study Material'}</p>}
                        </div>
                    </div>
                    {!isSearch && (
                        <div className="flex items-center gap-2">
                             <button onClick={handleRefresh} disabled={isRefetching} className={`p-2 bg-white rounded-full border shadow-sm transition-all active:scale-95 ${isRefetching ? 'text-green-600 border-green-500' : 'text-gray-500 border-gray-200 hover:border-green-400 hover:text-green-600'}`}>
                                <RefreshCw size={18} className={isRefetching ? "animate-spin" : ""} />
                            </button>
                            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs font-bold border transition-all ${showFilters ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:border-gray-400'}`}>
                                <Filter size={14} /> <span className="hidden md:inline">Filters</span> {minDiscount > 0 || activeCategory ? '•' : ''}
                            </button>
                        </div>
                    )}
                </div>

                {/* CATEGORY CHIPS */}
                {!isSearch && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        <button onClick={() => updateCategory("")} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${activeCategory === "" ? (isGrocery ? 'bg-green-100 text-green-700 border-green-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200') : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>All</button>
                        {filterCategories.map(cat => (
                            <button key={cat} onClick={() => updateCategory(cat === activeCategory ? "" : cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${activeCategory === cat ? (isGrocery ? 'bg-green-600 text-white border-green-600' : 'bg-indigo-600 text-white border-indigo-600') : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{cat}</button>
                        ))}
                    </div>
                )}
            </div>

            {/* FILTER PANEL */}
            <AnimatePresence>
                {showFilters && !isSearch && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                             <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort By</span>
                                    <div className="flex flex-wrap gap-2">
                                        {[{ label: '🔥 Relevance', value: 'relevance' }, { label: '📍 Nearest', value: 'distance_asc' }, { label: '🏷️ Best Discount', value: 'discount_desc' }, { label: '⭐ Top Rated', value: 'rating' }, { label: '🆕 Newest', value: 'newest' }, { label: '💰 Price: Low to High', value: 'price_asc' }].map((opt) => (
                                            <button key={opt.value} onClick={() => setSort(opt.value as SortOption)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${sort === opt.value ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{opt.label}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100 w-full"></div>
                                <div className="flex flex-wrap gap-8">
                                    <div className="flex flex-col gap-2 min-w-[150px]">
                                        <div className="flex justify-between"><span className="text-xs font-bold text-gray-600">Max Price</span><span className="text-xs font-bold text-green-600">₹{priceRange.max}</span></div>
                                        <input type="range" min="0" max="5000" step="100" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })} className="w-full accent-green-600 h-1 bg-gray-200 rounded-lg cursor-pointer" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-xs font-bold text-gray-600">Min Discount</span>
                                        <div className="flex gap-2">
                                            {[10, 20, 30, 50].map((d) => (
                                                <button key={d} onClick={() => setMinDiscount(minDiscount === d ? 0 : d)} className={`px-3 py-1 rounded-md text-xs font-bold border transition-all ${minDiscount === d ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{d}%+ Off</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-2">
                                    <button onClick={() => { setSort('relevance'); setPriceRange({min:0, max:10000}); setMinRating(0); updateCategory(""); setMinDiscount(0); }} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1">
                                        <X size={12} /> Clear All Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

           {/* 🚀 1. SUGGESTED FOR YOU */}
{!isSearch && !activeCategory && aiRecommendations.length > 0 && (
    <HorizontalRail 
        title="Suggested for You" 
        subtitle="Based on your recent orders" 
        products={aiRecommendations} 
        icon={Sparkles} 
        colorClass={isGrocery ? 'bg-green-50 border-green-100' : 'bg-indigo-50 border-indigo-100'}
        iconColorClass={isGrocery ? 'text-green-600' : 'text-indigo-600'}
        showCardTimer={true} // 👈 THIS MUST BE PRESENT
    />
)}

            {/* 🚀 2. HORIZONTAL RAILS */}
            {!isSearch && !activeCategory && !railsLoading && (
                <>
                    {/* A. FLASH SALE (With Header Timer) */}
                    {rails.deals.length > 0 && (
                        <div className="mb-8">
                            <div className="rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden border bg-gradient-to-r from-red-50 to-orange-50 border-red-100">
                                {/* 🔥 Header with Timer */}
                                <div className="flex flex-wrap items-center justify-between mb-4 relative z-10 gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg shadow-sm bg-white border border-red-100">
                                            <Zap className="w-5 h-5 text-red-600 fill-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 leading-none italic">FLASH SALE</h3>
                                            <p className="text-[11px] font-bold mt-1 text-red-600">Prices drop for next 4 hours!</p>
                                        </div>
                                    </div>
                                    <CountdownTimer />
                                </div>
                                
                                {/* Products */}
                                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 relative z-10 items-stretch">
                                    {rails.deals.map((item) => (
                                        <div key={item._id} className="snap-center shrink-0 min-w-[200px] w-[200px] md:min-w-[260px] md:w-[260px]">
                                            <div className="h-full bg-white rounded-xl shadow-sm border border-opacity-50 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                                <GroceryItemCard item={item} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* B. TRENDING */}
                    {rails.trending.length > 0 ? (
                        <HorizontalRail 
                            title={isGrocery ? "Trending in Your Area" : "Most Popular Books"} 
                            subtitle="Items everyone is buying" 
                            products={rails.trending} 
                            icon={TrendingUp} 
                            colorClass="bg-blue-50 border-blue-100" 
                            iconColorClass="text-blue-500" 
                        />
                    ) : (
                        <div className="mb-8 p-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center gap-3 text-gray-400">
                            <Frown className="w-6 h-6" />
                            <span className="font-medium text-sm">No trending products in your area yet.</span>
                        </div>
                    )}

                    {/* C. BUDGET STORE */}
                    {rails.under99.length > 0 && (
                        <HorizontalRail 
                            title={`Under ₹${rails.budgetPriceCap} Store`} 
                            subtitle="Budget friendly picks" 
                            products={rails.under99} 
                            icon={Tag} 
                            colorClass="bg-yellow-50 border-yellow-100" 
                            iconColorClass="text-yellow-600" 
                        />
                    )}
                </>
            )}

            {/* --- STANDARD GRID HEADER --- */}
            {standardFeed.length > 0 && !isSearch && (
                <div className="flex items-center gap-2 mb-4 mt-8">
                    <div className="p-1.5 bg-gray-100 rounded-full"><Compass className="w-5 h-5 text-gray-600" /></div>
                    <h3 className="text-lg font-bold text-gray-800">
                        {activeCategory ? `Results for ${activeCategory}` : 'Explore Nearby'}
                    </h3>
                </div>
            )}

            {/* --- STANDARD GRID --- */}
            {displayProducts.length === 0 && !loading && !isRefetching ? (
                <div className='py-20 text-center opacity-50 flex flex-col items-center'>
                    <SearchX className='w-12 h-12 mb-2' />
                    <p className='font-bold'>
                        {activeCategory ? `No items found in ${activeCategory}` : 'No items found nearby.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
                    {standardFeed.map((item: any, index: number) => {
                         if (!isSearch && standardFeed.length === index + 1) {
                            return <div ref={lastElementRef} key={item._id} className="h-full"><GroceryItemCard item={item} /></div>
                         }
                        return <div key={item._id} className="h-full"><GroceryItemCard item={item} /></div>
                    })}
                </div>
            )}
            
            {(loading || isRefetching) && displayProducts.length === 0 && <div className="w-full flex justify-center py-10"><Loader2 className='animate-spin text-gray-400 w-8 h-8' /></div>}
        </div>
    )
}
