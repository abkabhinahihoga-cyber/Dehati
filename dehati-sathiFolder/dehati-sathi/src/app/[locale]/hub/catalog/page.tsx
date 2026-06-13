'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { CheckSquare, Square, Loader2, Save, IndianRupee, TrendingUp, Package, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface MandiBhav {
  retailMinPrice: number
  retailMaxPrice: number
  wholesaleMinPrice: number
  wholesaleMaxPrice: number
}

interface Product {
  _id: string
  name: string
  nameHindi: string
  category: string
  unit: string
  image: string
  description: string
  isEnabled: boolean
  mandiBhav: MandiBhav | null
}

type PriceEntry = {
  retailMinPrice: string
  retailMaxPrice: string
  wholesaleMinPrice: string
  wholesaleMaxPrice: string
}

function HubCatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'checklist' | 'prices'>('checklist')
  const [prices, setPrices] = useState<Record<string, PriceEntry>>({})

  useEffect(() => { fetchCatalog() }, [])

  const fetchCatalog = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/hub/catalog')
      setProducts(data.products)
      const priceInit: Record<string, PriceEntry> = {}
      data.products.forEach((p: Product) => {
        if (p.isEnabled) {
          priceInit[p._id] = {
            retailMinPrice: p.mandiBhav?.retailMinPrice?.toString() || '',
            retailMaxPrice: p.mandiBhav?.retailMaxPrice?.toString() || '',
            wholesaleMinPrice: p.mandiBhav?.wholesaleMinPrice?.toString() || '',
            wholesaleMaxPrice: p.mandiBhav?.wholesaleMaxPrice?.toString() || '',
          }
        }
      })
      setPrices(priceInit)
    } catch {
      toast.error('Failed to load catalog')
    } finally {
      setLoading(false)
    }
  }

  const toggleProduct = async (productId: string, currentEnabled: boolean) => {
    setToggling(productId)
    try {
      await axios.post('/api/hub/catalog', { productId, enable: !currentEnabled })
      setProducts(prev => prev.map(p =>
        p._id === productId ? { ...p, isEnabled: !currentEnabled } : p
      ))
      if (!currentEnabled) {
        setPrices(prev => ({ ...prev, [productId]: { retailMinPrice: '', retailMaxPrice: '', wholesaleMinPrice: '', wholesaleMaxPrice: '' } }))
      } else {
        setPrices(prev => { const n = { ...prev }; delete n[productId]; return n })
      }
      toast.success(!currentEnabled ? 'Product enabled for your hub' : 'Product disabled')
    } catch {
      toast.error('Failed to update')
    } finally {
      setToggling(null)
    }
  }

  const savePrices = async () => {
    setSaving(true)
    try {
      const enabledProducts = products.filter(p => p.isEnabled)
      const updates = enabledProducts.map(p => ({
        masterProductId: p._id,
        retailMinPrice: parseFloat(prices[p._id]?.retailMinPrice || '0'),
        retailMaxPrice: parseFloat(prices[p._id]?.retailMaxPrice || '0'),
        wholesaleMinPrice: parseFloat(prices[p._id]?.wholesaleMinPrice || '0'),
        wholesaleMaxPrice: parseFloat(prices[p._id]?.wholesaleMaxPrice || '0'),
      }))
      await axios.put('/api/hub/mandi-bhav', { updates })
      toast.success('Mandi Bhav prices saved!')
      fetchCatalog()
    } catch {
      toast.error('Failed to save prices')
    } finally {
      setSaving(false)
    }
  }

  const grouped = products.reduce((acc: Record<string, Product[]>, p) => {
    (acc[p.category] = acc[p.category] || []).push(p)
    return acc
  }, {})

  const enabledProducts = products.filter(p => p.isEnabled)

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin w-8 h-8 text-green-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-green-600" /> Hub Product Catalog
          </h1>
          <p className="text-green-700 text-sm mt-1">Enable products for your hub and set today's Mandi Bhav price range.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 text-center border border-green-100 shadow-sm">
            <div className="text-2xl font-bold text-green-700">{products.length}</div>
            <div className="text-xs text-gray-500">Available</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-emerald-200 shadow-sm">
            <div className="text-2xl font-bold text-emerald-600">{enabledProducts.length}</div>
            <div className="text-xs text-gray-500">Enabled</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-orange-200 shadow-sm">
            <div className="text-2xl font-bold text-orange-500">
              {enabledProducts.filter(p => prices[p._id]?.retailMinPrice || prices[p._id]?.wholesaleMinPrice).length}
            </div>
            <div className="text-xs text-gray-500">Priced</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1 mb-6">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'checklist' ? 'bg-green-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ✅ Enable Products
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'prices' ? 'bg-green-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span className="flex items-center justify-center gap-1.5"><IndianRupee className="w-4 h-4" /> Mandi Bhav</span>
          </button>
        </div>

        {/* Checklist Tab */}
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-green-50 border-b border-green-100">
                  <h3 className="font-bold text-green-800">{category}</h3>
                  <p className="text-xs text-green-600">{items.filter(i => i.isEnabled).length}/{items.length} enabled</p>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map(p => (
                    <button
                      key={p._id}
                      onClick={() => !toggling && toggleProduct(p._id, p.isEnabled)}
                      disabled={toggling === p._id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left w-full ${
                        p.isEnabled ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {toggling === p._id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                        ) : p.isEnabled ? (
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {p.image ? (
                          <Image src={p.image} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-lg">🌿</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-sm truncate">{p.name}</div>
                        {p.nameHindi && <div className="text-gray-500 text-xs">{p.nameHindi}</div>}
                        <div className="text-green-600 text-xs font-medium">per {p.unit}</div>
                      </div>
                      {p.isEnabled && (p.mandiBhav?.retailMinPrice || p.mandiBhav?.wholesaleMinPrice) ? (
                        <div className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-1 rounded-lg flex-shrink-0 flex flex-col gap-0.5">
                          <span>R: ₹{p.mandiBhav.retailMinPrice}–{p.mandiBhav.retailMaxPrice}</span>
                          <span>W: ₹{p.mandiBhav.wholesaleMinPrice}–{p.mandiBhav.wholesaleMaxPrice}</span>
                        </div>
                      ) : p.isEnabled ? (
                        <div className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-lg flex-shrink-0 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> No price
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mandi Bhav Tab */}
        {activeTab === 'prices' && (
          <div className="space-y-3">
            {enabledProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <TrendingUp className="w-14 h-14 mx-auto mb-3 opacity-30" />
                <p>No products enabled yet.</p>
                <p className="text-sm">Go to &quot;Enable Products&quot; tab first.</p>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <strong>Mandi Bhav</strong> — Set today&apos;s price range (Min &amp; Max) for Retail and Wholesale. Sellers can set any price within this range.
                  </div>
                </div>

                {/* Price Table — horizontally scrollable on mobile */}
                <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
                  <div style={{ minWidth: '540px' }}>

                    {/* Header row */}
                    <div className="grid grid-cols-[160px_1fr_1fr] gap-0 bg-gray-50 px-3 py-2.5 text-xs font-bold text-gray-500 uppercase border-b">
                      <div>Product</div>
                      <div className="text-center border-l border-gray-200 px-2 text-blue-700 bg-blue-50/60">Retail Price (₹)</div>
                      <div className="text-center border-l border-gray-200 px-2 text-purple-700 bg-purple-50/60">Wholesale Price (₹)</div>
                    </div>

                    {/* Sub-header row */}
                    <div className="grid grid-cols-[160px_1fr_1fr] gap-0 border-b bg-gray-50/50">
                      <div />
                      <div className="grid grid-cols-2 border-l border-gray-200">
                        <div className="text-[10px] font-bold text-blue-600 text-center py-1.5 border-r border-gray-100">Min</div>
                        <div className="text-[10px] font-bold text-blue-600 text-center py-1.5">Max</div>
                      </div>
                      <div className="grid grid-cols-2 border-l border-gray-200">
                        <div className="text-[10px] font-bold text-purple-600 text-center py-1.5 border-r border-gray-100">Min</div>
                        <div className="text-[10px] font-bold text-purple-600 text-center py-1.5">Max</div>
                      </div>
                    </div>

                    {/* Product rows */}
                    {enabledProducts.map((p, i) => (
                      <div key={p._id} className={`grid grid-cols-[160px_1fr_1fr] gap-0 items-center border-b last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                        {/* Product info */}
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {p.image ? (
                              <Image src={p.image} alt={p.name} width={36} height={36} className="object-cover w-full h-full" />
                            ) : <div className="flex items-center justify-center h-full">🌿</div>}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-800 text-xs truncate">{p.name}</div>
                            <div className="text-gray-400 text-[10px]">/{p.unit}</div>
                          </div>
                        </div>

                        {/* Retail Min / Max */}
                        <div className="grid grid-cols-2 gap-1.5 px-2 py-2 border-l border-gray-200">
                          <input
                            type="number" min="0" placeholder="Min"
                            value={prices[p._id]?.retailMinPrice || ''}
                            onChange={e => setPrices(prev => ({ ...prev, [p._id]: { ...prev[p._id], retailMinPrice: e.target.value } }))}
                            className="w-full px-1 py-1.5 border border-blue-300 rounded-lg text-sm font-bold text-blue-700 text-center focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                          <input
                            type="number" min="0" placeholder="Max"
                            value={prices[p._id]?.retailMaxPrice || ''}
                            onChange={e => setPrices(prev => ({ ...prev, [p._id]: { ...prev[p._id], retailMaxPrice: e.target.value } }))}
                            className="w-full px-1 py-1.5 border border-blue-200 rounded-lg text-sm text-blue-600 text-center focus:ring-2 focus:ring-blue-300 outline-none"
                          />
                        </div>

                        {/* Wholesale Min / Max */}
                        <div className="grid grid-cols-2 gap-1.5 px-2 py-2 border-l border-gray-200">
                          <input
                            type="number" min="0" placeholder="Min"
                            value={prices[p._id]?.wholesaleMinPrice || ''}
                            onChange={e => setPrices(prev => ({ ...prev, [p._id]: { ...prev[p._id], wholesaleMinPrice: e.target.value } }))}
                            className="w-full px-1 py-1.5 border border-purple-300 rounded-lg text-sm font-bold text-purple-700 text-center focus:ring-2 focus:ring-purple-400 outline-none"
                          />
                          <input
                            type="number" min="0" placeholder="Max"
                            value={prices[p._id]?.wholesaleMaxPrice || ''}
                            onChange={e => setPrices(prev => ({ ...prev, [p._id]: { ...prev[p._id], wholesaleMaxPrice: e.target.value } }))}
                            className="w-full px-1 py-1.5 border border-purple-200 rounded-lg text-sm text-purple-600 text-center focus:ring-2 focus:ring-purple-300 outline-none"
                          />
                        </div>
                      </div>
                    ))}

                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={savePrices}
                  disabled={saving}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                  {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                  Save Mandi Bhav Prices
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default HubCatalogPage
