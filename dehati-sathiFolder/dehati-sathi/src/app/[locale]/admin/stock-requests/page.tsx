'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { Package, Clock, CheckCircle2, Truck, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface StockRequest {
  _id: string
  hubId: { _id: string, name: string }
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

function AdminStockRequestsPage() {
  const [requests, setRequests] = useState<StockRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/admin/stock-requests')
      setRequests(data.requests)
    } catch {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (requestId: string, action: string) => {
    try {
      await axios.put('/api/admin/stock-requests', { requestId, action })
      toast.success(`Request ${action}d`)
      fetchData()
    } catch {
      toast.error(`Failed to ${action} request`)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> Pending</span>
      case 'approved': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/> Approved</span>
      case 'shipped': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit"><Truck className="w-3 h-3"/> Shipped</span>
      case 'received': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/> Received</span>
      default: return null
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
              <Package className="w-7 h-7 text-blue-600" /> Hub Stock Requests
            </h1>
            <p className="text-blue-700 text-sm mt-1">Manage stock requests from hubs for GST products.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_2fr_100px_150px] gap-4 p-4 border-b border-blue-50 bg-blue-50/50 text-xs font-bold text-blue-800 uppercase">
            <div>Hub</div>
            <div>Product & Request</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>
          
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No stock requests yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {requests.map(req => (
                <div key={req._id} className="grid grid-cols-[1fr_2fr_100px_150px] gap-4 p-4 items-center hover:bg-gray-50 transition">
                  {/* Hub Info */}
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{req.hubId?.name || 'Unknown Hub'}</div>
                    <div className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</div>
                  </div>

                  {/* Product Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {req.masterProductId?.image ? (
                        <Image src={req.masterProductId.image} alt="img" width={40} height={40} className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center">📦</div>}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{req.masterProductId?.name || 'Unknown'}</div>
                      <div className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1">
                        Req: {req.quantity} {req.masterProductId?.unit}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div>{getStatusBadge(req.status)}</div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2">
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => handleAction(req._id, 'approve')} className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg shadow-sm" title="Approve">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleAction(req._id, 'reject')} className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg shadow-sm" title="Reject">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {req.status === 'approved' && (
                      <button onClick={() => handleAction(req._id, 'ship')} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Ship
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminStockRequestsPage
