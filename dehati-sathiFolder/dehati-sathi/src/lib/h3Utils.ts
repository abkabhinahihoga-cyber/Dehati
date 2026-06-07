import { latLngToCell, gridDisk } from "h3-js";

// H3 Resolution 8 is roughly 0.7km edge length, good for rural village-level indexing.
// Resolution 7 is roughly 1.8km edge length (hexagon area ~5 sq km)
// Resolution 6 is roughly 4.7km edge length, good for large 3.5km hubs.
const RESOLUTION = 7;

/**
 * Get H3 Index for a given coordinate
 * @param lat Latitude
 * @param lng Longitude
 * @returns H3 Hexagon Index string
 */
export const getH3Index = (lat: number, lng: number): string => {
  return latLngToCell(lat, lng, RESOLUTION);
};

/**
 * Get surrounding H3 hexagons (the "k-ring")
 * Useful for finding hubs near a user if their exact hexagon has no hub.
 * @param h3Index The central hexagon
 * @param k Radius in hexagons (e.g., 1 means immediate neighbors)
 * @returns Array of H3 indices
 */
export const getSurroundingHexagons = (h3Index: string, k: number = 1): string[] => {
  return gridDisk(h3Index, k);
};
