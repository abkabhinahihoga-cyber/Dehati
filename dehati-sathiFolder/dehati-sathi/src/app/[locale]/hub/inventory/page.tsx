'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { Package, Clock, CheckCircle2, Truck, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface GSTProduct {
  _id: string
  name: string
  nameHindi: string
  image: string
  unit: string
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

function HubInventoryPage() {
  const [products, setProducts] = useState<GSTProduct[]>([])
  const [requests, setRequests] = useState<StockRequest[]>([])
  const [loading, setLoading] = useState(true)
  
  // For the request modal
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [quantity, setQuantity] = useState(10)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/hub/stock-requests')
      setProducts(data.gstProducts)
      setRequests(data.requests)
    } catch {
      toast.error('Failed to load inventory data')
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
      toast.success('Stock request sent to Admin')
      setShowModal(false)
      fetchData()
    } catch {
      toast.error('Failed to send request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmReceipt = async (requestId: string) => {
    if (!confirm('Confirm that you have physically received this stock?')) return
    try {
      await axios.put('/api/hub/stock-requests', { requestId })
      toast.success('Stock receipt confirmed!')
      fetchData()
    } catch {
      toast.error('Failed to confirm receipt')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>
      case 'approved': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>
      case 'shipped': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><Truck className="w-3 h-3"/> Shipped</span>
      case 'received': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Received</span>
      default: return null
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
              <Package className="w-7 h-7 text-blue-600" /> GST Product Inventory
            </h1>
            <p className="text-blue-700 text-sm mt-1">Manage stock levels for Admin-supplied products.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-md">
            <Plus className="w-5 h-5" /> Request Stock
          </button>
        </div>

        {/* Requests History */}
        <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-blue-50 bg-blue-50/50">
            <h2 className="font-bold text-blue-900">Stock Requests History</h2>
          </div>
          
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No stock requests yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {requests.map(req => (
                <div key={req._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {req.masterProductId?.image ? (
                        <Image src={req.masterProductId.image} alt="img" width={48} height={48} className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center">📦</div>}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{req.masterProductId?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString()} • {req.quantity} {req.masterProductId?.unit}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {getStatusBadge(req.status)}
                    {req.status === 'shipped' && (
                      <button onClick={() => handleConfirmReceipt(req._id)} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                        Confirm Receipt
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Request Stock from Admin</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Select Product</label>
                <select required value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none">
                  <option value="">-- Choose GST Product --</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} (per {p.unit})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Quantity</label>
                <input type="number" min="1" required value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default HubInventoryPage