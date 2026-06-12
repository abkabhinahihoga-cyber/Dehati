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
        <div className="min-h-screen w-full flex flex-col items-center justify-between font-sans bg-[#F9F7F2]">
            {/* Main Image Container */}
            <div className="flex-1 w-full flex flex-col justify-start relative max-w-md mx-auto">
                <div className="relative w-full h-[75vh] min-h-[500px]">
                    <Image
                        src="/farmer-bg.png"
                        fill
                        alt="Dehati Sathi Landing"
                        className="object-contain object-top"
                        priority
                        unoptimized
                    />
                </div>
            </div>

            {/* Bottom Action Card */}
            <div className="w-full max-w-sm mx-auto px-6 pb-8 pt-4 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10 -mt-10 relative">
                {/* Language Switcher */}
                <div
                    className="flex items-center bg-gray-50 border border-gray-200 rounded-full p-1.5 w-full shadow-sm mb-4 relative"
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
            </div>
        </div>
    );
}
