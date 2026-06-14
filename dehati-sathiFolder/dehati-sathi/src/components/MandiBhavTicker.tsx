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
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-y border-green-100 overflow-hidden relative shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center px-4 md:px-6 lg:px-8 py-2.5">
        
        {/* Title */}
        <div className="flex items-center gap-2 font-bold text-green-800 text-sm whitespace-nowrap bg-gradient-to-r from-green-50 to-emerald-50 pr-4 z-10 border-r border-green-200">
          <TrendingUp className="w-4 h-4 text-green-600" />
          Mandi Bhav
        </div>

        {/* Scroll Area */}
        <div className="overflow-x-auto no-scrollbar flex-1 pl-4 flex gap-6 items-center">
          {data.map(item => (
            <div key={item._id} className="flex items-center gap-2 whitespace-nowrap text-sm">
              <span className="font-semibold text-gray-800">{item.product.name}</span>
              <span className="text-gray-400 text-xs">({item.product.nameHindi})</span>
              <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-sm text-xs">
                R: ₹{item.retailPrice || item.price}
              </span>
              <span className="font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200 shadow-sm text-xs">
                W: ₹{item.wholesalePrice || 0}
              </span>
              <span className="text-xs font-medium text-gray-500">/ {item.product.unit}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
