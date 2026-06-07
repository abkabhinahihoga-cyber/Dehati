'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Globe, Phone, Store as StoreIcon, Loader2, Search, Check, Milestone, Building2, Flag, LocateFixed, ArrowLeft, MapPin, Navigation } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { updateLocation } from '@/redux/locationSlice'
import dynamic from 'next/dynamic'

// Dynamic Map Import
const CheckoutMap = dynamic(() => import('@/components/CheckoutMap'), { 
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-gray-50 flex items-center justify-center text-gray-400 text-xs font-bold animate-pulse">
            Loading Map...
        </div>
    )
});

function WelcomePage() {
    const router = useRouter()
    const dispatch = useDispatch()
    const { data: session, update } = useSession()
    
    // Steps: 1=Intro, 2=Language, 3=Mobile, 4=Location
    const [step, setStep] = useState(1) 
    const [language, setLanguage] = useState<'en'|'hi'>('en')
    const [mobile, setMobile] = useState('')
    const [loading, setLoading] = useState(false)

    // Apply pending referral code for Google signups
    useEffect(() => {
        const pendingCode = localStorage.getItem('pendingReferralCode');
        if (pendingCode && session?.user?.id) {
            axios.post('/api/user/referral', { referredByCode: pendingCode }).then(() => {
                localStorage.removeItem('pendingReferralCode');
            }).catch(() => {});
        }
    }, [session?.user?.id]);

    // --- LOCATION STATE ---
    const [mapPos, setMapPos] = useState<[number, number]>([20.5937, 78.9629]) 
    const [manualFields, setManualFields] = useState({ village: '', city: '', state: '', pincode: '' })
    const [fullAddress, setFullAddress] = useState("")
    const [resolvingLocation, setResolvingLocation] = useState(false)
    const [searchText, setSearchText] = useState("")

    // --- NAVIGATION LOGIC ---

    const handleNext = () => setStep(prev => prev + 1)
    
    // 1. Forward Logic: Skip Mobile Step if it exists in session
    const handleLanguageNext = () => {
        if (session?.user?.mobile) {
            setMobile(session.user.mobile);
            setStep(4); // Jump to Location
        } else {
            setStep(3); // Go to Mobile Input
        }
    }

    // 2. Backward Logic: Smart Back Button
    const handleBack = () => {
        // If we are on Location (Step 4) AND user has a saved mobile number...
        // ...we skip Step 3 and go straight back to Language (Step 2)
        if (step === 4 && session?.user?.mobile) {
            setStep(2);
        } else {
            setStep(prev => prev - 1);
        }
    }

    // --- GEOCODING LOGIC ---
    const reverseGeocode = async (lat: number, lng: number) => {
        setResolvingLocation(true);
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
        finally { setResolvingLocation(false); }
    }

    const forwardGeocode = async () => {
        if(!searchText) return;
        setResolvingLocation(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1`);
            if (res.data && res.data[0]) {
                const lat = parseFloat(res.data[0].lat);
                const lon = parseFloat(res.data[0].lon);
                setMapPos([lat, lon]); 
                reverseGeocode(lat, lon);
            } else {
                alert("Location not found.");
            }
        } catch (e) { console.error(e); }
        finally { setResolvingLocation(false); }
    }

    const handleGPS = () => {
        if (!navigator.geolocation) return alert("GPS not supported");
        setResolvingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setMapPos([latitude, longitude]);
                const addr = await reverseGeocode(latitude, longitude);
                setResolvingLocation(false);
            },
            () => { alert("Location access denied."); setResolvingLocation(false); },
            { enableHighAccuracy: true }
        );
    }

    const handleMapDrag = (pos: [number, number]) => {
        setMapPos(pos);
        reverseGeocode(pos[0], pos[1]);
    }

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') forwardGeocode();
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

    const finishOnboarding = async () => {
        if(!fullAddress) return alert("Please select a location");
        setLoading(true)
        try {
            const res = await axios.post('/api/user/complete-profile', {
                language,
                mobile: mobile || session?.user?.mobile, 
                location: { lat: mapPos[0], lng: mapPos[1] },
                address: fullAddress
            })
            
            if(res.data.success) {
                dispatch(updateLocation({
                    lat: mapPos[0],
                    lng: mapPos[1],
                    address: fullAddress,
                    isManual: true
                }));
                localStorage.setItem("userLocation", JSON.stringify({
                    lat: mapPos[0], lng: mapPos[1], address: fullAddress
                }));
                await update({ isNewUser: false })
                router.refresh()
                router.push('/') 
            }
        } catch (error) {
            alert("Something went wrong.")
        } finally {
            setLoading(false)
        }
    }

    const InputField = ({ icon: Icon, label, value, field }: any) => (
        <div className="relative border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-500 transition-all">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">{label}</label>
            <div className="flex items-center gap-2">
                <Icon size={14} className="text-gray-400 shrink-0"/>
                <input 
                    type="text" 
                    value={value} 
                    onChange={(e) => handleInputChange(field, e.target.value)} 
                    className="w-full text-sm font-semibold text-gray-800 outline-none bg-transparent"
                    placeholder="..."
                />
            </div>
        </div>
    );

    return (
        <div className="h-screen w-full bg-white flex flex-col">
            <AnimatePresence mode="wait">
                
                {/* === STEP 1: WELCOME === */}
                {step === 1 && (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}
                        className='flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-green-50 to-white'
                    >
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <StoreIcon className='w-12 h-12 text-green-600' />
                        </motion.div>
                        <h1 className='text-3xl md:text-5xl font-black text-green-800 tracking-tight mb-3'>Dehati Sathi</h1>
                        <p className='text-gray-500 text-lg font-medium max-w-md leading-relaxed'>
                            Connecting Indian Villages to Global Markets. <br/> Let's set up your profile.
                        </p>
                        
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNext} 
                            className='mt-12 bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-full font-bold shadow-lg shadow-green-200 flex items-center gap-2 transition-all'
                        >
                            Get Started <ArrowRight className='w-5 h-5'/>
                        </motion.button>
                    </motion.div>
                )}

                {/* === STEP 2: LANGUAGE === */}
                {step === 2 && (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                        className='flex-1 flex flex-col p-6 bg-white relative'
                    >
                        <button onClick={handleBack} className="absolute top-6 left-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><ArrowLeft size={24}/></button>
                        
                        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
                            <div className="text-center mb-10">
                                <Globe className='w-12 h-12 text-green-600 mx-auto mb-4'/>
                                <h2 className='text-2xl font-bold text-gray-800'>Select Language</h2>
                                <p className="text-gray-500">भाषा चुनें</p>
                            </div>
                            
                            <div className='grid grid-cols-2 gap-4 mb-10 w-full'>
                                <button onClick={() => setLanguage('en')} className={`p-6 rounded-2xl border-2 transition-all ${language === 'en' ? 'border-green-600 bg-green-50 shadow-md scale-[1.02]' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <span className="text-3xl mb-2 block">🇺🇸</span>
                                    <span className={`block font-bold ${language === 'en' ? 'text-green-700' : 'text-gray-600'}`}>English</span>
                                </button>
                                <button onClick={() => setLanguage('hi')} className={`p-6 rounded-2xl border-2 transition-all ${language === 'hi' ? 'border-green-600 bg-green-50 shadow-md scale-[1.02]' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <span className="text-3xl mb-2 block">🇮🇳</span>
                                    <span className={`block font-bold ${language === 'hi' ? 'text-green-700' : 'text-gray-600'}`}>हिंदी</span>
                                </button>
                            </div>

                            <motion.button 
                                whileTap={{ scale: 0.98 }}
                                onClick={handleLanguageNext} 
                                className='bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-full font-bold shadow-lg shadow-green-200 transition-all flex items-center gap-2'
                            >
                                Continue <ArrowRight size={18}/>
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* === STEP 3: MOBILE === */}
                {step === 3 && (
                    <motion.div 
                        key="step3"
                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                        className='flex-1 flex flex-col p-6 bg-white relative'
                    >
                        {/* Back Button handles smart navigation */}
                        <button onClick={handleBack} className="absolute top-6 left-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><ArrowLeft size={24}/></button>

                        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto text-center">
                            <Phone className='w-12 h-12 text-blue-600 mx-auto mb-4'/>
                            <h2 className='text-2xl font-bold text-gray-800 mb-2'>Mobile Number</h2>
                            <p className='text-gray-500 mb-8'>We need this for order delivery coordination.</p>
                            
                            <div className="relative mb-8 w-full max-w-xs">
                                <span className="absolute left-4 top-4 text-gray-400 font-bold text-lg">+91</span>
                                <input 
                                    type="tel" 
                                    placeholder="Enter 10 digit number" 
                                    className="w-full pl-14 pr-4 py-4 rounded-xl border-2 border-gray-200 text-lg font-bold text-gray-800 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all placeholder:font-normal" 
                                    value={mobile} 
                                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                                />
                            </div>

                            <motion.button 
                                whileTap={{ scale: 0.98 }}
                                onClick={handleNext} 
                                disabled={mobile.length < 10} 
                                className='bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-400 text-white px-10 py-3 rounded-full font-bold shadow-lg shadow-green-200 transition-all flex items-center gap-2'
                            >
                                Verify & Continue <ArrowRight size={18}/>
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* === STEP 4: LOCATION === */}
                {step === 4 && (
                    <motion.div 
                        key="step4"
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                        className='flex flex-col h-full bg-white relative'
                    >
                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-20">
                            {/* Back Button handles smart navigation */}
                            <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                                <ArrowLeft size={24}/>
                            </button>
                            <h3 className="font-bold text-gray-800 text-lg">Pin Location</h3>
                            <div className="w-8"></div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32">
                            
                            {/* 1. Search Bar */}
                            <div className={`relative shadow-sm rounded-xl border border-gray-200 bg-white flex items-center overflow-hidden mb-6 transition-all focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500`}>
                                <div className="pl-4 text-gray-400"><Search size={20} /></div>
                                <input 
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    type="text" 
                                    placeholder="Search village, city..." 
                                    className="flex-1 pl-3 pr-2 py-4 text-sm font-bold text-gray-800 outline-none bg-transparent placeholder:text-gray-400" 
                                />
                                <button 
                                    onClick={forwardGeocode} 
                                    className="px-6 py-4 bg-gray-900 hover:bg-black text-white font-bold text-xs tracking-wide transition-colors"
                                >
                                    {resolvingLocation ? <Loader2 size={16} className="animate-spin"/> : "SEARCH"}
                                </button>
                            </div>

                            {/* 1. GPS Quick Button */}
                            <button 
                                onClick={handleGPS} 
                                disabled={resolvingLocation}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-green-50 border-2 border-green-200 hover:border-green-400 hover:bg-green-100 transition-all mb-4 group"
                            >
                                <div className="p-3 rounded-full bg-green-100 text-green-700 group-hover:scale-110 transition-transform">
                                    {resolvingLocation ? <Loader2 size={22} className="animate-spin" /> : <Navigation size={22} fill="currentColor" />}
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-green-800 text-sm">Use Current Location</h4>
                                    <p className="text-xs text-green-600 mt-0.5">Auto-detect via GPS</p>
                                </div>
                                {resolvingLocation && <span className="ml-auto text-xs text-green-600 font-semibold animate-pulse">Detecting...</span>}
                            </button>

                            {/* 2. Map Container */}
                            <div className="relative h-[280px] w-full rounded-2xl border border-gray-300 overflow-hidden shadow-md mb-6 bg-gray-100">
                                <CheckoutMap position={mapPos} setPosition={handleMapDrag} />
                                
                                <button onClick={handleGPS} className="absolute bottom-4 right-4 z-[500] bg-white text-gray-700 p-3 rounded-full shadow-lg hover:bg-gray-50 border border-gray-200 transition-transform active:scale-95">
                                    <LocateFixed size={20} className="text-blue-600"/>
                                </button>
                            </div>

                            {/* 3. Form Fields */}
                            <div className="space-y-5">
                                <div className="mb-2">
                                    <h3 className="text-xl font-black text-gray-800">Address Details</h3>
                                    <p className="text-sm text-gray-500 font-medium">Please confirm the details below</p>
                                </div>

                                <div className={`p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-4`}>
                                    <Globe size={20} className="text-blue-600 mt-0.5 shrink-0"/>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mb-1">Detected Address</label>
                                        <textarea rows={2} value={fullAddress} onChange={e => setFullAddress(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-blue-900 outline-none resize-none placeholder:text-blue-300" placeholder="Fetching address..."/>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <InputField icon={Milestone} label="Village / Street" value={manualFields.village} field="village" onChange={(v: string) => setManualFields(p => ({...p, village: v}))} />
                                    <InputField icon={Building2} label="City / District" value={manualFields.city} field="city" onChange={(v: string) => setManualFields(p => ({...p, city: v}))} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField icon={Flag} label="State" value={manualFields.state} field="state" onChange={(v: string) => setManualFields(p => ({...p, state: v}))} />
                                    <InputField icon={MapPin} label="Pincode" value={manualFields.pincode} field="pincode" onChange={(v: string) => setManualFields(p => ({...p, pincode: v}))} />
                                </div>
                            </div>
                        </div>

                        {/* 4. Footer (Sticky) */}
                        <div className="absolute bottom-0 left-0 w-full p-6 bg-white border-t border-gray-100 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                            {/* MODERN SMALL BUTTON for Finish Step */}
                            <motion.button 
                                whileTap={{ scale: 0.98 }}
                                onClick={finishOnboarding} 
                                disabled={!fullAddress || loading} 
                                className='w-full py-3.5 rounded-full text-white font-bold text-lg shadow-lg shadow-green-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed'
                            >
                                {loading ? <Loader2 className="animate-spin" size={20}/> : <Check size={20} strokeWidth={3} />}
                                {loading ? "Connecting..." : "Confirm & Finish"}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    )
}

export default WelcomePage