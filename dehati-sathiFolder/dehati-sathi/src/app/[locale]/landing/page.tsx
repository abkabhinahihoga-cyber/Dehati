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
        <div className="min-h-screen w-full relative font-sans bg-[#f4f7ed] overflow-hidden flex flex-col justify-start">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.9),transparent_28%),linear-gradient(160deg,#eef7df_0%,#f8efe1_52%,#e7f4ee_100%)]" />
            <div className="absolute inset-x-0 top-0 h-2/3 bg-[linear-gradient(to_bottom,rgba(10,91,45,0.12),transparent)]" />

            <div className="relative w-full flex-none max-w-xl mx-auto">
                <Image
                    src="/farmer-bg.png"
                    width={1080}
                    height={1920}
                    alt="Dehati Sathi"
                    className="w-full h-auto object-contain object-top drop-shadow-[0_28px_40px_rgba(29,78,39,0.18)] [mask-image:linear-gradient(to_bottom,black_0%,black_76%,transparent_96%)]"
                    priority
                />
                <div className="absolute left-5 top-8 rounded-full bg-white/80 backdrop-blur px-4 py-2 shadow-lg border border-white/80">
                    <p className="text-[11px] font-black text-green-800 tracking-wide">गांव की अपनी दुकान</p>
                </div>
                <div className="absolute right-5 bottom-16 rounded-2xl bg-[#123d2a]/90 text-white backdrop-blur px-4 py-3 shadow-xl border border-white/15">
                    <p className="text-[10px] font-bold text-green-100">सीधा खेत से घर तक</p>
                    <p className="text-lg font-black leading-none mt-1">देहाती साथी</p>
                </div>
            </div>

            <div className="relative z-10 w-full bg-white/90 backdrop-blur-xl rounded-t-[2rem] shadow-[0_-18px_45px_rgba(22,80,48,0.14)] px-6 pb-12 pt-7 border-t border-white/80 -mt-10 flex-1 flex flex-col">
                <div className="max-w-sm mx-auto w-full">
                    <div className="mb-5">
                        <h1 className="text-3xl font-black text-[#10351f] leading-tight">देहाती साथी</h1>
                        <p className="text-sm font-semibold text-gray-600 mt-2">गांव में ताजा सामान, मंडी भाव और भरोसेमंद डिलीवरी.</p>
                    </div>

                    <div
                        className="flex items-center bg-gray-50 border border-gray-200/80 rounded-full p-1.5 w-full shadow-inner mb-5 relative"
                        style={{ height: '52px' }}
                    >
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

                    <button
                        onClick={handleGetStarted}
                        disabled={isTransitioning}
                        className="w-full bg-[#0C6A35] hover:bg-[#095228] active:scale-[0.98] text-white py-4 rounded-2xl font-bold text-lg shadow-[0_12px_28px_rgba(12,106,53,0.32)] flex items-center justify-center gap-2 transition-all duration-200"
                    >
                        {currentLocale === 'en' ? 'Get Started' : 'शुरू करें'}
                    </button>
                </div>
            </div>
        </div>
    );
}
