'use client'
import React from 'react'
import GroceryItemCard from './GroceryItemCard'
import { ArrowRight } from 'lucide-react'

interface HorizontalRailProps {
    title: string;
    subtitle?: string;
    products: any[];
    icon: any;
    colorClass: string; 
    iconColorClass: string;
    showCardTimer?: boolean; 
}

export default function HorizontalRail({ 
    title, 
    subtitle, 
    products, 
    icon: Icon, 
    colorClass, 
    iconColorClass,
    showCardTimer = false 
}: HorizontalRailProps) {
    
    if (!products || products.length === 0) return null;

    return (
        <div className="mb-8">
            <div className={`rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden border ${colorClass}`}>
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg shadow-sm bg-white border border-opacity-50`}>
                            <Icon className={`w-5 h-5 ${iconColorClass}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 leading-none">{title}</h3>
                            {subtitle && <p className="text-[11px] font-medium mt-1 text-gray-500">{subtitle}</p>}
                        </div>
                    </div>
                    <div className='p-1.5 bg-white rounded-full shadow-sm cursor-pointer opacity-70 hover:opacity-100 transition'>
                        <ArrowRight className="w-4 h-4 text-gray-600" />
                    </div>
                </div>
                
                {/* Horizontal Scroll with FIXED WIDTHS */}
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 relative z-10 items-stretch">
                    {products.map((item) => (
                        <div key={item._id} className="snap-center shrink-0 min-w-[200px] w-[200px] md:min-w-[260px] md:w-[260px]">
                            <div className="h-full bg-white rounded-xl shadow-sm border border-opacity-50 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                <GroceryItemCard item={item} showTimer={showCardTimer} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}