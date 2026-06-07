'use client'
import React, { useState, useEffect } from 'react'
import { motion } from "framer-motion"
import { ArrowLeft, MapPin, User, Phone, Home, Navigation, LocateFixed, Loader2, CreditCard, Truck, Map, Store, Info, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux' 
import { RootState } from '@/redux/store'
import axios from 'axios'
import dynamic from 'next/dynamic'
import { toast } from 'sonner' // Assuming you have sonner installed, optional

const CheckoutMap = dynamic(() => import('@/components/CheckoutMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 font-bold text-sm">
            <Loader2 className="animate-spin mr-2 w-5 h-5" /> Loading Map...
        </div>
    )
})

function Checkout() {
    const router = useRouter()
    
    const { userData } = useSelector((state: RootState) => state.user)
    const { subTotal, deliveryFee, platformFee, finalTotal, cartData, deliveryType } = useSelector((state: RootState) => state.cart)
    const { latitude, longitude } = useSelector((state: RootState) => state.location);

    const [orderLoading, setOrderLoading] = useState(false)
    
    // Wallet State - auto-apply if user clicked "Apply" on product view page
    const [useWallet, setUseWallet] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('applyWalletAtCheckout') === 'true';
        }
        return false;
    })
    const walletBalance = userData?.walletBalance || 0
    const maxWalletDiscount = Math.min(5, walletBalance, finalTotal) // Can't exceed order total or ₹5
    
    // Address Form State (Only for Home Delivery)
    const [address, setAddress] = useState({
        fullName: "",
        mobile: "",
        village: "",
        district: "",
        state: "",
        pincode: "",
        fullAddress: "" 
    })
    
    // Pickup Location State (For Hub/Farm Pickup)
    const [pickupLocation, setPickupLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
    const [loadingPickup, setLoadingPickup] = useState(false);

    const [searchLoading, setSearchLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [position, setPosition] = useState<[number, number] | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod")

    // 1. Initialize Location / Fetch Pickup Info
    useEffect(() => {
        // If Home Delivery: Use User's Location
        if (deliveryType === 'home-delivery') {
            if (latitude && longitude) {
                setPosition([latitude, longitude]);
            } else if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]), 
                    () => setPosition([20.5937, 78.9629]), 
                    { enableHighAccuracy: true }
                )
            } else {
                setPosition([20.5937, 78.9629]);
            }
        } 
        // If Pickup: Fetch Hub or Seller Location
        else {
            const fetchPickupLocation = async () => {
                setLoadingPickup(true);
                try {
                    if(cartData.length > 0) {
                        const item = cartData[0]; 
                        // Ensure we have valid coordinates, or fallback
                        // @ts-ignore
                        const coords = item.location?.coordinates || [78.9629, 20.5937];
                        // @ts-ignore
                        const addr = deliveryType === 'hub-pickup' ? "Dehati Hub Point" : (item.seller?.sellerDetails?.shopName || "Seller Shop");

                        setPickupLocation({
                            lat: coords[1], // Mongo is [lng, lat]
                            lng: coords[0],
                            address: addr
                        });
                        // Set position for the navigation link visualization
                        setPosition([coords[1], coords[0]]);
                    }
                } catch (e) { console.error(e) }
                finally { setLoadingPickup(false) }
            }
            fetchPickupLocation();
        }
    }, [deliveryType, latitude, longitude, cartData]);

    // 2. Prefill User Data
    useEffect(() => {
        if (userData) {
            setAddress((prev) => ({
                ...prev,
                fullName: userData.name || "",
                mobile: userData.mobile || "",
            }))
        }
    }, [userData])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAddress(prev => ({ ...prev, [name]: value }));
    }

    const handleSearchQuery = async () => {
        if (!searchQuery) return;
        setSearchLoading(true)
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`)
            if (response.data && response.data.length > 0) {
                const { lat, lon } = response.data[0];
                setPosition([parseFloat(lat), parseFloat(lon)])
            }
        } catch (error) {
            console.error("Search failed", error)
        } finally {
            setSearchLoading(false)
        }
    }

    useEffect(() => {
        const fetchAddress = async () => {
            if (!position || deliveryType !== 'home-delivery') return
            try {
                const result = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${position[0]}&lon=${position[1]}&format=json`)
                const a = result.data.address;
                
                setAddress(prev => ({
                    ...prev,
                    village: a.hamlet || a.village || a.road || a.neighbourhood || prev.village,
                    district: a.city || a.town || a.county || a.state_district || prev.district,
                    state: a.state || prev.state,
                    pincode: a.postcode || prev.pincode,
                    fullAddress: result.data.display_name || prev.fullAddress
                }))
            } catch (error) {
                console.log("Geocoding Error", error)
            }
        }
        fetchAddress()
    }, [position, deliveryType])

    const handlePlaceOrder = async () => {
        // Validation based on Delivery Type
        if (deliveryType === 'home-delivery') {
            if (!position || !address.fullName || !address.mobile || !address.fullAddress) {
                alert("Please fill in all delivery details.");
                return;
            }
        }

        setOrderLoading(true)
        try {
            // Construct the payload
            const payload = {
                userId: userData?._id,
                items: cartData.map(item => ({
                    product: item._id,
                    name: item.name,
                    price: item.price,
                    unit: item.unit,
                    quantity: item.quantity,
                    images: item.images,
                    // @ts-ignore
                    seller: item.seller?._id || item.seller // Pass seller ID for Farm Pickup logic
                })),
                totalAmount: finalTotal,
                address: deliveryType === 'home-delivery' ? {
                    ...address,
                    latitude: position![0],
                    longitude: position![1]
                } : {
                    // 👇 CRITICAL FIX: Pass coordinates even for Pickup!
                    fullName: userData?.name,
                    mobile: userData?.mobile,
                    fullAddress: pickupLocation?.address || "Pickup Order",
                    latitude: pickupLocation?.lat || 0, // Needed for Backend to find Nearest Hub
                    longitude: pickupLocation?.lng || 0, // Needed for Backend to find Nearest Hub
                    isPickup: true,
                    pickupType: deliveryType
                },
                paymentMethod,
                deliveryType,
                walletDiscount: useWallet ? maxWalletDiscount : 0
            };

            const result = await axios.post("/api/user/order", payload)

            if(result.status === 201){
                router.push("/user/order-success")
            }
        } catch (error: any) {
            console.error("Order Error", error);
            alert(error.response?.data?.message || "Order Failed")
        } finally {
            setOrderLoading(false)
        }
    }

    const getPaymentLabel = () => {
        if (deliveryType === 'hub-pickup') return "Pay Cash at Hub";
        if (deliveryType === 'farm-pickup') return "Pay Cash to Seller";
        return "Cash on Delivery";
    }

    const getAddressTitle = () => {
        if (deliveryType === 'hub-pickup') return "Hub Location Details";
        if (deliveryType === 'farm-pickup') return "Seller Location Details";
        return "Delivery Address";
    }

    return (
        <div className='w-[92%] md:w-[80%] mx-auto py-10 relative'>
            <motion.button
                whileTap={{ scale: 0.97 }}
                className='absolute left-0 top-2 flex items-center gap-2 text-green-700 hover:text-green-800 font-semibold'
                onClick={() => router.push("/user/cart")}>
                <ArrowLeft size={16} />
                <span>Back</span>
            </motion.button>

            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='text-3xl md:text-4xl font-bold text-green-700 text-center mb-10'
            >
                {deliveryType === 'home-delivery' ? "Checkout" : "Confirm Pickup"}
            </motion.h1>

            <div className='grid md:grid-cols-2 gap-8'>
                
                {/* LEFT SECTION: ADDRESS / MAP */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className='bg-white rounded-2xl shadow-lg p-6 border border-gray-100'
                >
                    <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                        {deliveryType === 'home-delivery' ? <MapPin className='text-green-700' /> : <Navigation className='text-blue-600'/>}
                        {getAddressTitle()}
                    </h2>

                    {deliveryType === 'home-delivery' ? (
                        // --- HOME DELIVERY: SHOW FORM & MAP ---
                        <div className='space-y-4'>
                            <div className='relative'>
                                <User className="absolute left-3 top-3 text-green-600" size={18} />
                                <input type="text" name="fullName" value={address.fullName} onChange={handleChange} placeholder="Full Name" className='pl-10 w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500' />
                            </div>
                            <div className='relative'>
                                <Phone className="absolute left-3 top-3 text-green-600" size={18} />
                                <input type="text" name="mobile" value={address.mobile} onChange={handleChange} placeholder="Mobile Number" className='pl-10 w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500' />
                            </div>
                            <div className='relative'>
                                <Home className="absolute left-3 top-3 text-green-600" size={18} />
                                <input type="text" name="village" value={address.village} onChange={handleChange} placeholder="Village / Street" className='pl-10 w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500' />
                            </div>
                            
                            <div className='flex gap-2 mt-3'>
                                <input type="text" placeholder='Search map location...' className='flex-1 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                <button className='bg-green-600 text-white px-5 rounded-lg hover:bg-green-700 transition-all font-medium' onClick={handleSearchQuery}>{searchLoading ? <Loader2 size={16} className='animate-spin' /> : "Search"}</button>
                            </div>
                            
                            {/* Map for Home Delivery */}
                            <div className='relative mt-6 h-[250px] rounded-xl overflow-hidden border shadow-sm'>
                                <CheckoutMap position={position} setPosition={setPosition} />
                                <motion.button whileTap={{ scale: 0.93 }} className='absolute bottom-4 right-4 bg-white text-green-600 shadow-lg rounded-full p-3 hover:bg-green-50 transition-all flex items-center justify-center z-[1000] border border-gray-200' onClick={() => {
                                    if (navigator.geolocation) {
                                        navigator.geolocation.getCurrentPosition((pos) => setPosition([pos.coords.latitude, pos.coords.longitude]))
                                    }
                                }}>
                                    <LocateFixed />
                                </motion.button>
                            </div>
                            
                            <div className='relative'>
                                <Map className="absolute left-3 top-3 text-green-600" size={18} />
                                <textarea name="fullAddress" value={address.fullAddress} onChange={handleChange} rows={2} placeholder="Full Address (Auto-filled)" className='pl-10 w-full border border-gray-300 rounded-lg p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none' />
                            </div>
                        </div>
                    ) : (
                        // --- PICKUP VIEW: INFO ONLY ---
                        <div className='space-y-6 py-4'>
                            <div className='p-5 bg-blue-50 text-blue-900 rounded-xl border border-blue-100'>
                                <div className='flex items-start gap-3 mb-3'>
                                    <Info size={24} className="text-blue-600 mt-0.5 shrink-0"/>
                                    <div>
                                        <p className="font-bold text-lg">Pickup Location</p>
                                        <p className="text-sm text-blue-700 mt-1">Please visit the address below to collect your order.</p>
                                    </div>
                                </div>
                                <div className="ml-9 p-3 bg-white/60 rounded-lg border border-blue-100">
                                    <p className="font-semibold text-gray-800">{pickupLocation?.address || "Fetching location..."}</p>
                                </div>
                            </div>

                            {/* Google Maps Button */}
                            <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${position?.[0]},${position?.[1]}`}
                                target="_blank"
                                rel="noreferrer"
                                className={`flex items-center justify-center gap-3 w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-200 transition-all active:scale-95 ${loadingPickup ? 'bg-gray-300 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {loadingPickup ? <Loader2 className="animate-spin"/> : <Navigation size={20}/>}
                                {loadingPickup ? "Loading..." : "Get Directions on Google Maps"}
                            </a>
                            
                            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                                <ExternalLink size={12}/> Opens in a new tab
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* RIGHT SECTION: PAYMENT */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className='bg-white rounded-2xl shadow-lg p-6 border border-gray-100 h-fit'
                >
                    <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'><CreditCard className='text-green-600' />Payment Method</h2>
                    
                    <div className='space-y-3 mb-6'>

                        
                        <button onClick={() => setPaymentMethod("cod")} className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all ${paymentMethod === "cod" ? "border-green-600 bg-green-50 shadow-sm" : "hover:bg-gray-50"}`}> 
                            {deliveryType === 'home-delivery' ? <Truck className='text-green-600' /> : <Store className='text-blue-600' />} 
                            <span className='font-medium text-gray-700'>{getPaymentLabel()}</span>
                        </button>
                    </div>

                    <div className='border-t pt-4 text-gray-700 space-y-2 text-sm sm:text-base'>
                        <div className='flex justify-between'><span className='font-semibold'>SubTotal</span><span className='font-semibold text-green-600'>₹{subTotal}</span></div>
                        <div className='flex justify-between'>
                            <span className='font-semibold'>Delivery Fee</span>
                            <span className={`${deliveryFee === 0 ? 'text-gray-400 line-through' : 'text-green-600 font-semibold'}`}>₹{deliveryFee}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span className='font-semibold'>Platform Fee</span>
                            <span className={`${platformFee === 0 ? 'text-gray-400 line-through' : 'text-green-600 font-semibold'}`}>₹{platformFee}</span>
                        </div>
                        <div className='flex justify-between font-bold text-lg border-t pt-3'>
                            <span className='font-semibold'>Final Total</span>
                            <span className='font-semibold text-green-600'>₹{useWallet ? Math.max(0, finalTotal - maxWalletDiscount) : finalTotal}</span>
                        </div>
                    </div>

                    {/* Wallet Section */}
                    {walletBalance > 0 && (
                        <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-green-800 flex items-center gap-2">
                                    <Store size={18} /> Wallet Balance
                                </span>
                                <span className="font-bold text-green-700">₹{walletBalance}</span>
                            </div>
                            <p className="text-xs text-green-600 mb-3">You can use up to ₹{Math.min(5, walletBalance)} on this order.</p>
                            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-green-100 shadow-sm w-fit">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-green-600 accent-green-600" 
                                    checked={useWallet} 
                                    onChange={(e) => setUseWallet(e.target.checked)}
                                />
                                <span className="text-sm font-medium text-gray-700">Apply ₹{maxWalletDiscount} Discount</span>
                            </label>
                        </div>
                    )}
                    
                    <motion.button 
                        whileTap={{ scale: 0.93 }}
                        disabled={orderLoading}
                        className='w-full mt-6 bg-green-600 text-white py-3 rounded-full hover:bg-green-700 transition-all font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center'
                        onClick={handlePlaceOrder}
                    >
                        {orderLoading ? <Loader2 className="animate-spin" /> : "Confirm Order"}
                    </motion.button>
                </motion.div>
            </div>
        </div>
    )
}

export default Checkout