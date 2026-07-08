'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { TrendingUp } from 'lucide-react'

interface MandiBhav {
  _id: string
  price: number
  retailPrice?: number
  retailMinPrice?: number
  retailMaxPrice?: number
  wholesalePrice?: number
  wholesaleMinPrice?: number
  wholesaleMaxPrice?: number
  updatedAt?: string
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

  if (!hubId || loading) return null

  const range = (min?: number, max?: number, fallback?: number) => {
    const low = min || fallback || 0
    const high = max || fallback || 0
    return low === high ? `₹${low}` : `₹${low}-${high}`
  }

  const displayData = data.length > 0 ? data : ([
    { _id: 'f1', product: { name: 'Onion', nameHindi: 'प्याज', unit: 'kg' }, retailPrice: 35, wholesalePrice: 28 },
    { _id: 'f2', product: { name: 'Potato', nameHindi: 'आलू', unit: 'kg' }, retailPrice: 25, wholesalePrice: 18 },
    { _id: 'f3', product: { name: 'Tomato', nameHindi: 'टमाटर', unit: 'kg' }, retailPrice: 40, wholesalePrice: 32 },
    { _id: 'f4', product: { name: 'Garlic', nameHindi: 'लहसुन', unit: 'kg', category: '' }, retailPrice: 200, wholesalePrice: 170, price: 200 },
  ] as any[]) as MandiBhav[];

  return (
    <div className="bg-gradient-to-r from-green-50 via-white to-emerald-50 border-y border-green-100 overflow-hidden relative shadow-sm flex items-stretch">
      <div className="flex items-center gap-2 font-bold text-green-800 text-xs md:text-sm whitespace-nowrap bg-gradient-to-r from-green-50 to-emerald-50 pl-4 pr-3 py-3 z-10 border-r border-green-200 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
        <TrendingUp className="w-4 h-4 text-green-600" />
        मंडी भाव
      </div>

      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div className="flex gap-3 items-center w-max animate-marquee hover:pause pl-4 py-2">
          {[...displayData, ...displayData, ...displayData, ...displayData].map((item, index) => (
            <div key={`${item._id}-${index}`} className="flex items-center gap-2 whitespace-nowrap text-sm bg-white/85 border border-green-100 rounded-xl px-3 py-1.5 shadow-sm">
              <span className="font-black text-gray-800 text-xs md:text-sm">{item.product.nameHindi || item.product.name}</span>
              <span className="text-gray-400 text-[10px] md:text-xs">/ {item.product.unit}</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 text-[11px]">
                खुदरा {range(item.retailMinPrice, item.retailMaxPrice, item.retailPrice || item.price)}
              </span>
              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100 text-[11px]">
                थोक {range(item.wholesaleMinPrice, item.wholesaleMaxPrice, item.wholesalePrice)}
              </span>
              {item.updatedAt && (
                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                  अपडेट {new Date(item.updatedAt).toLocaleDateString('hi-IN')}
                </span>
              )}
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
          animation: marquee 34s linear infinite;
        }
        .hover\\:pause:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  )
}
