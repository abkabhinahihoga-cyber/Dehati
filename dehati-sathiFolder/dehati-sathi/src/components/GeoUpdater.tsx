'use client'
import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateLocation, setLocationError } from '@/redux/locationSlice'
import { RootState } from '@/redux/store'
import axios from 'axios'
import { useSocket } from '@/components/SocketProvider'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

// Haversine distance in metres between two lat/lng pairs
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function GeoUpdater({ type = 'user' }: { type?: 'user' | 'delivery' }) {
    const dispatch = useDispatch();
    const { socket } = useSocket();
    const { data: session, status } = useSession();
    const isManual = useSelector((state: RootState) => state.location.isManual);

    // Use refs so these never re-trigger the useEffect
    const socketRef = useRef(socket);
    const sessionRef = useRef(session);
    const lastDBSave = useRef<number>(0);
    const lastLat = useRef<number | null>(null);
    const lastLng = useRef<number | null>(null);
    const isTrackingStarted = useRef(false);
    const geocodeDone = useRef(false); // Only reverse-geocode once per mount

    // Keep refs in sync without triggering effects
    useEffect(() => { socketRef.current = socket; }, [socket]);
    useEffect(() => { sessionRef.current = session; }, [session]);

    const handlePositionUpdate = async (lat: number, lng: number, isInitial = false) => {
        // ── For regular users: skip if moved less than 100 m (GPS jitter) ──────
        if (type === 'user' && !isInitial && lastLat.current !== null && lastLng.current !== null) {
            const dist = haversineDistance(lastLat.current, lastLng.current, lat, lng);
            if (dist < 100) return; // Ignore jitter
        }
        lastLat.current = lat;
        lastLng.current = lng;

        // ── Reverse geocode ONCE for user (to get address label) ─────────────
        let addressName = type === 'user' ? 'Locating...' : 'Live GPS Active';
        if (type === 'user' && (isInitial || !geocodeDone.current)) {
            geocodeDone.current = true;
            try {
                const res = await axios.get(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                );
                const parts = res.data.display_name.split(',');
                addressName = parts.slice(0, 3).join(',');
            } catch {
                addressName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }
        }

        dispatch(updateLocation({ lat, lng, address: addressName, isManual: false }));

        // ── SAVE TO LOCAL STORAGE FOR USERS ─────────────
        if (type === 'user') {
            localStorage.setItem('userLocation', JSON.stringify({ lat, lng, address: addressName }));
        }

        // ── Delivery: socket emit + periodic DB save ───────────────────────────
        if (type === 'delivery' && sessionRef.current?.user?.id) {
            if (socketRef.current) {
                socketRef.current.emit('update-location', {
                    userId: sessionRef.current.user.id,
                    latitude: lat,
                    longitude: lng,
                });
            }

            const now = Date.now();
            if (isInitial || now - lastDBSave.current > 10000) {
                lastDBSave.current = now;
                try {
                    await axios.post('/api/socket/update-location', {
                        userId: sessionRef.current.user.id,
                        latitude: lat,
                        longitude: lng,
                    });
                } catch (err) {
                    console.error('❌ DB Sync failed', err);
                }
            }
        }
    };

    useEffect(() => {
        // 1. Wait for session to load
        if (status === 'loading') return;

        // 2. User mode: respect manual location / localStorage
        if (type === 'user') {
            if (isManual) return;
            const savedLoc = localStorage.getItem('userLocation');
            if (savedLoc) {
                try {
                    const parsed = JSON.parse(savedLoc);
                    dispatch(updateLocation({ ...parsed, isManual: true }));
                } catch { /* ignore */ }
                return;
            }
        }

        // 3. Geolocation support check
        if (!navigator.geolocation) {
            dispatch(setLocationError());
            return;
        }

        // 4. Delivery tracking notification (once)
        if (!isTrackingStarted.current && type === 'delivery') {
            toast.success('📍 Live Delivery Tracking Active');
            isTrackingStarted.current = true;
        }

        // 5. One-shot read for immediate position
        navigator.geolocation.getCurrentPosition(
            (pos) => handlePositionUpdate(pos.coords.latitude, pos.coords.longitude, true),
            (err) => console.warn('GPS initial error:', err),
            { enableHighAccuracy: true, timeout: 8000 }
        );

        let watchId: number | null = null;

        // 6. Continuous watch ONLY for delivery mode
        if (type === 'delivery') {
            watchId = navigator.geolocation.watchPosition(
                (pos) => handlePositionUpdate(pos.coords.latitude, pos.coords.longitude, false),
                (err) => {
                    console.error('GPS Watch Error:', err);
                    dispatch(setLocationError());
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
            );
        }

        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
        // Only re-run if mode, manual flag, or session loading state changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, isManual, status]);

    return null;
}

export default GeoUpdater;