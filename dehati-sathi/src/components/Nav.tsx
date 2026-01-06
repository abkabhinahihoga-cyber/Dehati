'use client'
import { Boxes, ClipboardCheck, LogOut, LogOutIcon, Menu, PlusCircle, Search, SearchIcon, ShoppingBag, ShoppingCartIcon, User, X } from 'lucide-react'
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
        setMounted(true) // Ensure portal only renders on client
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
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMenuOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
                        />
                        {/* Sidebar Content */}
                        <motion.div
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                            className='fixed top-0 left-0 h-full w-[80%] sm:w-[350px] z-[100] bg-gradient-to-b from-green-800 via-green-700 to-green-900 shadow-2xl flex flex-col p-6 text-white'
                        >
                            <div className='flex justify-between items-center mb-6'>
                                <h1 className='font-extrabold text-2xl tracking-wide'>
                                    {user.role === 'admin' ? 'Admin Panel' : 'Seller Panel'}
                                </h1>
                                <button onClick={() => setMenuOpen(false)} className='p-2 hover:bg-white/10 rounded-full transition'>
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className='flex items-center gap-4 p-4 rounded-2xl bg-white/10 border border-white/10 shadow-inner'>
                                <div className='relative w-14 h-14 rounded-full overflow-hidden border-2 border-green-400'>
                                    {user.image ? (
                                        <Image src={user.image} alt='user' fill className='object-cover' />
                                    ) : (
                                        <div className="w-full h-full bg-green-100 flex items-center justify-center">
                                            <User className="text-green-700 w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <h2 className='text-lg font-bold truncate'>{user.name}</h2>
                                    <p className='text-xs text-green-300 capitalize font-medium'>{user.role}</p>
                                </div>
                            </div>

                            <div className='flex flex-col gap-3 mt-8 grow'>
                                {user.role === 'seller' && (
                                    <>
                                        <Link href="/seller/add-grocery" onClick={() => setMenuOpen(false)} className='flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all'>
                                            <PlusCircle className='w-5 h-5' /> Add Products
                                        </Link>
                                        <Link href="/seller/products" onClick={() => setMenuOpen(false)} className='flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all'>
                                            <Boxes className='w-5 h-5' /> View Products
                                        </Link>
                                    </>
                                )}
                                {user.role === 'admin' && (
                                    <Link href="/admin/orders" onClick={() => setMenuOpen(false)} className='flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all'>
                                        <ClipboardCheck className='w-5 h-5' /> Manage Orders
                                    </Link>
                                )}
                            </div>

                            <button 
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className='flex items-center gap-3 text-red-300 font-bold p-4 rounded-xl hover:bg-red-500/20 transition-all mb-4'
                            >
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
        <div className='w-[95%] fixed top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-green-700 rounded-2xl shadow-lg flex justify-between items-center h-20 px-4 md:px-8 z-50'>
            <Link href={"/"} className='text-white font-extrabold text-2xl sm:text-3xl tracking-wide hover:scale-105 transition-transform'>
                Dehati Sathi
            </Link>

            {/* Icons Section */}
            <div className='flex items-center gap-3 md:gap-6 relative'>
                {user.role === "user" && (
                    <>
                        <div className='bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:scale-105 transition md:hidden cursor-pointer'
                            onClick={() => setSearchBarOpen(true)}>
                            <SearchIcon className='text-green-600 w-5 h-5' />
                        </div>
                        <Link href={"/cart"} className='relative bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:scale-105 transition'>
                            <ShoppingCartIcon className='text-green-600 w-5 h-5' />
                            <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold'>0</span>
                        </Link>
                    </>
                )}

                {/* Show Hamburger for Seller and Admin on Mobile */}
                {(user.role === 'seller' || user.role === 'admin') && (
                    <div className='md:hidden bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md cursor-pointer' 
                         onClick={() => setMenuOpen(true)}>
                        <Menu className='text-green-600 w-6 h-6' />
                    </div>
                )}

                {/* Desktop Menu for Roles */}
                <div className='hidden md:flex items-center gap-4'>
                    {user.role === 'seller' && (
                        <>
                            <Link href="/seller/add-grocery" className='flex items-center gap-2 bg-white text-green-700 font-semibold px-4 py-2 rounded-full hover:bg-green-100 transition-all'>
                                <PlusCircle className='w-5 h-5' />Add Products
                            </Link>
                            <Link href="/seller/products" className='flex items-center gap-2 bg-white text-green-700 font-semibold px-4 py-2 rounded-full hover:bg-green-100 transition-all'>
                                <Boxes className='w-5 h-5' />View Products
                            </Link>
                        </>
                    )}
                    {user.role === "admin" && (
                        <Link href="/admin/orders" className='flex items-center gap-2 bg-white text-green-700 font-semibold px-4 py-2 rounded-full hover:bg-green-100 transition-all'>
                            <ClipboardCheck className='w-5 h-5' /> Manage Orders
                        </Link>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className='relative' ref={profileDropDown}>
                    <div className='bg-white rounded-full w-11 h-11 flex items-center justify-center overflow-hidden shadow-md hover:scale-105 transition-transform cursor-pointer' 
                         onClick={() => setOpen(prev => !prev)}>
                        {user.image ? (
                            <Image src={user.image} alt='user' width={44} height={44} className='object-cover' />
                        ) : (
                            <User className="text-green-700" />
                        )}
                    </div>

                    <AnimatePresence>
                        {open && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                className='absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 z-[60]'
                            >
                                <div className='flex items-center gap-3 px-3 py-2 border-b border-gray-200'>
                                    <div className='w-10 h-10 relative rounded-full bg-green-200 flex items-center justify-center overflow-hidden'>
                                        {user.image ? <Image src={user.image} alt='user' fill className='object-cover' /> : <User />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className='text-gray-800 font-semibold truncate'>{user.name}</div>
                                        <div className='text-xs text-gray-500 capitalize'>{user.role}</div>
                                    </div>
                                </div>
                                {user.role === "user" && (
                                    <Link href="/orders" onClick={() => setOpen(false)} className='flex items-center gap-2 px-3 py-3 hover:bg-green-50 rounded-lg text-gray-800 font-medium'>
                                        <ShoppingBag className='w-5 h-5 text-green-700' /> My Orders
                                    </Link>
                                )}
                                <button onClick={() => signOut({ callbackUrl: "/login" })} className='flex items-center gap-2 w-full text-left px-3 py-3 hover:bg-red-50 rounded-lg text-red-600 font-medium'>
                                    <LogOutIcon className='w-5 h-5' /> Log Out
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Mobile Search Overlay */}
            <AnimatePresence>
                {searchBarOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className='fixed top-24 left-1/2 -translate-x-1/2 w-[90%] bg-white rounded-full shadow-2xl z-[55] flex items-center px-4 py-3 border border-green-100'>
                        <SearchIcon className='text-gray-600 w-5 h-5 mr-2' />
                        <form className='grow'>
                            <input autoFocus type="text" placeholder='Search...' className='w-full outline-none text-gray-700' />
                        </form>
                        <button onClick={() => setSearchBarOpen(false)}>
                            <X className='text-gray-500 w-6 h-6' />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {renderSidebar()}
        </div>
    )
}

export default Nav