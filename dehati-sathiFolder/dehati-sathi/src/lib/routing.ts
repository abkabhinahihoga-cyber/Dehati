import axios from "axios";

// 1. Calculate Distance (Haversine Formula)
export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 2. Sort Orders: Driver -> Nearest -> Next Nearest (Simple TSP)
export function optimizeRoute(start: [number, number], orders: any[]) {
    let currentPos = start;
    const pending = [...orders];
    const sorted = [];

    while (pending.length > 0) {
        let nearestIndex = 0;
        let minDist = Infinity;

        // Find nearest neighbor
        for (let i = 0; i < pending.length; i++) {
            // Check for valid coordinates, otherwise skip or default
            const orderLat = pending[i].address?.lat || pending[i].address?.latitude || 0;
            const orderLng = pending[i].address?.lng || pending[i].address?.longitude || 0;
            
            if(orderLat === 0 || orderLng === 0) continue;

            const dist = getDistance(currentPos[0], currentPos[1], orderLat, orderLng);
            
            if (dist < minDist) {
                minDist = dist;
                nearestIndex = i;
            }
        }

        if (minDist === Infinity && pending.length > 0) {
             // Handle case where remaining orders have no valid coords
             sorted.push(...pending);
             break;
        }

        // Add to sorted list
        const nextStop = pending[nearestIndex];
        sorted.push(nextStop);
        
        // Update current position to this stop
        const nextLat = nextStop.address?.lat || nextStop.address?.latitude;
        const nextLng = nextStop.address?.lng || nextStop.address?.longitude;
        currentPos = [nextLat, nextLng];
        
        // Remove from pending
        pending.splice(nearestIndex, 1);
    }

    return sorted;
}

// 3. Fetch Road Path (OSRM - Free)
export async function getRoadPath(points: [number, number][]) {
    if (points.length < 2) return [];

    // OSRM expects: lng,lat;lng,lat
    const coordinates = points.map(p => `${p[1]},${p[0]}`).join(';');
    
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
        const res = await axios.get(url);
        
        if (res.data.routes && res.data.routes.length > 0) {
            // Return coordinates in [lat, lng] format for Leaflet
            return res.data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        }
    } catch (error) {
        console.error("Routing Failed:", error);
    }
    
    // Fallback: Just return straight lines if API fails
    return points;
}