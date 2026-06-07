'use client'
import { 
    Apple, Book, Box, ChevronLeft, ChevronRight, Hand, Home, Wheat, Flower, Salad, 
    Shapes, Backpack, BookOpen, NotebookPen, GraduationCap, Scroll, Library, Milk, Search,
    Sparkles, Zap, IceCream, Coffee
} from 'lucide-react'
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useRouter, useSearchParams } from 'next/navigation'
import { RootState } from '@/redux/store'
// 👇 This import will work now because we exported GROCERY_CATEGORIES in constants.ts
import { GROCERY_CATEGORIES, BOOK_CATEGORIES } from '@/lib/constants' 

// --- 1. ICON MAPPING ---
const CATEGORY_CONFIG: any = {
    // Grocery
    "Fresh Fruits": { icon: Apple, color: "bg-red-100" },
    "Fresh Vegetables": { icon: Salad, color: "bg-green-100" },
    "Live Plants": { icon: Flower, color: "bg-emerald-100" },
    "Rice, Atta & Dals": { icon: Wheat, color: "bg-orange-100" },
    "Dairy & Breakfast": { icon: Milk, color: "bg-blue-50" },
    "Spices & Masalas": { icon: Search, color: "bg-yellow-100" },
    "HandCrafted": { icon: Hand, color: "bg-rose-100" },
    "Household Essentials": { icon: Home, color: "bg-lime-100" },
    "Snacks & Packaged Food": { icon: Box, color: "bg-amber-100" },
    "Personal Care": { icon: Sparkles, color: "bg-purple-100" },
    "Cold Drinks & Juices": { icon: Coffee, color: "bg-teal-100" },
    "Chocolates & Ice Cream": { icon: IceCream, color: "bg-pink-100" },
    
    // Student
    "LKG & UKG": { icon: Shapes, color: "bg-pink-100" },
    "Class 1 - 5": { icon: Backpack, color: "bg-blue-100" },
    "Class 6 - 8": { icon: BookOpen, color: "bg-indigo-100" },
    "Class 9 & 11": { icon: NotebookPen, color: "bg-violet-100" },
    "Class 10 & 12 (Board)": { icon: Library, color: "bg-purple-100" },
    "Graduation (B.Tech/B.Sc/BA)": { icon: GraduationCap, color: "bg-yellow-100" },
    "Textbooks": { icon: Book, color: "bg-teal-100" },
    "Notes & Study Material": { icon: Scroll, color: "bg-amber-100" },
    "Entrance Exam (JEE/NEET)": { icon: Zap, color: "bg-red-100" },
    "Novels & Fiction": { icon: BookOpen, color: "bg-pink-100" },
    "Stationary": { icon: Box, color: "bg-gray-200" },
    "Others": { icon: Box, color: "bg-gray-100" }
};

function CategorySlider() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { mode } = useSelector((state: RootState) => state.mode)
    const currentCategory = searchParams.get('category') || ""

    // Use the Combined list for the slider
    const rawCategories = mode === 'grocery' ? GROCERY_CATEGORIES : BOOK_CATEGORIES

    const categories = rawCategories.map((name, index) => ({
        id: index,
        name: name,
        ... (CATEGORY_CONFIG[name] || CATEGORY_CONFIG["Others"])
    }))

    const scrollRef = useRef<HTMLDivElement>(null)
    const [showLeft, setShowLeft] = useState(false)
    const [showRight, setShowRight] = useState(true)

    // Click Handler
    const handleCategoryClick = (cat: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (currentCategory === cat) params.delete('category')
        else params.set('category', cat)
        router.push(`/?${params.toString()}`)
    }

    // Auto Scroll
    useEffect(() => {
        const autoScroll = setInterval(() => {
            if (!scrollRef.current) return
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
            if (scrollLeft + clientWidth >= scrollWidth - 10) {
                scrollRef.current.scrollTo({ left: 0, behavior: "smooth" })
            } else {
                scrollRef.current.scrollBy({ left: 300, behavior: "smooth" })
            }
        }, 4000) 
        return () => clearInterval(autoScroll)
    }, [categories])

    // Scroll Logic
    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return
        const scrollAmount = direction === "left" ? -300 : 300
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }

    const checkScroll = () => {
        if (!scrollRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setShowLeft(scrollLeft > 0)
        setShowRight(scrollLeft + clientWidth < scrollWidth - 5)
    }

    useEffect(() => {
        const ref = scrollRef.current;
        ref?.addEventListener("scroll", checkScroll)
        checkScroll()
        return () => ref?.removeEventListener("scroll", checkScroll)
    }, [categories])

    return (
        <motion.div
            className='w-[95%] md:w-[85%] mx-auto mt-10 relative group'
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
        >
            <h2 className={`text-2xl md:text-3xl font-bold mb-6 text-center ${mode === 'grocery' ? 'text-green-700' : 'text-indigo-700'}`}>
                {mode === 'grocery' ? '🛒 Shop by Category' : '📚 Browse by Class'}
            </h2>

            {showLeft && (
                <button onClick={() => scroll("left")} className='absolute left-0 top-[60%] -translate-y-1/2 z-20 bg-white shadow-lg border border-gray-100 hover:bg-gray-50 rounded-full w-10 h-10 flex items-center justify-center transition-all'>
                    <ChevronLeft className={`w-6 h-6 ${mode === 'grocery' ? 'text-green-700' : 'text-indigo-700'}`} />
                </button>
            )}

            <div className='flex gap-6 overflow-x-auto px-4 pb-8 pt-2 scrollbar-hide scroll-smooth' ref={scrollRef}>
                {categories.map((cat) => {
                    const Icon = cat.icon
                    const isActive = currentCategory === cat.name
                    return (
                        <motion.div
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.name)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`min-w-[140px] md:min-w-[160px] h-[160px] flex flex-col items-center justify-center rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border-2
                                ${isActive 
                                    ? (mode === 'grocery' ? 'border-green-600 ring-2 ring-green-200 bg-green-50' : 'border-indigo-600 ring-2 ring-indigo-200 bg-indigo-50') 
                                    : `border-transparent ${cat.color}`
                                }`}
                        >
                            <div className='flex flex-col items-center justify-center p-4 text-center'>
                                <Icon className={`w-10 h-10 mb-3 ${isActive ? 'scale-110' : ''} ${mode === 'grocery' ? 'text-green-700' : 'text-indigo-700'}`} />
                                <p className={`text-sm font-bold leading-tight ${isActive ? 'text-black' : 'text-gray-700'}`}>
                                    {cat.name}
                                </p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {showRight && (
                <button onClick={() => scroll("right")} className='absolute right-0 top-[60%] -translate-y-1/2 z-20 bg-white shadow-lg border border-gray-100 hover:bg-gray-50 rounded-full w-10 h-10 flex items-center justify-center transition-all'>
                    <ChevronRight className={`w-6 h-6 ${mode === 'grocery' ? 'text-green-700' : 'text-indigo-700'}`} />
                </button>
            )}
        </motion.div>
    )
}

export default CategorySlider