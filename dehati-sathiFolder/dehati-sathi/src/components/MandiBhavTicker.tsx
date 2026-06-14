'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { TrendingUp, AlertCircle } from 'lucide-react'

interface MandiBhav {
  _id: string
  price: number
  retailPrice?: number
  wholesalePrice?: number
  product: {
    name: string
    nameHindi: string
    unit: string
    category: string
  }
}

export default function MandiBhavTicker({ hubId }: { hubId: string }) {
  const [data, setData] = useState<MandiBhav[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hubId) return
    const fetchMandi = async () => {
      try {
        const res = await axios.get(`/api/mandi-bhav/public?hubId=${hubId}`)
        if (res.data.success) setData(res.data.mandiBhav)
      } catch (err) {
        console.error("Failed to load mandi bhav", err)
      } finally {
        setLoading(false)
      }
    }
    fetchMandi()
  }, [hubId])

  if (!hubId || loading || data.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-y border-green-100 overflow-hidden relative shadow-sm flex items-center">
      
      {/* Title - Fixed on the left */}
      <div className="flex items-center gap-2 font-bold text-green-800 text-xs md:text-sm whitespace-nowrap bg-gradient-to-r from-green-50 to-emerald-50 pl-4 pr-3 py-2.5 z-10 border-r border-green-200 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
        <TrendingUp className="w-4 h-4 text-green-600" />
        Mandi Bhav
      </div>

      {/* Marquee Container */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div className="flex gap-6 items-center w-max animate-marquee hover:pause pl-4">
          {/* Duplicate items for infinite scroll effect */}
          {[...data, ...data].map((item, index) => (
            <div key={`${item._id}-${index}`} className="flex items-center gap-2 whitespace-nowrap text-sm">
              <span className="font-bold text-gray-800 text-xs md:text-sm">{item.product.name}</span>
              <span className="text-gray-500 text-[10px] md:text-xs">({item.product.nameHindi})</span>
              <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-100 shadow-sm text-xs">
                R: ₹{item.retailPrice || item.price}
              </span>
              <span className="font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-100 shadow-sm text-xs">
                W: ₹{item.wholesalePrice || 0}
              </span>
              <span className="text-[10px] md:text-xs font-medium text-gray-400">/ {item.product.unit}</span>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .hover\\:pause:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  )
}
