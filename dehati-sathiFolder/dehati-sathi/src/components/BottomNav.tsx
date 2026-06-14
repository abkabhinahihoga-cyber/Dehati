'use client'
import React, { useEffect, useState } from 'react'
import { Home, PlayCircle, ShoppingBag, User, Store, Plus } from 'lucide-react'
import { Link, usePathname } from '@/i18n/routing'
import { useSidebar } from '@/context/SidebarContext'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { useTranslations } from 'next-intl'

export default function BottomNav({ user: propUser }: { user: any }) {
    const pathname = usePathname();
    const { toggle } = useSidebar(); 
    const t = useTranslations('Nav');
    
    // isActive check on bare pathname
    const isActive = (path: string) => pathname === path;

    // Data Logic
    const { data: session } = useSession();
    const reduxUser = useSelector((state: RootState) => (state as any).user || (state as any).auth);
    const [finalImage, setFinalImage] = useState<string | null>(null);

    useEffect(() => {
        const reduxImg = reduxUser?.user?.image || reduxUser?.image;
        const sessionImg = session?.user?.image;
        const propImg = propUser?.image;

        const bestImage = 
            (reduxImg && reduxImg.trim() !== "") ? reduxImg :
            (sessionImg && sessionImg.trim() !== "") ? sessionImg :
            (propImg && propImg.trim() !== "") ? propImg : 
            null;

        setFinalImage(bestImage);
    }, [session, reduxUser, propUser]);

    // HIDE ON AUTH PAGES
    const hideRoutes = ['/login', '/signup', '/register', '/welcome', '/forgot-password', '/onboarding', '/landing'];
    // Hide entirely on any hub routes
    if (hideRoutes.includes(pathname) || pathname.startsWith('/hub') || pathname.startsWith('/hi/hub') || pathname.startsWith('/en/hub')) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full z-50 md:hidden pb-safe glass shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border-t border-white/20">
            <div className="flex justify-around items-center h-16 relative">
                
                <Link href="/" className={`flex flex-col items-center gap-1 w-1/5 ${isActive('/') ? 'text-green-600' : 'text-gray-500'}`}>
                    <Home size={22} strokeWidth={isActive('/') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">{t('home')}</span>
                </Link>

                <Link href="/user/connections" className={`flex flex-col items-center gap-1 w-1/5 ${isActive('/user/connections') ? 'text-blue-600' : 'text-gray-500'}`}>
                    <Store size={22} strokeWidth={isActive('/user/connections') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">{t('shops')}</span>
                </Link>

                {/* Central Add Button */}
                <div className="w-1/5 flex justify-center -mt-6">
                    <Link 
                        href={reduxUser?.user?.role === 'seller' || session?.user?.role === 'seller' || propUser?.role === 'seller' ? "/seller/dashboard" : "/become-seller"} 
                        className="bg-green-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-green-200 border-4 border-white text-white hover:bg-green-700 transition-colors"
                    >
                        <Plus size={28} strokeWidth={2.5} />
                    </Link>
                </div>

                <Link href="/user/my-orders" className={`flex flex-col items-center gap-1 w-1/5 ${isActive('/user/my-orders') ? 'text-green-600' : 'text-gray-500'}`}>
                    <ShoppingBag size={22} strokeWidth={isActive('/user/my-orders') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">{t('orders')}</span>
                </Link>

                <button onClick={toggle} className={`flex flex-col items-center gap-1 w-1/5 text-gray-500`}>
                    <div className={`relative w-6 h-6 rounded-full overflow-hidden border-2 ${finalImage ? 'border-green-600 p-0.5' : 'border-transparent'}`}>
                        {finalImage ? (
                            <Image src={finalImage} alt={t('you')} fill className="object-cover rounded-full" sizes="30px" />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-full">
                                <User size={14} className="text-gray-500" />
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] font-medium text-gray-500">{t('you')}</span>
                </button>

            </div>
        </div>
    )
}