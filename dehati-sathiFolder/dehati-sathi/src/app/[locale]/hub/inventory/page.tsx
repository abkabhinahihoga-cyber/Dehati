'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { Package, Clock, CheckCircle2, Truck, Plus, Loader2, Store } from 'lucide-react'
import { toast } from 'sonner'
import { usePathname } from 'next/navigation'

interface Product {
  _id: string
  name: string
  nameHindi?: string
  images?: string[]
  image?: string // legacy
  unit: string
  category: string
  stock?: number
  isHubProduct?: boolean
  seller?: { name: string }
}

interface StockRequest {
  _id: string
  masterProductId: {
    _id: string
    name: string
    nameHindi: string
    image: string
    unit: string
  }
  quantity: number
  status: 'pending' | 'approved' | 'shipped' | 'received'
  createdAt: string
}

export default function HubInventoryPage() {
  const pathname = usePathname()
  const isHindi = pathname.startsWith('/hi')

  const [products, setProducts] = useState<Product[]>([])
  const [gstProducts, setGstProducts] = useState<any[]>([])
  const [requests, setRequests] = useState<StockRequest[]>([])
  const [loading, setLoading] = useState(true)
  
  // For the request modal
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [quantity, setQuantity] = useState(10)
  const [submitting, setSubmitting] = useState(false)

  const t = {
    title: isHindi ? 'हब इन्वेंटरी' : 'Hub Inventory',
    subtitle: isHindi ? 'जीएसटी और विक्रेता उत्पादों के स्टॉक स्तरों को प्रबंधित और ट्रैक करें।' : 'Manage and track stock levels for GST and seller products.',
    requestStock: isHindi ? 'स्टॉक का अनुरोध करें' : 'Request Stock',
    stockDetails: isHindi ? 'स्टॉक विवरण' : 'Stock Details',
    noProducts: isHindi ? 'कोई उत्पाद नहीं है।' : 'No products configured.',
    bySeller: isHindi ? 'विक्रेता:' : 'By:',
    hub: isHindi ? 'हब' : 'Hub',
    gstProduct: isHindi ? 'जीएसटी उत्पाद' : 'GST Product',
    stock: isHindi ? 'स्टॉक:' : 'Stock:',
    stockHistory: isHindi ? 'स्टॉक अनुरोध इतिहास' : 'Stock Requests History',
    noRequests: isHindi ? 'अभी तक कोई स्टॉक अनुरोध नहीं है।' : 'No stock requests yet.',
    pending: isHindi ? 'लंबित' : 'Pending',
    approved: isHindi ? 'स्वीकृत' : 'Approved',
    shipped: isHindi ? 'शिप कर दिया' : 'Shipped',
    received: isHindi ? 'प्राप्त हुआ' : 'Received',
    confirmReceiptBtn: isHindi ? 'प्राप्ति की पुष्टि करें' : 'Confirm Receipt',
    confirmReceiptPrompt: isHindi ? 'क्या आप पुष्टि करते हैं कि आपको यह स्टॉक भौतिक रूप से प्राप्त हो गया है?' : 'Confirm that you have physically received this stock?',
    reqModalTitle: isHindi ? 'एडमिन से स्टॉक का अनुरोध करें' : 'Request Stock from Admin',
    selectProduct: isHindi ? 'उत्पाद चुनें' : 'Select Product',
    chooseGst: isHindi ? '-- जीएसटी उत्पाद चुनें --' : '-- Choose GST Product --',
    qty: isHindi ? 'मात्रा' : 'Quantity',
    cancel: isHindi ? 'रद्द करें' : 'Cancel',
    sendReq: isHindi ? 'अनुरोध भेजें' : 'Send Request',
    successReq: isHindi ? 'स्टॉक अनुरोध एडमिन को भेजा गया' : 'Stock request sent to Admin',
    failReq: isHindi ? 'अनुरोध भेजने में विफल' : 'Failed to send request',
    successConfirm: isHindi ? 'स्टॉक प्राप्ति की पुष्टि हो गई!' : 'Stock receipt confirmed!',
    failConfirm: isHindi ? 'पुष्टि करने में विफल' : 'Failed to confirm receipt',
    failLoad: isHindi ? 'इन्वेंट्री डेटा लोड करने में विफल' : 'Failed to load inventory data',
  }

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [requestsRes, posInventoryRes] = await Promise.all([
        axios.get('/api/hub/stock-requests'),
        axios.get('/api/hub/pos/inventory') // This returns all products including seller ones
      ])
      
      setGstProducts(requestsRes.data.gstProducts || [])
      setRequests(requestsRes.data.requests || [])
      setProducts(posInventoryRes.data.products || [])
    } catch {
      toast.error(t.failLoad)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || quantity < 1) return
    setSubmitting(true)
    try {
      await axios.post('/api/hub/stock-requests', { masterProductId: selectedProduct, quantity })
      toast.success(t.successReq)
      setShowModal(false)
      fetchData()
    } catch {
      toast.error(t.failReq)
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmReceipt = async (requestId: string) => {
    if (!confirm(t.confirmReceiptPrompt)) return
    try {
      await axios.put('/api/hub/stock-requests', { requestId })
      toast.success(t.successConfirm)
      fetchData()
    } catch {
      toast.error(t.failConfirm)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> {t.pending}</span>
      case 'approved': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {t.approved}</span>
      case 'shipped': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><Truck className="w-3 h-3"/> {t.shipped}</span>
      case 'received': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {t.received}</span>
      default: return null
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
              <Store className="w-7 h-7 text-blue-600" /> {t.title}
            </h1>
            <p className="text-blue-700 text-sm mt-1">{t.subtitle}</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md w-full md:w-auto">
            <Plus className="w-5 h-5" /> {t.requestStock}
          </button>
        </div>

        {/* Local Stock Summary Grid */}
        <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-4 md:p-6">
          <h2 className="font-bold text-gray-800 text-lg mb-4">{t.stockDetails}</h2>
          {products.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noProducts}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {products.map(p => {
                const imgStr = p.images?.[0] || p.image || ''
                return (
                  <div key={p._id} className="border border-gray-200 hover:border-blue-300 rounded-2xl p-3 bg-gray-50 hover:bg-white transition-colors flex flex-col justify-between shadow-sm">
                    <div className="aspect-square bg-white rounded-xl overflow-hidden mb-3 relative border border-gray-100">
                      {imgStr ? (
                        <Image src={imgStr} alt={p.name} fill className="object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-800 line-clamp-1">
                        {isHindi && p.nameHindi ? p.nameHindi : p.name}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate mt-0.5">
                        {t.bySeller} <span className="font-semibold text-gray-700">{p.seller?.name || t.hub}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                          {p.category}
                        </span>
                        {p.isHubProduct && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {t.gstProduct}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-medium">{t.stock}</span>
                      <span className={`text-sm font-black ${p.stock && p.stock > 5 ? 'text-green-600' : 'text-red-500'}`}>
                        {p.stock === 999 ? '∞' : (p.stock || 0)} <span className="text-xs font-normal text-gray-500">{p.unit}</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Requests History */}
        <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-blue-50 bg-blue-50/50">
            <h2 className="font-bold text-blue-900">{t.stockHistory}</h2>
          </div>
          
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>{t.noRequests}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {requests.map(req => (
                <div key={req._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                      {req.masterProductId?.image ? (
                        <Image src={req.masterProductId.image} alt="img" fill className="object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center">📦</div>}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">
                        {isHindi && req.masterProductId?.nameHindi ? req.masterProductId.nameHindi : (req.masterProductId?.name || 'Unknown')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(req.createdAt).toLocaleDateString()} • <span className="font-semibold text-gray-700">{req.quantity} {req.masterProductId?.unit}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                    {getStatusBadge(req.status)}
                    {req.status === 'shipped' && (
                      <button onClick={() => handleConfirmReceipt(req._id)} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-colors">
                        {t.confirmReceiptBtn}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-5">{t.reqModalTitle}</h2>
            <form onSubmit={handleCreateRequest} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{t.selectProduct}</label>
                <select required value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer">
                  <option value="">{t.chooseGst}</option>
                  {gstProducts.map(p => (
                    <option key={p._id} value={p._id}>
                      {isHindi && p.nameHindi ? p.nameHindi : p.name} (per {p.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{t.qty}</label>
                <input type="number" min="1" required value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">{t.cancel}</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center transition-colors shadow-lg shadow-blue-200">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t.sendReq}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}