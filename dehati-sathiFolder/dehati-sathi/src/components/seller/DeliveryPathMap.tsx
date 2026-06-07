'use client'
import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getRoadPath, optimizeRoute } from '@/lib/routing'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'

// Custom Icons
const driverIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png", // Bike
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const homeIcon = (number: number) => L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #ef4444; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${number}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
});

function MapController({ route }: { route: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (route.length > 0) {
            const bounds = L.latLngBounds(route);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [route, map]);
    return null;
}

export default function DeliveryPathMap({ orders }: { orders: any[] }) {
    // Get live driver location from Redux (GeoUpdater puts it there)
    const { latitude, longitude } = useSelector((state: RootState) => state.location);
    const [path, setPath] = useState<[number, number][]>([]);
    const [sortedOrders, setSortedOrders] = useState<any[]>([]);

    useEffect(() => {
        if (!latitude || !longitude || orders.length === 0) return;

        const calculateRoute = async () => {
            // 1. Sort orders: Driver -> A -> B -> C
            const sorted = optimizeRoute([latitude, longitude], orders);
            setSortedOrders(sorted);

            // 2. Prepare waypoints for OSRM
            const waypoints: [number, number][] = [[latitude, longitude]];
            
            sorted.forEach(order => {
                const lat = order.address?.lat || order.address?.latitude;
                const lng = order.address?.lng || order.address?.longitude;
                if (lat && lng) {
                    waypoints.push([lat, lng]);
                }
            });

            // 3. Get Road Geometry
            const roadGeometry = await getRoadPath(waypoints);
            setPath(roadGeometry || waypoints);
        };

        calculateRoute();
    }, [orders, latitude, longitude]);

    if (!latitude || !longitude) return <div className="h-full bg-gray-100 flex items-center justify-center text-sm text-gray-500">Waiting for GPS...</div>;

    return (
        <MapContainer center={[latitude, longitude]} zoom={13} style={{ height: "100%", width: "100%", borderRadius: "1rem" }}>
            {/* Google Hybrid Tiles */}
            <TileLayer
                url="http://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                attribution='Google Maps'
            />

            {/* Path */}
            <Polyline positions={path} color="#3b82f6" weight={6} opacity={0.8} />

            {/* Driver Marker */}
            <Marker position={[latitude, longitude]} icon={driverIcon}>
                <Popup>You are here</Popup>
            </Marker>

            {/* Order Markers (Numbered by Sequence) */}
            {sortedOrders.map((order, index) => {
                const lat = order.address?.lat || order.address?.latitude;
                const lng = order.address?.lng || order.address?.longitude;
                if(!lat || !lng) return null;

                return (
                    <Marker 
                        key={order._id} 
                        position={[lat, lng]} 
                        icon={homeIcon(index + 1)}
                    >
                        <Popup>
                            <div className="text-center">
                                <span className="font-bold block">Stop #{index + 1}</span>
                                <span className="text-xs">{order.user?.name}</span><br/>
                                <span className="text-[10px] text-gray-500">{order.address.fullAddress}</span>
                            </div>
                        </Popup>
                    </Marker>
                )
            })}

            <MapController route={path} />
        </MapContainer>
    )
}