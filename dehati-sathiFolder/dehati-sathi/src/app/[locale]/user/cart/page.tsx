'use client'
import { ArrowLeft, Minus, Plus, ShoppingBasket, Trash2, Truck, Store, Info, MapPin, Route, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState, useMemo } from 'react'
import { AnimatePresence, motion } from "framer-motion"
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/redux/store'
import Image from 'next/image'
import { decreaseQuantity, increaseQuantity, removeFromCart, setDeliveryType, setDistance } from '@/redux/cartSlice'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner' // Ensure you have sonner or use standard alert
import { useTranslations, useLocale } from 'next-intl'

function CartPage() {
  const t = useTranslations('Nav')
  const isHindi = useLocale() === 'hi'
  const tCart = {
      back: isHindi ? 'वापस जाएं' : 'Back to Home',
      yourCart: isHindi ? '🛒 आपकी शॉपिंग कार्ट' : '🛒 Your Shopping Cart',
      empty: isHindi ? 'आपकी कार्ट खाली है।' : 'Your cart is empty.',
      continue: isHindi ? 'खरीदारी जारी रखें' : 'Continue Shopping',
      hubProduct: isHindi ? 'हब उत्पाद' : 'Hub Product',
      sellerProduct: isHindi ? 'विक्रेता उत्पाद' : 'Seller Product',
      orderSummary: isHindi ? 'ऑर्डर सारांश' : 'Order Summary',
      hubPickup: isHindi ? 'हब पिकअप' : 'Hub Pickup',
      farmPickup: isHindi ? 'फार्म पिकअप' : 'Farm Pickup',
      homeDelivery: isHindi ? 'होम डिलीवरी' : 'Home Delivery',
      calculating: isHindi ? 'लॉजिस्टिक्स की गणना...' : 'Calculating logistics...',
      subtotal: isHindi ? 'उपकुल' : 'Subtotal',
      deliveryFee: isHindi ? 'डिलीवरी शुल्क' : 'Delivery Fee',
      platformFee: isHindi ? 'प्लेटफॉर्म शुल्क' : 'Platform Fee',
      waived: isHindi ? 'माफ किया गया' : 'Waived',
      total: isHindi ? 'कुल' : 'Total',
  }
  const { cartData, subTotal, deliveryFee, platformFee, finalTotal, deliveryType, distanceToHub } = useSelector((state: RootState) => state.cart)
  const { latitude, longitude } = useSelector((state: RootState) => state.location)
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  const [distances, setDistances] = useState({
      userToSeller: 0,
      hubToSeller: 0
  })
  const [loadingDistances, setLoadingDistances] = useState(false);
  const [showDistanceDetails, setShowDistanceDetails] = useState(false);

  // --- 👇 NEW: ANALYZE CART COMPOSITION ---
  const cartAnalysis = useMemo(() => {
      const hubItems = cartData.filter(item => item.sellerType === 'hub');
      const sellerItems = cartData.filter(item => item.sellerType === 'seller');
      
      // Get unique seller IDs to check for multiple sellers
      const sellerIds = new Set(sellerItems.map(item => {
          // Handle case where seller might be populated object or just ID string
          return typeof item.seller === 'object' && item.seller !== null 
            ? (item.seller as any)._id 
            : item.seller;
      }));

      const hasHub = hubItems.length > 0;
      const hasSeller = sellerItems.length > 0;
      const isMultiSeller = sellerIds.size > 1;

      // Logic for Farm Pickup State
      let farmPickupStatus: 'hidden' | 'disabled' | 'active' = 'active';
      let farmPickupReason = "";

      if (hasHub && !hasSeller) {
          // Case 1: Only Hub Items -> Remove option
          farmPickupStatus = 'hidden';
      } 
      else if (hasHub && hasSeller) {
          // Case 2: Mixed Items -> Disable
          farmPickupStatus = 'disabled';
          farmPickupReason = isHindi ? "मिश्रित ऑर्डर: आप हब आइटम को फार्म से नहीं ले सकते।" : "Mixed Order: You cannot pick up Hub items from a farm.";
      } 
      else if (isMultiSeller) {
          // Case 3: Multiple Sellers -> Disable
          farmPickupStatus = 'disabled';
          farmPickupReason = isHindi ? "कई विक्रेता: कृपया एक ही बार में सभी आइटम लेने के लिए हब पिकअप चुनें।" : "Multiple Sellers: Please choose Hub Pickup to collect all items in one go.";
      }

      return { farmPickupStatus, farmPickupReason };
  }, [cartData]);

  // --- LOGISTICS CALCULATION ---
  const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  }

  useEffect(() => {
    const calculateLogistics = async () => {
        if (!latitude || !longitude || cartData.length === 0) return;

        setLoadingDistances(true);
        try {
            // Logic: Use the first SELLER item for distance calculation if available, else Hub logic
            // If picking up from farm, we calculate to that specific seller. 
            // If multi-seller/hub, we default to Hub logic mostly.
            
            const targetItem = cartData.find(i => i.sellerType === 'seller') || cartData[0];
            
            // @ts-ignore
            if (!targetItem.location?.coordinates) {
                setLoadingDistances(false);
                return;
            }
            // @ts-ignore
            const [sellerLng, sellerLat] = targetItem.location.coordinates;

            const hubRes = await axios.get(`/api/hub/nearest?lat=${latitude}&lng=${longitude}`);
            
            if (hubRes.data.success && hubRes.data.hub) {
                const [hubLng, hubLat] = hubRes.data.hub.coordinates;

                const d_UserHub = getDistanceInMeters(latitude, longitude, hubLat, hubLng);
                const d_UserSeller = getDistanceInMeters(latitude, longitude, sellerLat, sellerLng);
                const d_HubSeller = getDistanceInMeters(hubLat, hubLng, sellerLat, sellerLng);

                dispatch(setDistance(d_UserHub));

                setDistances({
                    userToSeller: d_UserSeller,
                    hubToSeller: d_HubSeller
                });
            }
        } catch (error) {
            console.error("Failed to calculate logistics:", error);
        } finally {
            setLoadingDistances(false);
        }
    }
    
    calculateLogistics();

  }, [latitude, longitude, cartData, dispatch]);

  // --- 👇 NEW: AUTO-SWITCH DELIVERY TYPE IF OUT OF RANGE ---
  useEffect(() => {
      if (distanceToHub > 3500 && deliveryType === 'home-delivery') {
          dispatch(setDeliveryType('hub-pickup'));
      }
  }, [distanceToHub, deliveryType, dispatch]);

  const handleFarmPickupClick = () => {
      if (cartAnalysis.farmPickupStatus === 'disabled') {
          // Show error message
          toast.error(cartAnalysis.farmPickupReason); 
      } else {
          dispatch(setDeliveryType('farm-pickup'));
      }
  }

  return (
    <div className='w-[95%] sm:w-[90%] md:w-[80%] mx-auto mt-8 mb-24 relative'>
      <Link href={"/"} className='absolute -top-2 left-0 flex items-center gap-2 text-green-700 hover:text-green-800 font-medium transition-all'>
        <ArrowLeft size={20} />
        <span className='hidden sm:inline'>{tCart.back}</span>
      </Link>
      
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-2xl sm:text-3xl md:text-4xl font-bold text-green-700 text-center mb-10'
      >
        {tCart.yourCart}
      </motion.h2>

      {cartData.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center py-20 bg-white rounded-2xl shadow-md'
        >
          <ShoppingBasket className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-600 text-lg mb-6'>{tCart.empty}</p>
          <Link href={"/"} className='bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700'>
            {tCart.continue}
          </Link>
        </motion.div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          
          {/* LEFT: CART ITEMS */}
          <div className='lg:col-span-2 space-y-5'>
            <AnimatePresence>
              {cartData.map((item) => {
                const displayImage = item.images && item.images.length > 0 ? item.images[0] : "/placeholder.png";
                const isWholesale = item.quantity >= (item.retailLimit || 3);
                const activePrice = item.price; // Already calculated in redux

                return (
                  <motion.div
                    key={item._id} 
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className='flex flex-col sm:flex-row items-center bg-white rounded-2xl shadow-md p-5 border border-gray-100 mb-4'
                  >
                    <div className='relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50'>
                      <Image src={displayImage} alt={item.name} fill className='object-contain p-2' />
                    </div>
                    
                    <div className='mt-4 sm:mt-0 sm:ml-4 flex-1 text-center sm:text-left'>
                      <h3 className='text-base font-semibold text-gray-800'>{item.name}</h3>
                      <div className='flex items-center justify-center sm:justify-start gap-2'>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.sellerType === 'hub' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {item.sellerType === 'hub' ? tCart.hubProduct : tCart.sellerProduct}
                          </span>
                      </div>
                      
                      <div className='mt-2'>
                          <p className='text-green-700 font-bold text-lg'>₹{activePrice * item.quantity}</p>
                          <p className='text-xs text-gray-500'>₹{activePrice} / {item.unit}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-full mt-4'>
                        <button className='bg-white p-1.5 rounded-full shadow-sm' onClick={()=>dispatch(decreaseQuantity(item._id))}><Minus size={14}/></button>
                        <span className='font-semibold text-gray-800 w-6 text-center'>{item.quantity}</span>
                        <button className='bg-white p-1.5 rounded-full shadow-sm' onClick={()=>dispatch(increaseQuantity(item._id))}><Plus size={14}/></button>
                    </div>
                    
                    <button className='sm:ml-4 mt-3 sm:mt-0 text-red-500 p-2' onClick={()=>dispatch(removeFromCart(item._id))}><Trash2 size={18}/></button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <motion.div 
            initial={{opacity:0,x:30}}
            animate={{opacity:1,x:0}}
            className='bg-white rounded-2xl shadow-xl p-6 h-fit sticky top-24 border border-gray-100 flex flex-col'
          >
            <h2 className='text-lg sm:text-xl font-bold text-gray-800 mb-4'>{tCart.orderSummary}</h2>
            
            {/* 👇 DELIVERY TOGGLES */}
            <div className='flex flex-col gap-2 mb-6'>
                <div className='flex bg-gray-100 p-1 rounded-xl'>
                    
                    {/* HUB PICKUP (Always Available) */}
                    <button 
                        onClick={() => dispatch(setDeliveryType('hub-pickup'))} 
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${deliveryType === 'hub-pickup' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Store size={14} /> {tCart.hubPickup}
                    </button>

                    {/* FARM PICKUP (Conditional) */}
                    {cartAnalysis.farmPickupStatus !== 'hidden' && (
                        <button 
                            onClick={handleFarmPickupClick} 
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-300 
                                ${deliveryType === 'farm-pickup' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}
                                ${cartAnalysis.farmPickupStatus === 'disabled' ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400' : 'hover:text-gray-700'}
                            `}
                        >
                            <Store size={14} /> {tCart.farmPickup}
                        </button>
                    )}
                </div>

                {/* Farm Pickup Warning Message */}
                {cartAnalysis.farmPickupStatus === 'disabled' && (
                    <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 text-[10px] p-2 rounded-lg border border-yellow-100">
                        <AlertCircle size={12} className="mt-0.5 shrink-0"/>
                        <p>{cartAnalysis.farmPickupReason}</p>
                    </div>
                )}

                {/* HOME DELIVERY (Always Available, but conditional based on distance) */}
                <button 
                    onClick={() => {
                        if (distanceToHub <= 3500) dispatch(setDeliveryType('home-delivery'));
                    }} 
                    disabled={distanceToHub > 3500}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border-2 
                        ${deliveryType === 'home-delivery' ? 'bg-green-50 border-green-600 text-green-700' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}
                        ${distanceToHub > 3500 ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
                    `}
                >
                    <Truck size={14} /> {tCart.homeDelivery}
                </button>
                
                {/* Distance Warning for Home Delivery */}
                {distanceToHub > 3500 && (
                    <div className="flex items-start gap-2 bg-orange-50 text-orange-800 text-[10px] p-2 rounded-lg border border-orange-100 mt-1">
                        <AlertCircle size={12} className="mt-0.5 shrink-0"/>
                        <p>{isHindi ? 'आप चयनित हब के लिए हमारे 3.5 किमी डिलीवरी ज़ोन से बाहर हैं। कृपया पिकअप चुनें।' : 'You are outside our 3.5km delivery zone for the selected Hub. Please choose Pickup.'}</p>
                    </div>
                )}
            </div>

            {/* DYNAMIC DISTANCE DISPLAY */}
            {loadingDistances ? (
                <div className='mb-4 p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400 gap-2'>
                    <Loader2 className="animate-spin" size={14}/> {tCart.calculating}
                </div>
            ) : (
                distanceToHub > 0 && (
                    <div className='mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2'>
                        
                        {deliveryType === 'hub-pickup' && (
                            <div className="flex items-center justify-between text-xs text-blue-800 font-medium">
                                <span className="flex items-center gap-2"><MapPin size={14}/> {isHindi ? 'आपसे हब तक:' : 'You to Hub:'}</span>
                                <span className="font-bold">{(distanceToHub / 1000).toFixed(1)} km</span>
                            </div>
                        )}

                        {deliveryType === 'farm-pickup' && (
                            <div className="flex items-center justify-between text-xs text-green-800 font-medium">
                                <span className="flex items-center gap-2"><Store size={14}/> {isHindi ? 'आपसे विक्रेता तक:' : 'You to Seller:'}</span>
                                <span className="font-bold">{(distances.userToSeller / 1000).toFixed(1)} km</span>
                            </div>
                        )}

                        {deliveryType === 'home-delivery' && (
                            <>
                                <div className="flex items-center justify-between text-xs text-blue-800 font-bold cursor-pointer" onClick={() => setShowDistanceDetails(!showDistanceDetails)}>
                                    <span className="flex items-center gap-2"><Route size={14}/> {isHindi ? 'कुल लॉजिस्टिक्स:' : 'Total Logistics:'}</span>
                                    <div className="flex items-center gap-1">
                                        <span>{((distances.hubToSeller + distanceToHub) / 1000).toFixed(1)} km</span>
                                        {showDistanceDetails ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {showDistanceDetails && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden space-y-1.5 pt-2 border-t border-blue-200 mt-2"
                                        >
                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                <span>{isHindi ? '1. विक्रेता से हब:' : '1. Seller to Hub:'}</span>
                                                <span>{(distances.hubToSeller / 1000).toFixed(1)} km</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                <span>{isHindi ? '2. हब से आप तक:' : '2. Hub to You:'}</span>
                                                <span>{(distanceToHub / 1000).toFixed(1)} km</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                )
            )}

            {/* BILLING */}
            <div className='space-y-3 text-gray-700 text-sm sm:text-base'>
              <div className='flex justify-between'>
                  <span>{tCart.subtotal}</span>
                  <span className='text-green-700 font-semibold'>₹{subTotal}</span>
              </div>
              <div className='flex justify-between'>
                  <span className='flex items-center gap-1'>
                    {tCart.deliveryFee} {deliveryType !== 'home-delivery' && <span className='text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full'>{tCart.waived}</span>}
                  </span>
                  <span className={`${deliveryType !== 'home-delivery' ? 'text-gray-400 line-through' : 'text-green-700 font-semibold'}`}>₹{deliveryFee}</span>
              </div>
              <div className='flex justify-between'>
                  <span className='flex items-center gap-1'>
                    {tCart.platformFee} {deliveryType === 'farm-pickup' && <span className='text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full'>{tCart.waived}</span>}
                  </span>
                  <span className={`${deliveryType === 'farm-pickup' ? 'text-gray-400 line-through' : 'text-green-700 font-semibold'}`}>₹{platformFee}</span>
              </div>
              <hr className='my-3'/>
              <div className='flex justify-between font-bold text-lg sm:text-xl'>
                  <span>{tCart.total}</span>
                  <span className='text-green-700 font-semibold'>₹{finalTotal}</span>
              </div>
            </div>

            <motion.button 
              whileTap={{scale:0.95}} 
              disabled={deliveryType === 'home-delivery' && distanceToHub > 3500}
              className={`w-full mt-6 py-3 rounded-full font-semibold text-sm sm:text-base shadow-lg transition-all
                ${deliveryType === 'home-delivery' && distanceToHub > 3500 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-green-200'}
              `} 
              onClick={()=> {
                  if(deliveryType === 'home-delivery' && distanceToHub > 3500) return;
                  router.push("/user/checkout");
              }}
            >
              {deliveryType === 'home-delivery' ? t('proceedToDelivery') : t('proceedToPickup')}
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default CartPage