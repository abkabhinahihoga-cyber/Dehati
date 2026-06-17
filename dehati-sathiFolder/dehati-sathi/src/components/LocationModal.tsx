'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Search, Navigation, Plus, Home, Briefcase, Trash2, ArrowLeft, Check, Loader2, Globe, Building2, Flag, Milestone, LocateFixed } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { updateLocation, addSavedAddress, removeSavedAddress, setAllAddresses, SavedAddress } from '@/redux/locationSlice'
import dynamic from 'next/dynamic'
import axios from 'axios'
import { nanoid } from '@reduxjs/toolkit'

// Dynamic Map Import
const CheckoutMap = dynamic(() => import('./CheckoutMap'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold animate-pulse">Loading Map...</div>
});

interface SearchSuggestion {
    display_name: string;
    lat: string;
    lon: string;
    type: string;
    address?: any;
}

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LocationModal({ isOpen, onClose }: LocationModalProps) {
    const dispatch = useDispatch();
    const { mode } = useSelector((state: RootState) => state.mode);
    const { savedAddresses, latitude, longitude } = useSelector((state: RootState) => state.location);
    
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [resolving, setResolving] = useState(false);
    const [mapPos, setMapPos] = useState<[number, number]>([20.5937, 78.9629]); 
    const [manualFields, setManualFields] = useState({ village: '', city: '', state: '', pincode: '' });
    const [fullAddress, setFullAddress] = useState("");
    const [labelType, setLabelType] = useState<'home' | 'work' | 'other'>('home');
    const [customLabel, setCustomLabel] = useState("");
    const [searchText, setSearchText] = useState("");
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Theme Colors
    const isGrocery = mode === 'grocery';
    const themeColor = isGrocery ? 'text-green-700' : 'text-indigo-700';
    const btnPrimary = isGrocery ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700';
    const ringFocus = isGrocery ? 'focus-within:ring-green-500' : 'focus-within:ring-indigo-500';
    const bgLight = isGrocery ? 'bg-green-50' : 'bg-indigo-50';
    const borderActive = isGrocery ? 'border-green-500' : 'border-indigo-500';

    useEffect(() => {
        const saved = localStorage.getItem('savedAddresses');
        if (saved) dispatch(setAllAddresses(JSON.parse(saved)));
        if (latitude && longitude) setMapPos([latitude, longitude]);
    }, [isOpen, dispatch, latitude, longitude]);

    // --- LOGIC ---
    const commitLocation = async (lat: number, lng: number, address: string) => {
        dispatch(updateLocation({ lat, lng, address, isManual: true }));
        localStorage.setItem("userLocation", JSON.stringify({ lat, lng, address }));
        try { await axios.post('/api/user/complete-profile', { location: { lat, lng }, address }); } catch (e) {}
    }

    const reverseGeocode = async (lat: number, lng: number) => {
        setResolving(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const a = res.data.address;
            const newFields = {
                village: a.hamlet || a.village || a.road || a.neighbourhood || '',
                city: a.suburb || a.town || a.city || a.county || '',
                state: a.state || '',
                pincode: a.postcode || ''
            };
            setManualFields(newFields);
            updateFullAddress(newFields); 
            return res.data.display_name;
        } catch(e) { return "Unknown Location"; } 
        finally { setResolving(false); }
    }

    // Live search suggestions (debounced)
    const searchPlaces = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        setSearching(true);
        try {
            const res = await axios.get(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`
            );
            setSuggestions(res.data || []);
            setShowSuggestions(true);
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
    }, []);

    const handleSearchInput = (value: string) => {
        setSearchText(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchPlaces(value), 400);
    };

    const selectSuggestion = (s: SearchSuggestion) => {
        const lat = parseFloat(s.lat);
        const lon = parseFloat(s.lon);
        setMapPos([lat, lon]);
        reverseGeocode(lat, lon);
        setSearchText(s.display_name.split(',').slice(0, 3).join(', '));
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const forwardGeocode = async () => {
        if(!searchText) return;
        setResolving(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1&countrycodes=in`);
            if (res.data && res.data[0]) {
                const lat = parseFloat(res.data[0].lat);
                const lon = parseFloat(res.data[0].lon);
                setMapPos([lat, lon]); 
                reverseGeocode(lat, lon);
            } else {
                alert("Location not found.");
            }
        } catch (e) { console.error(e); }
        finally { setResolving(false); }
    }

    const handleGPS = () => {
        if (!navigator.geolocation) return alert("GPS not supported");
        setResolving(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setMapPos([latitude, longitude]);
                const addr = await reverseGeocode(latitude, longitude);
                if(view === 'list') { commitLocation(latitude, longitude, addr); onClose(); }
                setResolving(false);
            },
            () => { alert("Location access denied."); setResolving(false); },
            { enableHighAccuracy: true }
        );
    }

    const handleMapDrag = (pos: [number, number]) => {
        setMapPos(pos);
        reverseGeocode(pos[0], pos[1]);
    }

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setShowSuggestions(false);
            forwardGeocode();
        }
    }

    const handleInputChange = (field: keyof typeof manualFields, value: string) => {
        const updated = { ...manualFields, [field]: value };
        setManualFields(updated);
        updateFullAddress(updated);
    }

    const updateFullAddress = (fields: typeof manualFields) => {
        const parts = [fields.village, fields.city, fields.state, fields.pincode].filter(Boolean);
        setFullAddress(parts.join(", "));
    }

    const saveNewAddress = async () => {
        if(!fullAddress) return;
        const newAddr: SavedAddress = {
            id: nanoid(),
            type: labelType,
            label: customLabel || (labelType === 'home' ? 'Home' : labelType === 'work' ? 'Work' : 'Other'),
            address: fullAddress,
            lat: mapPos[0],
            lng: mapPos[1]
        };
        dispatch(addSavedAddress(newAddr));
        const currentSaved = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
        localStorage.setItem('savedAddresses', JSON.stringify([...currentSaved, newAddr]));
        commitLocation(newAddr.lat, newAddr.lng, newAddr.address);
        onClose();
        setView('list'); 
    }

    const InputField = ({ icon: Icon, label, value, field }: any) => (
        <div className={`relative border border-gray-200 rounded-xl px-3 py-2 transition-all ${ringFocus} bg-white focus-within:bg-gray-50 focus-within:border-gray-300`}>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">{label}</label>
            <div className="flex items-center gap-2">
                <Icon size={14} className="text-gray-400 shrink-0"/>
                <input 
                    type="text" 
                    value={value} 
                    onChange={e => handleInputChange(field, e.target.value)} 
                    className="w-full text-sm font-semibold text-gray-800 outline-none bg-transparent placeholder:text-gray-300"
                    placeholder="..."
                />
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                        onClick={onClose} className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" 
                    />
                    
                    <motion.div 
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={`fixed bottom-0 left-0 w-full md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] bg-white z-[101] shadow-2xl flex flex-col overflow-hidden
                        ${view === 'editor' ? 'h-[95vh] rounded-t-3xl md:rounded-3xl' : 'max-h-[85vh] rounded-t-3xl md:rounded-3xl h-auto'}`}
                    >
                        {/* === VIEW 1: ADDRESS LIST === */}
                        {view === 'list' && (
                            <>
                                <div className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-800 tracking-tight">स्थान चुनें</h3>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">डिलीवरी कहां भेजनी है?</p>
                                    </div>
                                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><X size={18} className="text-gray-600"/></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                                    {/* Search & Actions */}
                                    <div className="relative shadow-sm group cursor-pointer" onClick={() => setView('editor')}>
                                        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${themeColor}`}>
                                            <Search className="h-5 w-5" />
                                        </div>
                                        <input readOnly type="text" placeholder="गांव, कस्बा या पिनकोड खोजें..." className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:outline-none cursor-pointer hover:bg-white hover:border-gray-300 transition-all" />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <button onClick={handleGPS} disabled={resolving} className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 ${isGrocery ? 'border-green-500 bg-green-50 shadow-[0_12px_30px_rgba(22,163,74,0.18)]' : 'border-indigo-500 bg-indigo-50 shadow-[0_12px_30px_rgba(79,70,229,0.18)]'} hover:shadow-lg transition-all group text-left ${resolving ? 'opacity-80' : ''}`}>
                                            <div className="absolute right-4 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-green-700 shadow-sm">सबसे आसान</div>
                                            <div className={`p-3 rounded-full bg-white ${themeColor} group-hover:scale-110 transition-transform shadow-sm`}>
                                                {resolving ? <Loader2 size={20} className="animate-spin"/> : <Navigation size={20} fill="currentColor" />}
                                            </div>
                                            <div>
                                                <h4 className={`font-black text-base ${themeColor}`}>वर्तमान लोकेशन इस्तेमाल करें</h4>
                                                <p className="text-xs text-gray-600 mt-0.5">GPS से अपने-आप पता भर जाएगा</p>
                                            </div>
                                        </button>

                                        <button onClick={() => setView('editor')} className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-gray-300 bg-transparent hover:bg-white hover:border-gray-400 hover:shadow-sm transition-all group text-left">
                                            <div className="p-3 rounded-full bg-gray-100 text-gray-500 group-hover:scale-110 transition-transform"><Plus size={20}/></div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-700">मैनुअल पता जोड़ें</h4>
                                                <p className="text-xs text-gray-400 mt-0.5">मैप पर खोजें या खुद भरें</p>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Saved List */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 ml-1">सेव किए पते</h4>
                                        {savedAddresses.length === 0 ? (
                                            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed text-gray-400 text-sm">अभी कोई पता सेव नहीं है.</div>
                                        ) : (
                                            <div className="space-y-3">
                                                {savedAddresses.map((addr) => (
                                                    <div key={addr.id} className="relative flex items-start gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-green-400 transition-all cursor-pointer group" onClick={() => { commitLocation(addr.lat, addr.lng, addr.address); onClose(); }}>
                                                        <div className={`p-2.5 rounded-full ${bgLight} ${themeColor} shrink-0`}>
                                                            {addr.type === 'home' ? <Home size={18}/> : addr.type === 'work' ? <Briefcase size={18}/> : <MapPin size={18}/>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="font-bold text-gray-800 text-sm">{addr.label}</h5>
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{addr.address}</p>
                                                        </div>
                                                        <button onClick={(e) => { e.stopPropagation(); dispatch(removeSavedAddress(addr.id)); localStorage.setItem('savedAddresses', JSON.stringify(savedAddresses.filter(a=>a.id!==addr.id))); }} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* === VIEW 2: MAP + FORM === */}
                        {view === 'editor' && (
                            <div className="flex flex-col h-full bg-white relative">
                                
                                {/* Header with Search */}
                                <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100 bg-white z-20">
                                    <button onClick={() => { setView('list'); setShowSuggestions(false); setSuggestions([]); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 shrink-0"><ArrowLeft size={20}/></button>
                                    <div className={`relative flex-1 flex items-center bg-gray-50 rounded-xl border border-gray-200 overflow-visible transition-all ${ringFocus} focus-within:ring-2 focus-within:bg-white`}>
                                        <Search size={16} className="ml-3 text-gray-400 shrink-0" />
                                        <input 
                                            value={searchText}
                                            onChange={(e) => handleSearchInput(e.target.value)}
                                            onKeyDown={handleSearchKeyDown}
                                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                            type="text" 
                                            placeholder="Search village, city, pincode..." 
                                            className="flex-1 px-3 py-2.5 text-sm font-semibold text-gray-800 outline-none bg-transparent placeholder:text-gray-400" 
                                            autoFocus
                                        />
                                        {searching && <Loader2 size={16} className="mr-3 animate-spin text-gray-400" />}
                                    </div>
                                </div>

                                {/* Search Suggestions Dropdown */}
                                <AnimatePresence>
                                    {showSuggestions && suggestions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="absolute top-[60px] left-0 right-0 mx-4 bg-white rounded-2xl shadow-xl border border-gray-100 z-30 max-h-[250px] overflow-y-auto"
                                        >
                                            {suggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => selectSuggestion(s)}
                                                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                                                >
                                                    <MapPin size={16} className={`${themeColor} mt-0.5 shrink-0`} />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{s.display_name.split(',').slice(0, 2).join(', ')}</p>
                                                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{s.display_name}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex-1 overflow-y-auto pb-24">
                                    
                                    {/* MAP — Prominent, takes up most of the screen */}
                                    <div className="relative h-[45vh] w-full border-b border-gray-200 shrink-0">
                                        <CheckoutMap position={mapPos} setPosition={handleMapDrag} />
                                        
                                        {/* Locate Me Button */}
                                        <button onClick={handleGPS} className="absolute bottom-4 right-4 z-[500] bg-white text-gray-700 p-3 rounded-full shadow-lg hover:bg-gray-50 border border-gray-200 transition-transform active:scale-95">
                                            <LocateFixed size={20} className="text-blue-600"/>
                                        </button>

                                        {/* Resolving indicator */}
                                        {resolving && (
                                            <div className="absolute bottom-4 left-4 z-[500] bg-white px-3 py-2 rounded-full shadow-lg border border-gray-200 flex items-center gap-2">
                                                <Loader2 size={14} className="animate-spin text-blue-600" />
                                                <span className="text-xs font-bold text-gray-600">Fetching address...</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* FORM FIELDS */}
                                    <div className="px-5 pt-5 space-y-4">
                                        {/* Auto Address */}
                                        <div className={`p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3`}>
                                            <Globe size={16} className="text-blue-600 mt-0.5 shrink-0"/>
                                            <div className="flex-1">
                                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">Detected Address</label>
                                                <textarea rows={2} value={fullAddress} onChange={e => setFullAddress(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-blue-900 outline-none resize-none placeholder:text-blue-300" placeholder="Tap on map or search above..."/>
                                            </div>
                                        </div>

                                        {/* Manual Fields */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <InputField icon={Milestone} label="Village / Street" value={manualFields.village} field="village" />
                                            <InputField icon={Building2} label="City / District" value={manualFields.city} field="city" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <InputField icon={Flag} label="State" value={manualFields.state} field="state" />
                                            <InputField icon={MapPin} label="Pincode" value={manualFields.pincode} field="pincode" />
                                        </div>

                                        {/* Labels */}
                                        <div className="pt-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Save As</label>
                                            <div className="flex gap-2">
                                                {['home', 'work', 'other'].map((t) => (
                                                    <button key={t} onClick={() => setLabelType(t as any)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase border transition-all flex items-center justify-center gap-2 ${labelType === t ? `${bgLight} ${themeColor} ${borderActive} ring-1 ${isGrocery?'ring-green-500':'ring-indigo-500'}` : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                                        {t === 'home' && <Home size={14}/>}{t === 'work' && <Briefcase size={14}/>}{t === 'other' && <MapPin size={14}/>}{t}
                                                    </button>
                                                ))}
                                            </div>
                                            {labelType === 'other' && <input type="text" placeholder="e.g. Friend's House" value={customLabel} onChange={e=>setCustomLabel(e.target.value)} className="w-full mt-3 p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-gray-300" />}
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER BUTTON (Sticky) */}
                                <div className="absolute bottom-0 left-0 w-full p-5 bg-white border-t border-gray-100 z-20">
                                    <button onClick={saveNewAddress} disabled={!fullAddress || resolving} className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${!fullAddress ? 'bg-gray-300 cursor-not-allowed' : btnPrimary}`}>
                                        {resolving ? <Loader2 className="animate-spin" size={18}/> : <Check size={18} strokeWidth={3} />}
                                        {resolving ? "Fetching Details..." : "Confirm & Save Address"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
