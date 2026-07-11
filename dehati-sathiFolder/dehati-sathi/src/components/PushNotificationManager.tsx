'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, BellOff, Settings } from 'lucide-react';
import { useLocale } from 'next-intl';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// 'ask'    → show the allow/deny popup
// 'denied' → show the "go to settings" banner
// 'none'   → render nothing
type PromptState = 'ask' | 'denied' | 'none';

export default function PushNotificationManager() {
    const locale = useLocale();
    const isHi = locale === 'hi';
    const [state, setState] = useState<PromptState>('none');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Not supported (desktop Safari, old browsers)
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

        const init = async () => {
            const perm = Notification.permission;

            if (perm === 'granted') {
                // Already allowed — ensure they're subscribed in DB silently
                ensureSubscribed();
                return;
            }

            if (perm === 'denied') {
                // They turned it off in phone settings — show guide banner
                // But only once per session so it's not annoying
                const deniedBannerShown = sessionStorage.getItem('deniedBannerShown');
                if (!deniedBannerShown) {
                    setTimeout(() => setState('denied'), 3000);
                    sessionStorage.setItem('deniedBannerShown', '1');
                }
                return;
            }

            // perm === 'default' → never answered
            // Show every time the user opens the app — no artificial throttle
            // Small delay so the page loads first
            setTimeout(() => setState('ask'), 3000);
        };

        init();
    }, []);

    const ensureSubscribed = async () => {
        try {
            const reg = await navigator.serviceWorker.ready;
            const existing = await reg.pushManager.getSubscription();
            if (existing) {
                await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(existing)
                });
            }
        } catch { /* silent */ }
    };

    const handleAllow = async () => {
        setLoading(true);
        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                const reg = await navigator.serviceWorker.ready;
                const subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
                });
                await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription)
                });
                setState('none');
            } else if (permission === 'denied') {
                // They denied via browser native dialog
                setState('denied');
            } else {
                setState('none');
            }
        } catch (err) {
            console.error('Notification subscribe failed:', err);
            setState('none');
        }
        setLoading(false);
    };

    // ─── ASK POPUP ──────────────────────────────────────────────
    if (state === 'ask') {
        return (
            <>
                {/* Backdrop */}
                <div
                    className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm"
                    onClick={() => setState('none')}
                />

                {/* Bottom Sheet */}
                <div className="fixed bottom-0 left-0 right-0 z-[201]">
                    <div className="bg-white rounded-t-3xl shadow-2xl p-6 pb-10 max-w-lg mx-auto relative">
                        {/* Close */}
                        <button
                            onClick={() => setState('none')}
                            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Icon */}
                        <div className="flex justify-center mb-5">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-green-200">
                                <Bell className="w-10 h-10 text-white" fill="white" />
                            </div>
                        </div>

                        {/* Text */}
                        <h2 className="text-2xl font-black text-gray-900 text-center mb-2">
                            {isHi ? 'नोटिफिकेशन्स चालू करें' : 'Enable Notifications'}
                        </h2>
                        <p className="text-gray-500 text-center text-sm leading-relaxed mb-8">
                            {isHi
                                ? 'नए काम, ऑर्डर और ऑफर की जानकारी सीधे आपके फ़ोन पर पाएं।'
                                : 'Get instant alerts for new jobs, orders, offers and important updates directly on your phone.'}
                        </p>

                        {/* Allow button */}
                        <button
                            onClick={handleAllow}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200 active:scale-95 mb-3 disabled:opacity-60"
                        >
                            {loading
                                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Bell className="w-5 h-5" />}
                            {isHi ? 'हाँ, चालू करें!' : 'Yes, Enable!'}
                        </button>

                        {/* Not now */}
                        <button
                            onClick={() => setState('none')}
                            className="w-full bg-gray-100 text-gray-500 font-semibold py-3 rounded-2xl hover:bg-gray-200 transition active:scale-95 flex items-center justify-center gap-2"
                        >
                            <BellOff className="w-4 h-4" />
                            {isHi ? 'अभी नहीं' : 'Not Now'}
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // ─── DENIED BANNER ──────────────────────────────────────────
    if (state === 'denied') {
        return (
            <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm">
                <div className="bg-gray-900 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
                    <div className="p-2 bg-orange-500 rounded-xl shrink-0">
                        <BellOff className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">
                            {isHi ? 'नोटिफिकेशन्स बंद हैं' : 'Notifications Blocked'}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5 leading-tight">
                            {isHi
                                ? 'फ़ोन सेटिंग्स → ब्राउज़र → नोटिफिकेशन → चालू करें'
                                : 'Phone Settings → Browser → Notifications → Allow'}
                        </p>
                    </div>
                    <button onClick={() => setState('none')} className="p-1 text-gray-400 shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
