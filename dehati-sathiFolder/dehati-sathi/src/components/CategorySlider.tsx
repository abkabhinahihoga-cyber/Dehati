'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { RootState } from '@/redux/store'
import { BOOK_CATEGORIES, GROCERY_CATEGORIES, getCategoryImage, getCategoryLabel } from '@/lib/constants'

const BOOK_EMOJIS: Record<string, string> = {
    "LKG & UKG": "🧸",
    "Class 1 - 5": "🎒",
    "Class 6 - 8": "📓",
    "Class 9 & 11": "📐",
    "Class 10 & 12 (Board)": "🎓",
    "Graduation (B.Tech/B.Sc/BA)": "🏫",
    "Notes & Study Material": "📝",
    "Entrance Exam (JEE/NEET)": "🎯",
    "Novels & Fiction": "📖",
    "Stationary": "✏️",
    "Others": "📦"
}

function CategorySlider() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const locale = useLocale()
    const { mode } = useSelector((state: RootState) => state.mode)
    const currentCategory = searchParams.get('category') || ""
    const rawCategories = mode === 'grocery' ? GROCERY_CATEGORIES : BOOK_CATEGORIES
    const scrollRef = useRef<HTMLDivElement>(null)
    const [showLeft, setShowLeft] = useState(false)
    const [showRight, setShowRight] = useState(true)

    const handleCategoryClick = (cat: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (currentCategory === cat) params.delete('category')
        else params.set('category', cat)
        router.push(`/?${params.toString()}`)
    }

    useEffect(() => {
        const autoScroll = setInterval(() => {
            if (!scrollRef.current) return
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
            if (scrollLeft + clientWidth >= scrollWidth - 10) {
                scrollRef.current.scrollTo({ left: 0, behavior: "smooth" })
            } else {
                scrollRef.current.scrollBy({ left: 300, behavior: "smooth" })
            }
        }, 4500)
        return () => clearInterval(autoScroll)
    }, [rawCategories])

    const scroll = (direction: "left" | "right") => {
        scrollRef.current?.scrollBy({ left: direction === "left" ? -300 : 300, behavior: "smooth" })
    }

    const checkScroll = () => {
        if (!scrollRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setShowLeft(scrollLeft > 0)
        setShowRight(scrollLeft + clientWidth < scrollWidth - 5)
    }

    useEffect(() => {
        const ref = scrollRef.current
        ref?.addEventListener("scroll", checkScroll)
        checkScroll()
        return () => ref?.removeEventListener("scroll", checkScroll)
    }, [rawCategories])

    return (
        <motion.div
            className='w-[95%] md:w-[85%] mx-auto mt-10 relative group'
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
        >
            <h2 className={`text-2xl md:text-3xl font-bold mb-6 text-center ${mode === 'grocery' ? 'text-green-700' : 'text-indigo-700'}`}>
                {mode === 'grocery' ? (locale === 'hi' ? 'श्रेणी से खरीदें' : 'Shop by Category') : (locale === 'hi' ? 'कक्षा के अनुसार देखें' : 'Browse by Class')}
            </h2>

            {showLeft && (
                <button onClick={() => scroll("left")} className='absolute left-0 top-[60%] -translate-y-1/2 z-20 bg-white shadow-lg border border-gray-100 hover:bg-gray-50 rounded-full w-10 h-10 flex items-center justify-center transition-all'>
                    <ChevronLeft className={`w-6 h-6 ${mode === 'grocery' ? 'text-green-700' : 'text-indigo-700'}`} />
                </button>
            )}

            <div className='flex gap-4 overflow-x-auto px-4 pb-8 pt-2 scrollbar-hide scroll-smooth' ref={scrollRef}>
                {rawCategories.map((name, index) => {
                    const isActive = currentCategory === name
                    return (
                        <motion.button
                            key={name}
                            onClick={() => handleCategoryClick(name)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`relative min-w-[148px] md:min-w-[170px] h-[158px] overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border-2 text-left
                                ${isActive ? (mode === 'grocery' ? 'border-green-600 ring-2 ring-green-200' : 'border-indigo-600 ring-2 ring-indigo-200') : 'border-white/80'}`}
                        >
                            {mode === 'grocery' ? (
                                <Image src={getCategoryImage(name)} alt={getCategoryLabel(name, locale)} fill sizes="170px" className="object-cover" priority={index < 4} />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center text-5xl">
                                    {BOOK_EMOJIS[name] || "📦"}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="text-white text-sm font-black leading-tight drop-shadow">
                                    {mode === 'grocery' ? getCategoryLabel(name, locale) : name}
                                </p>
                            </div>
                        </motion.button>
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
