'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Users, Filter, Phone, MapPin } from 'lucide-react'

export default function HubUsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [filter, setFilter] = useState('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get('/api/hub/users')
            .then(res => setUsers(res.data.users))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    const filteredUsers = users.filter(u => filter === 'all' || u.role === filter);

    if (loading) return <div className="p-8 text-indigo-600 font-bold">Loading Users...</div>

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
                <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    {['all', 'seller', 'deliveryBoy', 'user'].map((role) => (
                        <button 
                            key={role}
                            onClick={() => setFilter(role)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                                filter === role ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            {role === 'user' ? 'Customers' : role === 'deliveryBoy' ? 'Delivery' : role === 'all' ? 'All Users' : role + 's'}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                    <div key={user._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-gray-800">{user.name}</h3>
                                <p className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border
                                ${user.role === 'seller' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                  user.role === 'deliveryBoy' ? 'bg-green-50 text-green-600 border-green-100' :
                                  'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                {user.role}
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

                        {user.role === 'seller' && (
                            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center text-xs">
                                <span className="text-gray-400">Shop:</span>
                                <span className="font-bold text-gray-700">{user.sellerDetails?.shopName || 'N/A'}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                    No users found in this category.
                </div>
            )}
        </div>
    )
}