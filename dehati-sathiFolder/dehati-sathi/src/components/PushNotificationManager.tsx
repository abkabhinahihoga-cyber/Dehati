'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const locale = useLocale();
    const isHi = locale === 'hi';

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkSubscription();
        } else {
            setLoading(false);
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
        setLoading(false);
    };

    const subscribeUser = async () => {
        setLoading(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast.error(isHi ? 'नोटिफिकेशन्स की अनुमति नहीं मिली' : 'Notification permission denied');
                setLoading(false);
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            // Send subscription to our server
            const res = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });

            if (res.ok) {
                setIsSubscribed(true);
                toast.success(isHi ? 'नोटिफिकेशन्स चालू हो गए!' : 'Notifications enabled!');
            } else {
                throw new Error('Failed to save subscription on server');
            }
        } catch (error) {
            console.error('Failed to subscribe:', error);
            toast.error(isHi ? 'कुछ गलत हो गया' : 'Failed to enable notifications');
        }
        setLoading(false);
    };

    const unsubscribeUser = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                setIsSubscribed(false);
                toast.success(isHi ? 'नोटिफिकेशन्स बंद हो गए' : 'Notifications disabled');
            }
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
        }
        setLoading(false);
    };

    if (!isSupported) {
        return null; // Not supported on this browser (e.g., iOS without being installed)
    }

    return (
        <div className="flex items-center justify-between p-3 mx-2 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isSubscribed ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                    {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </div>
                <div>
                    <p className="font-semibold text-sm text-gray-800">
                        {isHi ? 'नोटिफिकेशन्स' : 'Notifications'}
                    </p>
                    <p className="text-xs text-gray-500">
                        {isSubscribed 
                            ? (isHi ? 'चालू हैं' : 'Enabled') 
                            : (isHi ? 'बंद हैं' : 'Disabled')}
                    </p>
                </div>
            </div>
            
            <button 
                onClick={isSubscribed ? unsubscribeUser : subscribeUser}
                disabled={loading}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isSubscribed 
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                        : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                }`}
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    isSubscribed 
                        ? (isHi ? 'बंद करें' : 'Disable')
                        : (isHi ? 'चालू करें' : 'Enable')
                )}
            </button>
        </div>
    );
}
