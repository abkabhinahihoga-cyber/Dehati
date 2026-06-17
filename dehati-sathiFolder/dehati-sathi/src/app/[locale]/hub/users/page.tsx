'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Users, Phone, MapPin, CheckCircle, XCircle, Store, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function HubUsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [filter, setFilter] = useState('pending')
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchUsers = () => {
        setLoading(true)
        axios.get('/api/hub/users')
            .then(res => setUsers(res.data.users))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchUsers() }, [])

    const handleAction = async (userId: string, action: 'approve' | 'reject') => {
        setActionLoading(userId + action)
        const toastId = toast.loading(action === 'approve' ? 'Approving seller...' : 'Rejecting application...')
        try {
            const res = await axios.put('/api/hub/users', { userId, action })
            if (res.data.success) {
                toast.success(
                    action === 'approve' ? 'Seller approved successfully!' : 'Application rejected.',
                    { id: toastId }
                )
                fetchUsers()
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Action failed', { id: toastId })
        } finally {
            setActionLoading(null)
        }
    }

    const pendingUsers = users.filter(u => u.sellerStatus === 'pending')
    const filteredUsers = filter === 'pending'
        ? pendingUsers
        : filter === 'all'
        ? users
        : users.filter(u => u.role === filter)

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    )

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        <Users className="text-indigo-600"/> Linked Users
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Sellers, Delivery Partners, and Customers in your zone.</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex-wrap gap-1">
                    {[
                        { id: 'pending', label: '⏳ Pending', count: pendingUsers.length },
                        { id: 'all', label: 'All Users' },
                        { id: 'seller', label: 'Sellers' },
                        { id: 'deliveryBoy', label: 'Delivery' },
                        { id: 'user', label: 'Customers' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all flex items-center gap-1.5 ${
                                filter === tab.id ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${filter === tab.id ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </header>

            {/* Pending Applications Banner */}
            {filter === 'pending' && pendingUsers.length > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                    <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" />
                    <p className="text-amber-800 text-sm font-semibold">
                        {pendingUsers.length} seller application{pendingUsers.length > 1 ? 's' : ''} waiting for your review.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => {
                    const isPending = user.sellerStatus === 'pending'
                    const isApprovingThis = actionLoading === user._id + 'approve'
                    const isRejectingThis = actionLoading === user._id + 'reject'

                    return (
                        <div key={user._id} className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all ${isPending ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-800">{user.name}</h3>
                                    <p className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                    isPending ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    user.role === 'seller' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                    user.role === 'deliveryBoy' ? 'bg-green-50 text-green-600 border-green-100' :
                                    'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                    {isPending ? '⏳ Pending' : user.role}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400"/> {user.mobile}
                                </div>
                                {user.location?.address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0"/>
                                        <span className="line-clamp-2 text-xs">{user.location.address}</span>
                                    </div>
                                )}
                            </div>

                            {/* Shop Details for sellers and pending */}
                            {(user.role === 'seller' || isPending) && user.sellerDetails?.shopName && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                        <Store size={12} className="text-orange-500"/>
                                        {user.sellerDetails.shopName}
                                    </div>
                                    {user.sellerDetails.shopAddress && (
                                        <p className="text-[11px] text-gray-500 line-clamp-1">{user.sellerDetails.shopAddress}</p>
                                    )}
                                    {user.sellerDetails.gstin && (
                                        <p className="text-[11px] text-gray-400">GSTIN: {user.sellerDetails.gstin}</p>
                                    )}
                                </div>
                            )}

                            {/* Approve / Reject Buttons for pending */}
                            {isPending && (
                                <div className="mt-4 pt-3 border-t border-amber-100 flex gap-2">
                                    <button
                                        onClick={() => handleAction(user._id, 'approve')}
                                        disabled={!!actionLoading}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                    >
                                        {isApprovingThis ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(user._id, 'reject')}
                                        disabled={!!actionLoading}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white border border-red-200 hover:bg-red-50 disabled:opacity-60 text-red-600 rounded-xl text-xs font-bold transition-all"
                                    >
                                        {isRejectingThis ? <Loader2 size={14} className="animate-spin"/> : <XCircle size={14}/>}
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    {filter === 'pending' ? (
                        <>
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3"/>
                            <p className="text-gray-600 font-bold">All Caught Up!</p>
                            <p className="text-gray-400 text-sm">No pending seller applications.</p>
                        </>
                    ) : (
                        <p className="text-gray-400">No users found in this category.</p>
                    )}
                </div>
            )}
        </div>
    )
}