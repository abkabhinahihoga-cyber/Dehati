'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';

export default function LandingPage() {
    const router = useRouter();
    const currentLocale = useLocale();
    const pathname = usePathname();
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleLanguageChange = (lang: 'en' | 'hi') => {
        if (currentLocale === lang) return;
        setIsTransitioning(true);
        router.replace(pathname, { locale: lang });
        setTimeout(() => setIsTransitioning(false), 500); // Reset after transition
    };

    const handleGetStarted = () => {
        router.push('/register');
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center bg-[#FDFBF7] relative overflow-hidden font-sans">
            {/* Background Image / Illustration */}
            <div className="absolute top-0 left-0 w-full h-[65%] sm:h-[75%] z-0 pointer-events-none">
                <Image
                    src="/farmer-bg.png" // Assuming the background is available here, or fallback to placeholder
                    fill
                    alt="Farmer background"
                    className="object-cover object-bottom opacity-90"
                    priority
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#FDFBF7]/80 via-transparent to-[#FDFBF7] z-10"></div>
            </div>

            {/* Header Content */}
            <div className="relative z-20 flex flex-col items-center pt-16 px-6 text-center">
                {/* Logo Section */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-16 h-16 relative bg-white rounded-full shadow-sm p-2 flex items-center justify-center">
                        <Image src="/icon.png" width={48} height={48} alt="Logo" className="object-contain" />
                    </div>
                    <div className="flex flex-col text-left">
                        <h1 className="text-2xl font-bold text-gray-800 leading-tight">देहाती साथी</h1>
                        <h2 className="text-xl font-semibold text-green-800 tracking-wide">Dehati Sathi</h2>
                    </div>
                </div>

                {/* Subtitle Section */}
                <div className="mb-2">
                    <h3 className="text-xl font-bold text-gray-800">गाँव का उत्पाद, आपके पास</h3>
                    <p className="text-gray-600 font-medium">From our fields to your home</p>
                </div>
            </div>

            {/* Bottom Section containing Buttons */}
            <div className="relative z-20 flex flex-col items-center mt-auto w-full max-w-md px-6 pb-12 bg-white/90 backdrop-blur-md rounded-t-[40px] pt-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                
                {/* Language Switcher */}
                <div className="flex items-center justify-center bg-white border border-gray-200 rounded-full p-1.5 w-full max-w-[280px] shadow-sm mb-6 relative">
                    <div className={`absolute w-1/2 h-10 bg-green-800 rounded-full transition-transform duration-300 ease-in-out ${currentLocale === 'en' ? 'translate-x-full' : 'translate-x-0'}`}></div>
                    
                    <button 
                        onClick={() => handleLanguageChange('hi')}
                        className={`flex-1 py-2 text-sm font-bold z-10 transition-colors ${currentLocale === 'hi' ? 'text-white' : 'text-gray-600'}`}
                    >
                        हिंदी
                    </button>
                    <button 
                        onClick={() => handleLanguageChange('en')}
                        className={`flex-1 py-2 text-sm font-bold z-10 transition-colors ${currentLocale === 'en' ? 'text-white' : 'text-gray-600'}`}
                    >
                        English
                    </button>
                </div>

                {/* Get Started Button */}
                <button 
                    onClick={handleGetStarted}
                    className="w-full bg-green-800 hover:bg-green-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                >
                    {currentLocale === 'en' ? 'Get Started' : 'शुरू करें / Get Started'}
                </button>
            </div>
        </div>
    );
}
