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
        <div className="min-h-screen w-full relative font-sans bg-[#FAF7F2] overflow-x-hidden flex flex-col justify-start">
            
            {/* Image Container - scales proportionally without cropping */}
            <div className="w-full flex-none max-w-lg mx-auto">
                <Image
                    src="/farmer-bg.png"
                    width={1080}
                    height={1920}
                    alt="Dehati Sathi"
                    className="w-full h-auto object-contain object-top"
                    priority
                    unoptimized
                />
            </div>

            {/* Bottom Floating Action Card - Expands to fill remaining screen if any */}
            <div className="relative z-10 w-full bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.08)] px-6 pb-12 pt-8 border-t border-white shadow-t-xl -mt-6 flex-1 flex flex-col">
                <div className="max-w-sm mx-auto w-full">
                    {/* Language Switcher */}
                    <div
                        className="flex items-center bg-gray-50 border border-gray-200/80 rounded-full p-1.5 w-full shadow-inner mb-5 relative"
                        style={{ height: '52px' }}
                    >
                        {/* Sliding indicator */}
                        <div
                            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#0C6A35] rounded-full transition-transform duration-300 ease-in-out shadow-sm ${
                                currentLocale === 'en' ? 'translate-x-[calc(100%+6px)]' : 'translate-x-[6px]'
                            }`}
                        />
                        <button
                            onClick={() => handleLanguageChange('hi')}
                            className={`flex-1 text-[15px] font-bold z-10 transition-colors duration-200 ${
                                currentLocale === 'hi' ? 'text-white' : 'text-gray-600'
                            }`}
                        >
                            हिंदी
                        </button>
                        <button
                            onClick={() => handleLanguageChange('en')}
                            className={`flex-1 text-[15px] font-bold z-10 transition-colors duration-200 ${
                                currentLocale === 'en' ? 'text-white' : 'text-gray-600'
                            }`}
                        >
                            English
                        </button>
                    </div>

                    {/* Get Started Button */}
                    <button
                        onClick={handleGetStarted}
                        disabled={isTransitioning}
                        className="w-full bg-[#0C6A35] hover:bg-[#095228] active:scale-[0.98] text-white py-4 rounded-2xl font-bold text-lg shadow-[0_8px_20px_rgba(12,106,53,0.3)] flex items-center justify-center gap-2 transition-all duration-200"
                    >
                        {currentLocale === 'en' ? 'Get Started →' : 'शुरू करें / Get Started →'}
                    </button>
                </div>
            </div>
            
        </div>
    );
}
