'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, BellOff } from 'lucide-react';
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

export default function PushNotificationManager() {
    const locale = useLocale();
    const isHi = locale === 'hi';
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [subscribed, setSubscribed] = useState(false);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        const checkPermission = async () => {
            // Already granted or denied — don't show popup
            if (Notification.permission === 'granted') {
                // Make sure they're actually subscribed in our DB
                await ensureSubscribed();
                return;
            }
            if (Notification.permission === 'denied') return;

            // permission === 'default' (never asked) — show our custom popup
            // Wait 3 seconds after page load to show
            setTimeout(() => setShow(true), 3000);
        };

        checkPermission();
    }, []);

    const ensureSubscribed = async () => {
        try {
            const reg = await navigator.serviceWorker.ready;
            const existing = await reg.pushManager.getSubscription();
            if (existing) {
                setSubscribed(true);
                // Re-save to DB in case it was lost
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
            if (permission !== 'granted') {
                setShow(false);
                return;
            }
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
            setSubscribed(true);
            setShow(false);
        } catch (err) {
            console.error('Notification subscribe failed:', err);
            setShow(false);
        }
        setLoading(false);
    };

    const handleDismiss = () => {
        setShow(false);
        // Snooze for 24 hours
        localStorage.setItem('notifPromptDismissed', String(Date.now()));
    };

    if (!show) return null;

    return (
        <>
            {/* Backdrop blur */}
            <div className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm" onClick={handleDismiss} />

            {/* Bottom Sheet Popup */}
            <div className="fixed bottom-0 left-0 right-0 z-[201] animate-slide-up">
                <div className="bg-white rounded-t-3xl shadow-2xl p-6 pb-10 max-w-lg mx-auto">
                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
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

                    {/* Buttons */}
                    <button
                        onClick={handleAllow}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200 active:scale-95 mb-3 disabled:opacity-60"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Bell className="w-5 h-5" />
                        )}
                        {isHi ? 'हाँ, चालू करें!' : 'Yes, Enable!'}
                    </button>

                    <button
                        onClick={handleDismiss}
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
