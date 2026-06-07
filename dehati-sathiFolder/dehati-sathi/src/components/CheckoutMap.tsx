'use client'

import React, { useEffect, useMemo, useState } from 'react'
import "leaflet/dist/leaflet.css"
import { MapContainer, Marker, TileLayer, useMap, Popup, useMapEvents, LayersControl } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'

// Custom SVG marker (no external CDN dependency — works offline)
const createPinIcon = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
        <defs>
            <filter id="shadow" x="-20%" y="-10%" width="140%" height="130%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.35"/>
            </filter>
        </defs>
        <path d="M20 0C8.954 0 0 8.954 0 20c0 14 20 32 20 32s20-18 20-32C40 8.954 31.046 0 20 0z" fill="#EF4444" filter="url(#shadow)"/>
        <circle cx="20" cy="18" r="8" fill="white"/>
        <circle cx="20" cy="18" r="4" fill="#EF4444"/>
    </svg>`;
    return new L.DivIcon({
        html: svg,
        className: 'custom-pin-icon',
        iconSize: [40, 52],
        iconAnchor: [20, 52],
        popupAnchor: [0, -52],
    });
};

const markerIcon = createPinIcon();

// Smoothly fly to new position
const MapUpdater = ({ position }: { position: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 17, { animate: true, duration: 1 });
        }
    }, [position, map]);
    return null;
}

// Click map to move pin
const ClickController = ({ setPosition }: { setPosition: (pos: [number, number]) => void }) => {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

interface CheckoutMapProps {
    position: [number, number] | null;
    setPosition: (pos: [number, number]) => void;
}

const CheckoutMap: React.FC<CheckoutMapProps> = ({ position, setPosition }) => {
    
    const defaultCenter: LatLngExpression = [20.5937, 78.9629]; // India center

    const eventHandlers = useMemo(
        () => ({
            dragend(e: L.LeafletEvent) {
                const marker = e.target as L.Marker;
                const { lat, lng } = marker.getLatLng();
                setPosition([lat, lng]);
            },
        }),
        [setPosition],
    )

    if (!position) {
        return (
             <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500 text-sm font-medium">
                <span className="animate-pulse">Loading Map...</span>
            </div>
        )
    }

    return (
        <MapContainer
            center={position as LatLngExpression}
            zoom={17}
            scrollWheelZoom={true}
            className='w-full h-full z-0'
            style={{ background: '#e8e8e8', cursor: 'crosshair' }} 
        >
            <LayersControl position="topright">
                {/* Layer 1: OpenStreetMap — Fast, lightweight, great for rural areas */}
                <LayersControl.BaseLayer checked name="🗺️ Map">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        maxZoom={19}
                    />
                </LayersControl.BaseLayer>

                {/* Layer 2: ESRI Satellite — Free, no API key, HD imagery for India */}
                <LayersControl.BaseLayer name="🛰️ Satellite">
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='&copy; Esri, Maxar, Earthstar Geographics'
                        maxZoom={19}
                    />
                </LayersControl.BaseLayer>

                {/* Layer 3: Topo (terrain + elevation — useful for hilly rural areas) */}
                <LayersControl.BaseLayer name="⛰️ Terrain">
                    <TileLayer
                        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenTopoMap'
                        maxZoom={17}
                    />
                </LayersControl.BaseLayer>
            </LayersControl>

            {/* Logic Components */}
            <MapUpdater position={position} />
            <ClickController setPosition={setPosition} />
            
            <Marker
                icon={markerIcon}
                position={position as LatLngExpression}
                draggable={true}
                eventHandlers={eventHandlers}
                autoPan={true}
            >
                <Popup>
                    <div className="text-center font-bold text-gray-700 text-sm">
                        📍 Your Location <br/>
                        <span className="text-[10px] text-gray-400 font-normal">Tap or drag to adjust</span>
                    </div>
                </Popup>
            </Marker>
        </MapContainer>
    )
}

export default CheckoutMap