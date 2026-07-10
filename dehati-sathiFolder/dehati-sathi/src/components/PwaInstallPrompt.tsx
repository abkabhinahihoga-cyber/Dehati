'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Download, X } from 'lucide-react';
import { useLocale } from 'next-intl';

export default function PwaInstallPrompt({ isAuthorized }: { isAuthorized: boolean }) {
    const locale = useLocale();
    const isHindi = locale === 'hi';
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(console.error);
        }

        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            
            // Expose the prompt globally so Nav can use it
            (window as any).deferredInstallPrompt = e;

            // Only show the automatic popup for unauthorized users
            if (!isAuthorized) {
                // Check if we've already shown it today to avoid spamming
                const lastShown = localStorage.getItem('installPromptShown');
                const today = new Date().toDateString();
                if (lastShown !== today) {
                    setShowPopup(true);
                    localStorage.setItem('installPromptShown', today);
                }
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [isAuthorized]);

    const handleInstallClick = async () => {
        setShowPopup(false);
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            // We've used the prompt, and can't use it again, throw it away
            setDeferredPrompt(null);
            (window as any).deferredInstallPrompt = null;
        }
    };

    if (!showPopup) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 md:p-6 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-3xl animate-slide-up">
            <div className="max-w-md mx-auto relative">
                <button 
                    onClick={() => setShowPopup(false)}
                    className="absolute -top-2 -right-2 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 shrink-0 bg-green-100 rounded-2xl flex items-center justify-center border-2 border-green-200">
                        <img src="/icon.png" alt="App Icon" className="w-10 h-10 object-contain" />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900 text-lg leading-tight">
                            {isHindi ? 'देहाती साथी ऐप डाउनलोड करें' : 'Install Dehati Sathi App'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {isHindi ? 'तेज़ अनुभव और नोटिफिकेशन्स के लिए ऐप इंस्टॉल करें।' : 'Install the app for a faster experience and notifications.'}
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={handleInstallClick}
                    className="mt-5 w-full bg-green-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-lg shadow-green-200"
                >
                    <Download className="w-5 h-5" />
                    {isHindi ? 'अभी इंस्टॉल करें (मुफ़्त)' : 'Install Now (Free)'}
                </button>
            </div>
        </div>
    );
}
