'use client'
import { 
    LogOut, ShoppingCartIcon, User, X, UserCircle, Store, BookOpen, Briefcase, 
    Bike, Laptop, Share2, ChevronDown, MapPin, Home, LayoutDashboard, 
    ShieldCheck, Tractor, ShoppingBag, Truck, PlayCircle, Wallet, Globe 
} from 'lucide-react'
import { Link, useRouter, usePathname } from '@/i18n/routing'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { signOut } from 'next-auth/react'
import { createPortal } from 'react-dom'
import { useSelector, useDispatch } from 'react-redux' 
import { RootState } from '@/redux/store'
import { toggleMode } from '@/redux/modeSlice'
import LocationModal from './LocationModal'
import HubSelectorModal from './HubSelectorModal'
import GeoUpdater from '@/components/GeoUpdater'
import SearchBar from '@/components/SearchBar'
import { useSidebar } from '@/context/SidebarContext'
import axios from 'axios'
import NotificationBell from './NotificationBell'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslations } from 'next-intl'

interface INavUser {
    _id?: string;
    name: string;
    email: string;
    role: "user" | "deliveryBoy" | "seller" | "admin" | "hub";
    image?: string;
    sellerStatus?: 'pending' | 'approved' | 'rejected' | 'none';
    connectedHub?: string | null;
}

function Nav({ user }: { user: INavUser }) {
    const pathname = usePathname();
    const router = useRouter();
    const t = useTranslations('Nav');
    const common = useTranslations('Common');
    
    // ðŸ‘‡ FIX: Destructure toggle from context
    const { isOpen, close, toggle } = useSidebar(); 
    
    const [jobsOpen, setJobsOpen] = useState(true) 
    const [mounted, setMounted] = useState(false)
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isHubModalOpen, setIsHubModalOpen] = useState(false);
    const [connections, setConnections] = useState<any[]>([]);
    
    const dispatch = useDispatch();
    const { cartData } = useSelector((state: RootState) => state.cart)
    const { mode } = useSelector((state: RootState) => state.mode)
    const { address, permissionGranted } = useSelector((state: RootState) => state.location);
    const { userData } = useSelector((state: RootState) => state.user);

    const isGrocery = mode === 'grocery';
    const themeColor = isGrocery ? 'text-green-600' : 'text-blue-600';
    const borderTheme = isGrocery ? 'border-green-200' : 'border-blue-200';
    const gradientBg = isGrocery 
        ? 'bg-gradient-to-r from-lime-500 to-green-600' 
        : 'bg-gradient-to-r from-blue-500 to-indigo-600';
    const lightBg = isGrocery ? 'bg-green-50' : 'bg-blue-50';

    useEffect(() => { 
        setMounted(true);
        if(user._id) {
            axios.get('/api/user/connections').then(res => {
                if(res.data.success) setConnections(res.data.connections);
            }).catch(() => {});
            
            // Force Hub Selection if missing
            if(!user.connectedHub) {
                setIsHubModalOpen(true);
            }
        }
    }, [user._id, user.connectedHub]);

    const authRoutes = ['/login', '/signup', '/register', '/welcome', '/forgot-password', '/onboarding', '/landing'];
    if (authRoutes.includes(pathname)) return null;

    const isHomePage = pathname === '/';

    const renderSidebar = () => {
        if (!mounted) return null;
        return createPortal(
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={close}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
                        />
                        <motion.div
                            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className='fixed top-0 left-0 h-full w-[85%] sm:w-[320px] z-[100] bg-white shadow-2xl flex flex-col'
                        >
                            {/* Profile Header */}
                            <div className={`${gradientBg} p-6 pb-8 relative text-white`}>
                                <button onClick={close} className='absolute top-4 right-4 p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition'>
                                    <X className="w-5 h-5" />
                                </button>
                                <div className='flex items-center gap-4 mt-2'>
                                    <div className='relative w-16 h-16 rounded-full border-2 border-white/50 bg-white p-0.5 overflow-hidden shrink-0'>
                                        {user.image ? (
                                            <Image src={user.image} alt='user' fill className='object-cover rounded-full' />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                <User className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className='overflow-hidden'>
                                        <h2 className='text-lg font-bold truncate'>{user.name}</h2>
                                        <p className='text-xs opacity-90 truncate'>{user.email}</p>
                                        <span className='inline-block mt-1 bg-black/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-white/20'>
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 py-2 hidden"></div>
                            {/* Menu Items */}
                            <div className='flex-1 overflow-y-auto py-4 px-2 space-y-1'>

                                {/* Wallet Balance - always at top */}
                                {userData?.walletBalance !== undefined && (
                                    <div className='flex items-center justify-between p-3 mx-2 mb-2 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-sm'>
                                        <div className='flex items-center gap-3 text-green-800 font-semibold text-sm'>
                                            <Wallet className='text-green-600 w-5 h-5' /> Wallet Balance
                                        </div>
                                        <span className='font-bold text-green-700 text-base'>â‚¹{userData.walletBalance}</span>
                                    </div>
                                )}

                                <Link href="/" onClick={close} className='flex items-center gap-4 p-3 mx-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'>
                                    {isGrocery ? <Store className='text-green-500' /> : <BookOpen className='text-blue-500' />} {t('home')}
                                </Link>
                                
                                {/* ðŸ‘‡ NEW: Connections Link & Horizontal List */}
                                <Link href="/user/connections" onClick={close} className='flex items-center justify-between gap-4 p-3 mx-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'>
                                    <div className="flex items-center gap-4"><Store className='text-blue-500' /> {t('following')}</div>
                                    {connections.length > 0 && <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{connections.length}</span>}
                                </Link>

                                {connections.length > 0 && (
                                    <div className="pl-4 pr-2 pb-2 mb-2 overflow-x-auto scrollbar-hide flex gap-3 border-b border-gray-50">
                                        {connections.slice(0, 6).map((shop: any) => (
                                            <div key={shop._id} onClick={() => { router.push(`/shop/${shop._id}`); close(); }} className="flex flex-col items-center gap-1 min-w-[50px] cursor-pointer">
                                                <div className="w-10 h-10 rounded-full border border-gray-200 relative overflow-hidden">
                                                    <Image src={shop.image || "/avatar.png"} fill alt={shop.name} className="object-cover" />
                                                </div>
                                                <span className="text-[9px] text-gray-500 truncate w-full text-center">{shop.name?.split(' ')[0]}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Link href="/reels" onClick={close} className='flex items-center gap-4 p-3 mx-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'>
                                    <PlayCircle className='text-pink-500' /> {t('reels')}
                                </Link>
                                <Link href="/user/my-orders" onClick={close} className='flex items-center gap-4 p-3 mx-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'>
                                    <ShoppingBag className='text-gray-400' /> {t('myOrders')}
                                </Link>
                                <Link href="/user/profile" onClick={close} className='flex items-center gap-4 p-3 mx-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'>
                                    <UserCircle className='text-gray-400' /> {t('myAccount')}
                                </Link>

                                {(user.role === 'seller' || user.sellerStatus === 'approved') && (
                                     <Link href="/seller/dashboard" onClick={close} className='flex items-center gap-4 p-3 mx-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'>
                                        <LayoutDashboard className='text-gray-400' /> {t('sellerDashboard')}
                                     </Link>
                                )}
                                
                                {user.role === 'user' && user.sellerStatus !== 'approved' && (
                                    <Link href="/apply/seller" onClick={close} className='flex items-center gap-4 p-3 mx-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'>
                                        <Store className='text-gray-400' /> {t('becomeSeller')}
                                    </Link>
                                )}

                                {(user.role === 'admin') && (
                                    <Link href="/admin/dashboard" onClick={close} className='flex items-center gap-4 p-3 mx-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'>
                                        <ShieldCheck className='text-gray-400' /> Admin Dashboard
                                    </Link>
                                )}

                                {(user.role === 'deliveryBoy') && (
                                    <Link href="/delivery/dashboard" onClick={close} className='flex items-center gap-4 p-3 mx-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'>
                                        <Bike className='text-gray-400' /> Delivery Dashboard
                                    </Link>
                                )}

                                {(user.role === 'hub') && (
                                    <Link href="/hub/dashboard" onClick={close} className='flex items-center gap-4 p-3 mx-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'>
                                        <Store className='text-gray-400' /> Hub Dashboard
                                    </Link>
                                )}

                                <div className='flex items-center justify-between p-3 mx-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'>
                                    <div className='flex items-center gap-4'>
                                        <Globe className='text-gray-400 w-5 h-5' /> Language
                                    </div>
                                    <LanguageSwitcher />
                                </div>

                                <div className='pt-2'>
                                    <button onClick={() => setJobsOpen(!jobsOpen)} className='w-full flex items-center justify-between p-3 mx-2 pr-6 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'>
                                        <div className='flex items-center gap-4'>
                                            <Briefcase className='text-gray-400' /> {t('workOpportunities')}
                                        </div>
                                        <ChevronDown className={`w-4 h-4 transition ${jobsOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {jobsOpen && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className='overflow-hidden bg-gray-50 mx-4 rounded-lg'>
                                                <Link href="/apply/delivery" onClick={close} className='flex items-center gap-3 p-3 text-sm text-gray-600 hover:text-green-600'>
                                                    <Bike className='w-4 h-4' /> {t('becomeDeliveryPartner')}
                                                </Link>
                                                <Link href="/apply/technical" onClick={close} className='flex items-center gap-3 p-3 text-sm text-gray-600 hover:text-blue-600 border-t border-gray-100'>
                                                    <Laptop className='w-4 h-4' /> {t('technicalJobs')}
                                                </Link>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <Link href="/refer-earn" onClick={close} className='flex items-center gap-4 p-3 mx-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'>
                                    <Share2 className='text-green-600' /> {t('referAndEarn')}
                                </Link>
                            </div>
                            <div className='p-4 border-t border-gray-100'>
                                <button onClick={() => signOut({ callbackUrl: "/login" })} className='w-full flex items-center justify-center gap-2 text-red-600 bg-red-50 font-bold text-sm p-3 rounded-xl hover:bg-red-100 transition-all'>
                                    <LogOut className='w-4 h-4' /> {t('logOut')}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>,
            document.body
        );
    };

    const EnhancedSwitcher = () => (
        <div onClick={() => dispatch(toggleMode())} className="cursor-pointer group relative h-10 w-32 bg-gray-100 rounded-full p-1 flex items-center shadow-inner border border-gray-200 transition-colors mx-2 shrink-0">
            <motion.div 
                layout
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`absolute h-8 w-[58px] rounded-full shadow-sm flex items-center justify-center z-10 ${isGrocery ? 'left-1 bg-gradient-to-r from-lime-400 to-green-500' : 'left-[66px] bg-gradient-to-r from-blue-400 to-indigo-500'}`}
            >
                {isGrocery ? <Home className="text-white w-4 h-4" /> : <BookOpen className="text-white w-4 h-4" />}
            </motion.div>
            <div className={`z-0 w-1/2 flex justify-center text-[10px] font-bold uppercase tracking-wide transition-colors duration-300 ${isGrocery ? 'text-transparent' : 'text-gray-400'}`}>{t('farm')}</div>
            <div className={`z-0 w-1/2 flex justify-center text-[10px] font-bold uppercase tracking-wide transition-colors duration-300 ${!isGrocery ? 'text-transparent' : 'text-gray-400'}`}>{t('study')}</div>
        </div>
    )

    return (
        <>
            <GeoUpdater type="user" />
            
            {/* âœ… FIXED: Sidebar Portal is always rendered */}
            {renderSidebar()}
            <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
            <HubSelectorModal isOpen={isHubModalOpen} onClose={() => setIsHubModalOpen(false)} forceSelection={!user.connectedHub} />

            {/* âœ… ONLY render visible Top Bar on Home Page */}
            {isHomePage && (
                <div className="fixed top-0 left-0 w-full z-50 flex flex-col bg-white shadow-sm">
                    <div className='w-full h-16 px-4 md:px-6 lg:px-8 flex items-center justify-between gap-4'>
                        <div className='flex items-center gap-3'>
                            <Link href={"/"} className={`font-black text-xl md:text-2xl tracking-tight flex items-center gap-1.5 ${themeColor}`}>
                                {isGrocery ? <Tractor className='w-6 h-6 md:w-7 md:h-7' strokeWidth={2.5} /> : <BookOpen className='w-6 h-6 md:w-7 md:h-7' strokeWidth={2.5} />}
                                <span className='hidden min-[380px]:inline'>{isGrocery ? common('dehatiSathi') : common('studentZone')}</span>
                            </Link>
                        </div>

                        <div className='hidden md:flex flex-1 max-w-md lg:max-w-xl mx-4'>
                            <SearchBar />
                        </div>

                        <div className='flex items-center gap-2 md:gap-4'>
                            <Link href={"/user/cart"} className='relative p-2.5 hover:bg-gray-100 rounded-full transition shrink-0'>
                                <ShoppingCartIcon className='w-6 h-6 text-gray-600' />
                                {cartData.length > 0 && (
                                    <span className={`absolute top-0 right-0 ${gradientBg} text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold border-2 border-white`}>
                                        {cartData.length}
                                    </span>
                                )}
                            </Link>

                            <NotificationBell />
                            <EnhancedSwitcher />
                            {/* ðŸ‘‡ FIXED: Desktop Profile click toggles Sidebar */}
                            <div 
                                onClick={toggle} 
                                className='hidden md:block w-10 h-10 relative rounded-full border border-gray-200 cursor-pointer overflow-hidden shadow-sm hover:ring-2 ring-offset-1 ring-gray-200 shrink-0'
                            >
                                {user.image ? <Image src={user.image} alt='user' fill className='object-cover' /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><User className="text-gray-400 w-5 h-5" /></div>}
                            </div>
                        </div>
                    </div>

                    <div className={`w-full py-2 border-b transition-colors ${lightBg} ${borderTheme}`}>
                        <div className='w-full px-4 md:px-6 lg:px-8 flex items-center justify-between'>
                            <div className='flex items-center gap-3 overflow-hidden cursor-pointer w-full' onClick={() => setIsLocationModalOpen(true)}>
                                <MapPin className={`w-4 h-4 md:w-5 md:h-5 shrink-0 ${themeColor}`} fill="currentColor" fillOpacity={0.2} />
                                <div className='flex flex-col leading-none flex-1'>
                                    <span className='text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wide'>{t('deliveringTo')}</span>
                                    <span className='text-xs md:text-sm font-bold text-gray-800 truncate max-w-[250px] md:max-w-md'>
                                        {permissionGranted ? address : t('selectDeliveryLocation')}
                                    </span>
                                </div>
                            </div>
                            
                            <div className='flex items-center gap-2 pl-3 border-l border-gray-200 cursor-pointer hover:opacity-80 transition shrink-0' onClick={() => setIsHubModalOpen(true)}>
                                <div className='flex flex-col text-right leading-none'>
                                    <span className='text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wide'>Connected Hub</span>
                                    <span className={`text-xs md:text-sm font-bold ${user.connectedHub ? 'text-green-700' : 'text-orange-500'} flex items-center gap-1`}>
                                        <Store size={14}/> {user.connectedHub ? 'View Hub' : 'Select Hub'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='md:hidden p-3 bg-white border-b border-gray-100'>
                        <SearchBar />
                    </div>
                </div>
            )}
        </>
    )
}

export default Nav