'use client'
import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useSocket } from './SocketProvider'
import { getRoadPath } from '@/lib/routing'

const driverIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png", 
    iconSize: [45, 45], iconAnchor: [22, 22],
});

const homeIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/25/25694.png",
    iconSize: [30, 30], iconAnchor: [15, 15],
});

function MapController({ route, center }: { route: [number, number][], center?: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (route.length > 0) {
            map.fitBounds(L.latLngBounds(route), { padding: [50, 50] });
        } else if (center) {
            map.flyTo(center, 15);
        }
    }, [route, center, map]);
    return null;
}

interface LiveMapProps {
    driverId: string;
    initialLat?: number;
    initialLng?: number;
    destinationLat?: number;
    destinationLng?: number;
}

export default function LiveMap({ driverId, initialLat, initialLng, destinationLat, destinationLng }: LiveMapProps) {
    const { socket } = useSocket();
    
    // Robust Init: Only use initialLat if it's a valid non-zero number
    const [driverPos, setDriverPos] = useState<[number, number] | null>(() => {
        if (initialLat && initialLng && initialLat !== 0) return [initialLat, initialLng];
        return null;
    });

    const [routePath, setRoutePath] = useState<[number, number][]>([]);

    useEffect(() => {
        if (!socket || !driverId) return;
        
        socket.emit("track-driver", driverId);
        
        const handleMove = (coords: { latitude: number, longitude: number }) => {
            console.log("📍 Socket Update:", coords);
            setDriverPos([coords.latitude, coords.longitude]);
        };
        
        socket.on("driver-moved", handleMove);
        return () => { socket.off("driver-moved", handleMove); };
    }, [socket, driverId]);

    // Calculate Path
    useEffect(() => {
        if (!driverPos || !destinationLat || !destinationLng) return;
        getRoadPath([driverPos, [destinationLat, destinationLng]]).then(path => {
            if (path) setRoutePath(path);
        });
    }, [driverPos, destinationLat, destinationLng]);

    // Fallback Center: Destination or Default India
    const defaultCenter: [number, number] = destinationLat && destinationLng 
        ? [destinationLat, destinationLng] 
        : [20.5937, 78.9629]; 

    return (
        <MapContainer center={driverPos || defaultCenter} zoom={15} style={{ height: "100%", width: "100%", borderRadius: "1rem" }}>
            <TileLayer
                url="http://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                attribution='© Google Maps'
            />
            
            <Polyline positions={routePath} color="#22c55e" weight={5} dashArray="10, 10" opacity={0.8} />

            {/* Driver Marker */}
            {driverPos && (
                <Marker position={driverPos} icon={driverIcon}><Popup>Delivery Partner</Popup></Marker>
            )}
            
            {/* User Home */}
            {destinationLat && destinationLng && (
                <Marker position={[destinationLat, destinationLng]} icon={homeIcon}><Popup>Your Location</Popup></Marker>
            )}

            {/* Status Overlay */}
            {!driverPos && (
                <div className="leaflet-bottom leaflet-left" style={{ bottom: 20, left: 20, pointerEvents: 'none', zIndex: 1000 }}>
                    <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg border border-gray-200 text-xs font-bold text-gray-500 animate-pulse flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        Waiting for driver signal...
                    </div>
                </div>
            )}

            <MapController route={routePath} center={driverPos || defaultCenter} />
        </MapContainer>
    )
}