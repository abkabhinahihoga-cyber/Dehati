import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SavedAddress {
    id: string;
    type: 'home' | 'work' | 'other';
    label: string;
    address: string;
    lat: number;
    lng: number;
}

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    address: string;
    error: string | null;
    loading: boolean;
    permissionGranted: boolean;
    isManual: boolean; // 👇 Crucial Flag
    savedAddresses: SavedAddress[];
}

const initialState: LocationState = {
    latitude: null,
    longitude: null,
    address: "Detecting location...",
    error: null,
    loading: false,
    permissionGranted: false,
    isManual: false,
    savedAddresses: []
};

const locationSlice = createSlice({
    name: 'location',
    initialState,
    reducers: {
        updateLocation: (state, action: PayloadAction<{ lat: number; lng: number; address: string; isManual?: boolean }>) => {
            state.latitude = action.payload.lat;
            state.longitude = action.payload.lng;
            state.address = action.payload.address;
            state.loading = false;
            state.error = null;
            state.permissionGranted = true;
            // Only update isManual if explicitly provided
            if (action.payload.isManual !== undefined) {
                state.isManual = action.payload.isManual;
            }
        },
        setLocationError: (state) => {
            state.loading = false;
            state.error = "Location access denied";
            state.address = "Location unavailable";
            state.permissionGranted = false;
        },
        addSavedAddress: (state, action: PayloadAction<SavedAddress>) => {
            state.savedAddresses.push(action.payload);
        },
        removeSavedAddress: (state, action: PayloadAction<string>) => {
            state.savedAddresses = state.savedAddresses.filter(addr => addr.id !== action.payload);
        },
        setAllAddresses: (state, action: PayloadAction<SavedAddress[]>) => {
            state.savedAddresses = action.payload;
        }
    }
});

export const { updateLocation, setLocationError, addSavedAddress, removeSavedAddress, setAllAddresses } = locationSlice.actions;
export default locationSlice.reducer;