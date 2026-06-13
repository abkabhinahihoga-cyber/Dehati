'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { Package, Clock, CheckCircle2, Truck, XCircle, Loader2, RefreshCw } from 'lucide-react'
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
    category: string
  }
  quantity: number
  status: 'pending' | 'approved' | 'shipped' | 'received'
  createdAt: string
}

function AdminStockRequestsPage() {
  const [requests, setRequests] = useState<StockRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

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
    setActionLoading(requestId + action)
    try {
      await axios.put('/api/admin/stock-requests', { requestId, action })
      const labels: Record<string, string> = { approve: 'Approved ✓', ship: 'Marked as Shipped 🚚', reject: 'Rejected ✗' }
      toast.success(labels[action] || `Request ${action}d`)
      fetchData()
    } catch {
      toast.error(`Failed to ${action} request`)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> Pending</span>
      case 'approved': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/> Approved</span>
      case 'shipped': return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Truck className="w-3 h-3"/> Shipped</span>
      case 'received': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/> Received</span>
      default: return null
    }
  }

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    shipped: requests.filter(r => r.status === 'shipped').length,
    received: requests.filter(r => r.status === 'received').length,
  }

  const filtered = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus)

  const tabs: { key: string; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: 'bg-gray-600' },
    { key: 'pending', label: 'Pending', color: 'bg-orange-500' },
    { key: 'approved', label: 'Approved', color: 'bg-blue-600' },
    { key: 'shipped', label: 'Shipped', color: 'bg-purple-600' },
    { key: 'received', label: 'Received', color: 'bg-green-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
              <Package className="w-7 h-7 text-blue-600" /> Hub Stock Requests
            </h1>
            <p className="text-blue-700 text-sm mt-1">
              Approve, ship, or reject stock requests from hubs.
              {counts.pending > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {counts.pending} pending
                </span>
              )}
            </p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 bg-white border border-blue-200 text-blue-700 font-semibold px-4 py-2 rounded-xl hover:bg-blue-50 transition shadow-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                filterStatus === tab.key
                  ? `${tab.color} text-white shadow`
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filterStatus === tab.key ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                {counts[tab.key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {/* Workflow Guide */}
        <div className="bg-white border border-blue-100 rounded-2xl p-4 mb-5 flex items-center gap-4 flex-wrap shadow-sm">
          <div className="text-xs text-gray-500 font-semibold uppercase">Workflow:</div>
          {[
            { icon: '📥', label: 'Hub Requests', color: 'text-orange-600 bg-orange-50 border-orange-200' },
            { icon: '→', label: '', color: 'text-gray-400' },
            { icon: '✅', label: 'Admin Approves', color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { icon: '→', label: '', color: 'text-gray-400' },
            { icon: '🚚', label: 'Admin Ships', color: 'text-purple-600 bg-purple-50 border-purple-200' },
            { icon: '→', label: '', color: 'text-gray-400' },
            { icon: '📦', label: 'Hub Confirms Receipt', color: 'text-green-600 bg-green-50 border-green-200' },
          ].map((step, i) => (
            step.label
              ? <div key={i} className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1 ${step.color}`}>{step.icon} {step.label}</div>
              : <div key={i} className="text-gray-300 font-bold text-lg">{step.icon}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>
        ) : (
          <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_2fr_110px_1fr] gap-4 p-4 border-b border-blue-50 bg-blue-50/50 text-xs font-bold text-blue-800 uppercase">
              <div>Hub</div>
              <div>Product & Quantity</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package className="w-14 h-14 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No {filterStatus !== 'all' ? filterStatus : ''} requests found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map(req => {
                  const isLoading = (id: string) => actionLoading === req._id + id
                  return (
                    <div key={req._id} className={`grid grid-cols-[1fr_2fr_110px_1fr] gap-4 p-4 items-center hover:bg-gray-50 transition ${req.status === 'pending' ? 'border-l-4 border-orange-400' : req.status === 'approved' ? 'border-l-4 border-blue-400' : ''}`}>
                      {/* Hub */}
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{req.hubId?.name || 'Unknown Hub'}</div>
                        <div className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      </div>

                      {/* Product */}
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          {req.masterProductId?.image ? (
                            <Image src={req.masterProductId.image} alt="img" width={44} height={44} className="w-full h-full object-cover" />
                          ) : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 text-sm">{req.masterProductId?.name || 'Unknown'}</div>
                          {req.masterProductId?.category && (
                            <div className="text-[10px] text-gray-400">{req.masterProductId.category}</div>
                          )}
                          <div className="mt-1">
                            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                              Qty: {req.quantity} {req.masterProductId?.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div>{getStatusBadge(req.status)}</div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(req._id, 'approve')}
                              disabled={!!actionLoading}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm disabled:opacity-50"
                              title="Approve"
                            >
                              {isLoading('approve') ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(req._id, 'reject')}
                              disabled={!!actionLoading}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                              title="Reject"
                            >
                              {isLoading('reject') ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              Reject
                            </button>
                          </>
                        )}
                        {req.status === 'approved' && (
                          <button
                            onClick={() => handleAction(req._id, 'ship')}
                            disabled={!!actionLoading}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isLoading('ship') ? <Loader2 className="w-3 h-3 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                            Mark Shipped
                          </button>
                        )}
                        {(req.status === 'shipped' || req.status === 'received') && (
                          <span className="text-xs text-gray-400 italic">Awaiting hub</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminStockRequestsPage
