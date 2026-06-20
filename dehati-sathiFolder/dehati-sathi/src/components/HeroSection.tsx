'use client'
import { 
    Leaf, ShoppingBasket, Smartphone, Truck, BookOpen, 
    Apple, Carrot, GraduationCap, Pencil, ShoppingCart, Tag, ChevronRight, ChevronLeft
} from 'lucide-react'
import { AnimatePresence, motion, wrap } from 'motion/react'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { useSelector } from 'react-redux'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Mapping Icon Names to Components
const iconMap: any = {
  Leaf: <Leaf className='w-10 h-10 md:w-14 md:h-14 text-green-400 drop-shadow-md'/>,
  Truck: <Truck className='w-10 h-10 md:w-14 md:h-14 text-yellow-400 drop-shadow-md'/>,
  Smartphone: <Smartphone className='w-10 h-10 md:w-14 md:h-14 text-blue-400 drop-shadow-md'/>,
  Book: <BookOpen className='w-10 h-10 md:w-14 md:h-14 text-orange-400 drop-shadow-md'/>,
  Apple: <Apple className='w-10 h-10 md:w-14 md:h-14 text-red-400 drop-shadow-md'/>,
  Carrot: <Carrot className='w-10 h-10 md:w-14 md:h-14 text-orange-500 drop-shadow-md'/>,
  GraduationCap: <GraduationCap className='w-10 h-10 md:w-14 md:h-14 text-indigo-400 drop-shadow-md'/>,
  Pencil: <Pencil className='w-10 h-10 md:w-14 md:h-14 text-yellow-600 drop-shadow-md'/>,
  ShoppingCart: <ShoppingCart className='w-10 h-10 md:w-14 md:h-14 text-purple-400 drop-shadow-md'/>,
  Tag: <Tag className='w-10 h-10 md:w-14 md:h-14 text-pink-400 drop-shadow-md'/>
}

// Framer Motion Variants for Sliding Effect
const variants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0 })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

function HeroSection() {
    const { mode } = useSelector((state: any) => state.mode)
    const [slides, setSlides] = useState<any[]>([])
    const [[page, direction], setPage] = useState([0, 0]);
    
    // Wrap ensures the index loops correctly (0 -> 1 -> 2 -> 0)
    const slideIndex = wrap(0, slides.length, page);

    const paginate = (newDirection: number) => setPage([page + newDirection, newDirection]);

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const res = await axios.get(`/api/admin/hero-slides?mode=${mode}`)
                if(res.data.success) setSlides(res.data.slides)
            } catch (error) { console.error("Failed to load slides") }
        }
        fetchSlides()
    }, [mode])

    // Auto-play
    useEffect(() => {
        if(slides.length === 0) return;
        const timer = setInterval(() => paginate(1), 5000)
        return () => clearInterval(timer)
    }, [page, slides.length])

    const pathname = usePathname();
    const isHindi = pathname.startsWith('/hi');

    if (slides.length === 0) return (
        // 👇 Adjusted loading skeleton height & margin
        <div className="w-[96%] mx-auto mt-44 md:mt-32 h-[260px] md:h-[400px] rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 animate-pulse border border-gray-200">
            {isHindi ? `${mode === 'buyer' ? 'खरीदार' : 'विक्रेता'} ऑफ़र लोड हो रहे हैं...` : `Loading ${mode} offers...`}
        </div>
    )

    const currentSlide = slides[slideIndex];

    return (
        // 👇 MAIN CONTAINER ADJUSTMENTS
        // 1. mt-44 for mobile to push below header, md:mt-32 for desktop
        // 2. h-[260px] for mobile, h-[400px] for desktop
        <div className='relative w-[96%] mx-auto mt-44 md:mt-32 h-[260px] md:h-[400px] rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white group select-none'>
            
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                    key={page}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = swipePower(offset.x, velocity.x);
                        if (swipe < -swipeConfidenceThreshold) paginate(1);
                        else if (swipe > swipeConfidenceThreshold) paginate(-1);
                    }}
                    className='absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing'
                >
                    <Image
                        src={currentSlide.bgImage}
                        fill
                        alt={currentSlide.title}
                        priority
                        className='object-cover'
                    />
                    {/* Gradient Overlay for Text Readability */}
                    <div className='absolute inset-0 bg-black/40 md:bg-gradient-to-r md:from-black/70 md:via-black/30 md:to-transparent'/>

                    {/* 👇 CENTERED CONTENT */}
                    <div className='absolute inset-0 flex flex-col items-center justify-center text-center px-4 md:px-12'>
                        
                        <div className='bg-white/20 backdrop-blur-sm p-3 rounded-full shadow-lg mb-3 md:mb-5'>
                            {iconMap[currentSlide.iconName] || iconMap['Leaf']}
                        </div>  
                        
                        <h1 className='text-2xl md:text-5xl font-extrabold text-white drop-shadow-lg leading-tight max-w-2xl'>
                            {currentSlide.title}
                        </h1>
                        
                        <p className='text-xs md:text-lg text-gray-100 font-medium mt-2 md:mt-4 line-clamp-2 max-w-md md:max-w-xl drop-shadow-md'>
                            {currentSlide.subtitle}
                        </p>
                        
                        <Link href={currentSlide.btnUrl || '/'}>
                            <button className='mt-4 md:mt-6 bg-white text-green-700 hover:bg-green-50 px-6 py-2 md:px-8 md:py-3 rounded-full font-bold shadow-xl transition-transform transform active:scale-95 flex items-center gap-2 text-xs md:text-sm'>
                                <ShoppingBasket className='w-4 h-4 md:w-5 md:h-5'/>
                                {currentSlide.btnText}
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Arrows */}
            <button className="absolute top-1/2 left-2 md:left-4 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg z-10 opacity-70 hover:opacity-100 transition-all hidden md:block" onClick={() => paginate(-1)}>
                <ChevronLeft className="w-5 h-5 text-gray-800"/>
            </button>
            <button className="absolute top-1/2 right-2 md:right-4 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg z-10 opacity-70 hover:opacity-100 transition-all hidden md:block" onClick={() => paginate(1)}>
                <ChevronRight className="w-5 h-5 text-gray-800"/>
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {slides.map((_, index) => (
                    <button key={index} onClick={() => setPage([index, index > slideIndex ? 1 : -1])} className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${index === slideIndex ? "bg-white w-6 md:w-8" : "bg-white/40 w-2 md:w-3"}`} />
                ))}
            </div>
        </div>
    )
}

export default HeroSection