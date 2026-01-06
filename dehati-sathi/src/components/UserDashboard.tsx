'use client'
import { Boxes, ClipboardCheck, LayoutDashboard, LogOut, LogOutIcon, Menu, SearchIcon, ShoppingBag, ShoppingCartIcon, Truck, User, X } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { signOut } from 'next-auth/react'
import { createPortal } from 'react-dom'

interface INavUser {
    _id?: string;
    name: string;
    email: string;
    role: "user" | "deliveryBoy" | "seller" | "admin";
    image?: string;
}

function Nav({ user }: { user: INavUser }) {
    const [open, setOpen] = useState(false)
    const profileDropDown = useRef<HTMLDivElement>(null)
    const [searchBarOpen, setSearchBarOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const handleClickOutside = (e: MouseEvent) => {
            if (profileDropDown.current && !profileDropDown.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const renderSidebar = () => {
        if (!mounted) return null;
        return createPortal(
            <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setMenuOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
                        />
                        <motion.div
                            initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
                            className='fixed top-0 left-0 h-full w-[80%] sm:w-[350px] z-[100] bg-green-900 shadow-2xl flex flex-col p-6 text-white'
                        >
                            <div className='flex justify-between items-center mb-8'>
                                <span className='font-bold text-xl'>Menu</span>
                                <button onClick={() => setMenuOpen(false)}><X /></button>
                            </div>

                            <div className='flex flex-col gap-4'>
                                <Link href="/" onClick={() => setMenuOpen(false)} className='flex items-center gap-3 p-3 rounded-xl hover:bg-white/10'>
                                    <ShoppingBag className='w-5 h-5' /> Home / Shop
                                </Link>

                                {/* Conditional Dashboard Links in Sidebar */}
                                {(user.role === 'seller' || user.role === 'admin') && (
                                    <Link href="/seller" onClick={() => setMenuOpen(false)} className='flex items-center gap-3 p-3 rounded-xl hover:bg-white/10'>
                                        <Boxes className='w-5 h-5' /> Seller Dashboard
                                    </Link>
                                )}
                                {(user.role === 'deliveryBoy' || user.role === 'admin') && (
                                    <Link href="/delivery" onClick={() => setMenuOpen(false)} className='flex items-center gap-3 p-3 rounded-xl hover:bg-white/10'>
                                        <Truck className='w-5 h-5' /> Delivery Panel
                                    </Link>
                                )}
                                {user.role === 'admin' && (
                                    <Link href="/admin" onClick={() => setMenuOpen(false)} className='flex items-center gap-3 p-3 rounded-xl hover:bg-white/10'>
                                        <ClipboardCheck className='w-5 h-5' /> Admin Panel
                                    </Link>
                                )}
                            </div>

                            <button onClick={() => signOut({ callbackUrl: "/login" })} className='mt-auto flex items-center gap-3 text-red-300 p-4'>
                                <LogOut className='w-5 h-5' /> Log Out
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>,
            document.body
        );
    };

    return (
        <div className='w-[95%] fixed top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-lg flex justify-between items-center h-20 px-4 md:px-8 z-50'>
            <Link href={"/"} className='text-white font-extrabold text-2xl tracking-wide'>
                Dehati Sathi
            </Link>

            <div className='flex items-center gap-3 md:gap-5'>
                {/* Search - Visible for everyone to explore products */}
                <div className='bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md cursor-pointer' onClick={() => setSearchBarOpen(true)}>
                    <SearchIcon className='text-green-600 w-5 h-5' />
                </div>
                
                {/* Cart - Visible for everyone */}
                <Link href={"/cart"} className='relative bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md'>
                    <ShoppingCartIcon className='text-green-600 w-5 h-5' />
                    <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold'>0</span>
                </Link>

                {/* Hamburger - Show only if user has a staff/admin role */}
                {user.role !== 'user' && (
                    <div className='md:hidden bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md cursor-pointer' onClick={() => setMenuOpen(true)}>
                        <Menu className='text-green-600 w-6 h-6' />
                    </div>
                )}

                {/* Profile Dropdown */}
                <div className='relative' ref={profileDropDown}>
                    <div className='bg-white rounded-full w-11 h-11 flex items-center justify-center overflow-hidden shadow-md cursor-pointer border-2 border-white' onClick={() => setOpen(!open)}>
                        {user.image ? <Image src={user.image} alt='user' width={44} height={44} className='object-cover' /> : <User className="text-green-700" />}
                    </div>

                    <AnimatePresence>
                        {open && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className='absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-[60]'>
                                <div className='flex items-center gap-3 px-3 py-2 border-b mb-2'>
                                    <div className='overflow-hidden'>
                                        <div className='text-gray-800 font-bold truncate text-sm'>{user.name}</div>
                                        <div className='text-[10px] text-green-600 font-bold uppercase'>{user.role}</div>
                                    </div>
                                </div>

                                <Link href="/orders" onClick={() => setOpen(false)} className='flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm'>
                                    <ShoppingBag className='w-4 h-4 text-gray-400' /> My Orders
                                </Link>

                                {/* Management Redirects */}
                                {user.role !== "user" && (
                                    <>
                                        <div className="h-[1px] bg-gray-100 my-1" />
                                        {(user.role === 'seller' || user.role === 'admin') && (
                                            <Link href="/seller" onClick={() => setOpen(false)} className='flex items-center gap-3 px-3 py-2 hover:bg-green-50 rounded-lg text-sm font-semibold'>
                                                <LayoutDashboard className='w-4 h-4 text-green-600' /> Seller Dashboard
                                            </Link>
                                        )}
                                        {(user.role === 'deliveryBoy' || user.role === 'admin') && (
                                            <Link href="/delivery" onClick={() => setOpen(false)} className='flex items-center gap-3 px-3 py-2 hover:bg-green-50 rounded-lg text-sm font-semibold'>
                                                <Truck className='w-4 h-4 text-green-600' /> Delivery Panel
                                            </Link>
                                        )}
                                        {user.role === "admin" && (
                                            <Link href="/admin" onClick={() => setOpen(false)} className='flex items-center gap-3 px-3 py-2 hover:bg-red-50 rounded-lg text-sm font-semibold text-red-700'>
                                                <ClipboardCheck className='w-4 h-4' /> Admin Dashboard
                                            </Link>
                                        )}
                                    </>
                                )}

                                <button onClick={() => signOut({ callbackUrl: "/login" })} className='flex items-center gap-3 w-full px-3 py-2 mt-2 hover:bg-red-50 rounded-lg text-red-600 text-sm font-bold'>
                                    <LogOutIcon className='w-4 h-4' /> Log Out
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Mobile Search Overlay */}
            <AnimatePresence>
                {searchBarOpen && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className='fixed top-24 left-1/2 -translate-x-1/2 w-[90%] bg-white rounded-full shadow-2xl z-[55] flex items-center px-4 py-3 border border-green-100'>
                        <SearchIcon className='text-gray-600 w-5 h-5 mr-2' />
                        <input autoFocus type="text" placeholder='Search products...' className='grow outline-none text-gray-700 bg-transparent' />
                        <button onClick={() => setSearchBarOpen(false)}><X className='text-gray-500 w-6 h-6' /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {renderSidebar()}
        </div>
    )
}

export default Nav