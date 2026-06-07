'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package, Users, LogOut, Store, MapPin, Menu, X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.endsWith(path);

  return (
    <div className="flex h-screen bg-gray-50 flex-col md:flex-row">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="font-black text-indigo-600 text-lg flex items-center gap-2">
            <MapPin className="fill-indigo-600 text-white" size={24}/> Hub Panel
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-gray-100 rounded-lg text-gray-600">
            {mobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      {/* SIDEBAR (Desktop & Mobile) */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-200 ease-in-out 
        md:translate-x-0 md:static md:flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h1 className="text-xl font-black text-indigo-600 flex items-center gap-2">
            <MapPin className="fill-indigo-600 text-white" /> Hub Panel
          </h1>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-gray-400"><X size={24}/></button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem href="/hub/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" active={isActive('/hub/dashboard')} onClick={() => setMobileMenuOpen(false)} />
          <NavItem href="/hub/inventory" icon={<Store size={20} />} label="Dehati Shop" active={isActive('/hub/inventory')} onClick={() => setMobileMenuOpen(false)} />
          <NavItem href="/hub/orders" icon={<Package size={20} />} label="Manage Orders" active={isActive('/hub/orders')} onClick={() => setMobileMenuOpen(false)} />
          <NavItem href="/hub/users" icon={<Users size={20} />} label="Linked Users" active={isActive('/hub/users')} onClick={() => setMobileMenuOpen(false)} />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-bold w-full transition-all">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>
      
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-20 md:hidden"></div>}

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active, onClick }: any) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
        active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
      }`}
    >
      {icon} {label}
    </Link>
  )
}