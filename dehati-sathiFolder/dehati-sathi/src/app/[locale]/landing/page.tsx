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
        setTimeout(() => setIsTransitioning(false), 500);
    };

    const handleGetStarted = () => {
        router.push('/register');
    };

    return (
        <div
            className="min-h-screen w-full flex flex-col items-center justify-between font-sans"
            style={{ background: 'linear-gradient(160deg, #EEF4EE 0%, #F7F2E8 40%, #EDF4ED 100%)' }}
        >
            {/* Top spacer */}
            <div className="flex-1 flex flex-col items-center justify-center w-full px-6 py-8 max-w-sm mx-auto">
                
                {/* Logo Row */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 relative bg-white rounded-full shadow-md p-1.5 flex items-center justify-center">
                        <Image src="/icon.png" width={44} height={44} alt="Dehati Sathi Logo" className="object-contain" />
                    </div>
                    <div className="flex flex-col text-left">
                        <h1 className="text-2xl font-bold text-gray-800 leading-tight">देहाती साथी</h1>
                        <span className="text-base font-semibold text-green-700 tracking-wide">Dehati Sathi</span>
                    </div>
                </div>

                {/* Subtitle */}
                <div className="text-center mb-5">
                    <h2 className="text-xl font-bold text-gray-800">गाँव का उत्पाद, आपके पास</h2>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">From our fields to your home</p>
                </div>

                {/* Main Image Card */}
                <div
                    className="w-full rounded-3xl overflow-hidden shadow-xl relative"
                    style={{ aspectRatio: '4/5', maxHeight: '55vh' }}
                >
                    <Image
                        src="/farmer-bg.png"
                        fill
                        alt="Farmer with fresh produce"
                        className="object-cover object-top"
                        priority
                        unoptimized
                    />
                    {/* Subtle bottom fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/10 to-transparent" />
                </div>
            </div>

            {/* Bottom Action Card */}
            <div
                className="w-full max-w-sm mx-auto px-6 pb-10 pt-6"
            >
                {/* Language Switcher */}
                <div
                    className="flex items-center bg-white border border-gray-200 rounded-full p-1.5 w-full shadow-sm mb-4 relative"
                    style={{ height: '48px' }}
                >
                    {/* Sliding indicator */}
                    <div
                        className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-green-800 rounded-full transition-transform duration-300 ease-in-out ${
                            currentLocale === 'en' ? 'translate-x-[calc(100%+6px)]' : 'translate-x-[6px]'
                        }`}
                    />
                    <button
                        onClick={() => handleLanguageChange('hi')}
                        className={`flex-1 text-sm font-bold z-10 transition-colors duration-200 ${
                            currentLocale === 'hi' ? 'text-white' : 'text-gray-500'
                        }`}
                    >
                        हिंदी
                    </button>
                    <button
                        onClick={() => handleLanguageChange('en')}
                        className={`flex-1 text-sm font-bold z-10 transition-colors duration-200 ${
                            currentLocale === 'en' ? 'text-white' : 'text-gray-500'
                        }`}
                    >
                        English
                    </button>
                </div>

                {/* Get Started Button */}
                <button
                    onClick={handleGetStarted}
                    disabled={isTransitioning}
                    className="w-full bg-green-800 hover:bg-green-900 active:scale-[0.98] text-white py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-150"
                >
                    {currentLocale === 'en' ? 'Get Started →' : 'शुरू करें / Get Started →'}
                </button>

                {/* Footer hint */}
                <p className="text-center text-xs text-gray-400 mt-3">
                    {currentLocale === 'en' ? 'Fresh from your local hub · Trusted by farmers' : 'आपके नजदीकी हब से ताज़ा सामान'}
                </p>
            </div>
        </div>
    );
}
