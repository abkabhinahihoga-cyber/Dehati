'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { ShoppingCart, User, Plus, Minus, Search, CreditCard, Banknote, Package, CheckCircle2, Loader2, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'

export default function HubPOSPage() {
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<{product: any, quantity: number}[]>([])
  const [paymentMode, setPaymentMode] = useState('cod')
  const [deliveryType, setDeliveryType] = useState('hub-pickup')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, inventoryRes] = await Promise.all([
          axios.get('/api/hub/users'),
          axios.get('/api/hub/inventory')
        ])
        setUsers(usersRes.data.users.filter((u: any) => u.role === 'user' || u.role === 'seller'))
        setProducts(inventoryRes.data.products)
      } catch (err) {
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.mobile.includes(searchQuery)
  )

  const addToCart = (product: any) => {
    if (product.stock <= 0) return toast.error('Out of stock')
    setCart(prev => {
      const existing = prev.find(item => item.product._id === product._id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Cannot add more than available stock')
          return prev
        }
        return prev.map(item => item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product._id === productId) {
        const newQ = item.quantity + delta
        if (newQ > item.product.stock) {
          toast.error('Stock limit reached')
          return item
        }
        return { ...item, quantity: Math.max(0, newQ) }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  const handleCheckout = async () => {
    if (!selectedUser) return toast.error('Please select a customer')
    if (cart.length === 0) return toast.error('Cart is empty')
    
    setProcessing(true)
    try {
      const payload = {
        customerId: selectedUser._id,
        items: cart.map(item => ({ groceryId: item.product._id, quantity: item.quantity })),
        paymentMethod: paymentMode,
        deliveryType,
        addressData: {
          fullName: selectedUser.name,
          mobile: selectedUser.mobile,
          fullAddress: deliveryType === 'hub-pickup' ? 'Hub Pickup - Offline Sale' : (selectedUser.location?.address || 'Unknown Address'),
          latitude: selectedUser.location?.coordinates?.[1] || 0,
          longitude: selectedUser.location?.coordinates?.[0] || 0,
        }
      }

      await axios.post('/api/hub/pos', payload)
      toast.success('Order placed successfully!')
      
      // Reset
      setCart([])
      setSelectedUser(null)
      setSearchQuery('')
      // Refresh inventory stock
      const inventoryRes = await axios.get('/api/hub/inventory')
      setProducts(inventoryRes.data.products)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to place order')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin w-8 h-8 text-indigo-500" /></div>

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6">
      
      {/* Left Column - Products & Customers */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        
        {/* Customer Selection */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-indigo-600" /> Select Customer
          </h2>
          
          {selectedUser ? (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
              <div>
                <div className="font-bold text-indigo-900">{selectedUser.name}</div>
                <div className="text-sm text-indigo-700">{selectedUser.mobile}</div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-sm text-indigo-600 font-bold hover:underline">Change</button>
            </div>
          ) : (
            <div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by name or mobile..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {searchQuery.length > 0 && filteredUsers.map(u => (
                  <button 
                    key={u._id}
                    onClick={() => setSelectedUser(u)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex justify-between items-center transition-colors"
                  >
                    <span className="font-semibold text-gray-700">{u.name}</span>
                    <span className="text-sm text-gray-500">{u.mobile}</span>
                  </button>
                ))}
                {searchQuery.length > 0 && filteredUsers.length === 0 && (
                  <div className="text-sm text-gray-400 text-center py-2">No customers found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 shrink-0">
            <Package className="w-5 h-5 text-indigo-600" /> Hub Inventory
          </h2>
          <div className="overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3 pr-2">
            {products.map(p => (
              <div key={p._id} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2 hover:border-indigo-200 hover:shadow-sm transition-all bg-gray-50">
                <div className="aspect-square bg-white rounded-lg overflow-hidden border border-gray-100">
                  {p.images?.[0] ? (
                    <Image src={p.images[0]} alt={p.name} width={100} height={100} className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>}
                </div>
                <div className="font-bold text-sm text-gray-800 line-clamp-1">{p.name}</div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-indigo-600 font-bold">₹{p.price}</div>
                    <div className="text-[10px] text-gray-500">Stock: {p.stock} {p.unit}</div>
                  </div>
                  <button 
                    onClick={() => addToCart(p)}
                    disabled={p.stock <= 0}
                    className="bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right Column - Cart & Checkout */}
      <div className="w-full md:w-96 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden shrink-0">
        <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-indigo-700" />
          <h2 className="text-lg font-bold text-indigo-900">Current Order</h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-10 flex flex-col items-center gap-2">
              <ShoppingCart className="w-10 h-10 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product._id} className="flex gap-3 items-center border-b border-gray-50 pb-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  {item.product.images?.[0] && <Image src={item.product.images[0]} alt={item.product.name} width={48} height={48} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-gray-800 truncate">{item.product.name}</div>
                  <div className="text-xs text-gray-500">₹{item.product.price} / {item.product.unit}</div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200">
                  <button onClick={() => updateQuantity(item.product._id, -1)} className="p-1 text-gray-500 hover:text-indigo-600"><Minus className="w-3 h-3" /></button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product._id, 1)} className="p-1 text-gray-500 hover:text-indigo-600"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Section */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-4">
          
          <div className="flex justify-between items-center font-bold text-lg">
            <span className="text-gray-600">Total:</span>
            <span className="text-indigo-700 flex items-center"><IndianRupee className="w-5 h-5"/> {totalAmount}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Payment Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setPaymentMode('cod')}
                className={`flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl border ${paymentMode === 'cod' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Banknote className="w-4 h-4"/> Cash
              </button>
              <button 
                onClick={() => setPaymentMode('upi')}
                className={`flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl border ${paymentMode === 'upi' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <CreditCard className="w-4 h-4"/> UPI/Online
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Delivery Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setDeliveryType('hub-pickup')}
                className={`py-2 text-sm font-bold rounded-xl border ${deliveryType === 'hub-pickup' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Hub Pickup
              </button>
              <button 
                onClick={() => setDeliveryType('home-delivery')}
                className={`py-2 text-sm font-bold rounded-xl border ${deliveryType === 'home-delivery' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Home Delivery
              </button>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={processing || cart.length === 0 || !selectedUser}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {processing ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>

      </div>
    </div>
  )
}
