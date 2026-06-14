'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { ShoppingCart, User, Plus, Minus, Search, CreditCard, Banknote, Package, CheckCircle2, Loader2, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'
import { usePathname } from 'next/navigation'

export default function HubPOSPage() {
  const pathname = usePathname()
  const isHindi = pathname.startsWith('/hi')

  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [cart, setCart] = useState<{product: any, quantity: number}[]>([])
  const [paymentMode, setPaymentMode] = useState('cod')
  const [deliveryType, setDeliveryType] = useState('hub-pickup')
  const [processing, setProcessing] = useState(false)
  const [cartExpanded, setCartExpanded] = useState(false)

  const t = {
    selectCustomer: isHindi ? 'ग्राहक चुनें' : 'Select Customer',
    change: isHindi ? 'बदलें' : 'Change',
    searchCustomer: isHindi ? 'नाम या मोबाइल नंबर से खोजें...' : 'Search by name or mobile...',
    noCustomers: isHindi ? 'कोई ग्राहक नहीं मिला' : 'No customers found',
    catalog: isHindi ? 'कैटलॉग' : 'Catalog',
    searchProducts: isHindi ? 'उत्पाद खोजें...' : 'Search products...',
    noProducts: isHindi ? 'कोई उत्पाद नहीं मिला' : 'No products found',
    addProductsHint: isHindi ? 'इन्वेंट्री से उत्पाद जोड़ें' : 'Add products from Hub Inventory',
    byHub: isHindi ? 'हब द्वारा' : 'By: Hub',
    bySeller: isHindi ? 'द्वारा' : 'By',
    gstProduct: isHindi ? 'जीएसटी उत्पाद' : 'GST Product',
    stock: isHindi ? 'स्टॉक' : 'Stock',
    outOfStock: isHindi ? 'स्टॉक खत्म' : 'Out of stock',
    cannotAddMore: isHindi ? 'स्टॉक से अधिक नहीं जोड़ सकते' : 'Cannot add more than available stock',
    stockLimitReached: isHindi ? 'स्टॉक सीमा पार हो गई' : 'Stock limit reached',
    currentOrder: isHindi ? 'वर्तमान ऑर्डर' : 'Current Order',
    cartEmpty: isHindi ? 'कार्ट खाली है' : 'Cart is empty',
    total: isHindi ? 'कुल' : 'Total',
    paymentMode: isHindi ? 'भुगतान का प्रकार' : 'Payment Mode',
    cash: isHindi ? 'नकद' : 'Cash',
    upiOnline: isHindi ? 'यूपीआई / ऑनलाइन' : 'UPI/Online',
    deliveryType: isHindi ? 'डिलीवरी का प्रकार' : 'Delivery Type',
    hubPickup: isHindi ? 'हब से लें' : 'Hub Pickup',
    homeDelivery: isHindi ? 'होम डिलीवरी' : 'Home Delivery',
    completeSale: isHindi ? 'बिक्री पूरी करें' : 'Complete Sale',
    processing: isHindi ? 'प्रोसेस हो रहा है...' : 'Processing...',
    selectCustomerFirst: isHindi ? 'कृपया पहले ग्राहक चुनें' : 'Please select a customer',
    cartIsEmptyFirst: isHindi ? 'कार्ट खाली है' : 'Cart is empty',
    orderPlaced: isHindi ? 'ऑर्डर सफलतापूर्वक प्राप्त हुआ!' : 'Order placed successfully!',
    failedToPlace: isHindi ? 'ऑर्डर पूरा करने में विफल' : 'Failed to place order',
    failedToLoad: isHindi ? 'डेटा लोड करने में विफल' : 'Failed to load data',
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, inventoryRes] = await Promise.all([
          axios.get('/api/hub/users'),
          axios.get('/api/hub/pos/inventory')
        ])
        setUsers(usersRes.data.users.filter((u: any) => u.role === 'user' || u.role === 'seller'))
        setProducts(inventoryRes.data.products)
      } catch (err) {
        toast.error(t.failedToLoad)
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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.seller?.name && p.seller.name.toLowerCase().includes(productSearch.toLowerCase()))
  )

  const addToCart = (product: any) => {
    if (product.stock <= 0) return toast.error(t.outOfStock)
    setCart(prev => {
      const existing = prev.find(item => item.product._id === product._id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(t.cannotAddMore)
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
          toast.error(t.stockLimitReached)
          return item
        }
        return { ...item, quantity: Math.max(0, newQ) }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  const handleCheckout = async () => {
    if (!selectedUser) return toast.error(t.selectCustomerFirst)
    if (cart.length === 0) return toast.error(t.cartIsEmptyFirst)
    
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
      toast.success(t.orderPlaced)
      
      // Reset
      setCart([])
      setSelectedUser(null)
      setSearchQuery('')
      // Refresh inventory stock
      const inventoryRes = await axios.get('/api/hub/pos/inventory')
      setProducts(inventoryRes.data.products)
    } catch (err: any) {
      toast.error(err.response?.data?.error || t.failedToPlace)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin w-8 h-8 text-indigo-500" /></div>

  return (
    <div className="max-w-7xl mx-auto min-h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-6 p-2 md:p-4 pb-24 lg:pb-4">
      
      {/* Left Column - Products & Customers */}
      <div className="flex-1 flex flex-col gap-4 md:gap-6 min-h-0 order-2 lg:order-1">
        
        {/* Customer Selection */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-indigo-600" /> {t.selectCustomer}
          </h2>
          
          {selectedUser ? (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
              <div>
                <div className="font-bold text-indigo-900">{selectedUser.name}</div>
                <div className="text-sm text-indigo-700">{selectedUser.mobile}</div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-sm text-indigo-600 font-bold hover:underline">{t.change}</button>
            </div>
          ) : (
            <div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={t.searchCustomer} 
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
                  <div className="text-sm text-gray-400 text-center py-2">{t.noCustomers}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-[400px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 shrink-0 gap-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" /> {t.catalog}
            </h2>
            <div className="relative w-full sm:flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder={t.searchProducts} 
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
              />
            </div>
          </div>
          <div className="overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pr-1 max-h-[500px] lg:max-h-[600px]">
            {filteredProducts.length === 0 ? (
              <div className="col-span-2 md:col-span-3 xl:col-span-4 flex flex-col items-center justify-center py-12 text-gray-400">
                <Package className="w-14 h-14 mb-3 opacity-20" />
                <p className="font-semibold">{t.noProducts}</p>
                <p className="text-sm mt-1">{t.addProductsHint}</p>
              </div>
            ) : (
              filteredProducts.map(p => (
                <div key={p._id} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2 hover:border-indigo-200 hover:shadow-sm transition-all bg-gray-50">
                  <div className="aspect-square bg-white rounded-lg overflow-hidden border border-gray-100 relative">
                    {p.images?.[0] ? (
                      <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-3xl">🛒</div>}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-800 line-clamp-1">{p.name}</div>
                    <div className="text-[10px] text-gray-500 line-clamp-1">
                      {p.seller?.name ? `${t.bySeller}: ${p.seller.name}` : t.byHub}
                    </div>
                    {p.isHubProduct && <div className="text-[10px] text-blue-600 font-bold">{t.gstProduct}</div>}
                  </div>
                  <div className="flex justify-between items-end mt-auto">
                    <div>
                      <div className="text-indigo-600 font-bold">₹{p.price}</div>
                      <div className="text-[10px] text-gray-500">{t.stock}: {p.stock === 999 ? '∞' : p.stock} {p.unit}</div>
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
              ))
            )}
          </div>
        </div>

      </div>

      {/* Right Column - Cart & Checkout */}
      <div className={`w-full lg:w-96 bg-white lg:rounded-2xl lg:border border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:shadow-sm flex flex-col shrink-0 fixed bottom-0 left-0 right-0 z-10 lg:static lg:z-auto transition-all ${cartExpanded ? 'max-h-[80vh]' : 'max-h-[50px] lg:max-h-none'} overflow-hidden`}>
        
        {/* Toggle Cart view on Mobile */}
        <div 
          onClick={() => setCartExpanded(!cartExpanded)}
          className="p-3 lg:p-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between lg:justify-start gap-2 cursor-pointer lg:cursor-default shadow-sm lg:shadow-none"
        >
          <div className="flex items-center gap-2">
             <ShoppingCart className="w-5 h-5 text-indigo-700" />
             <h2 className="text-base lg:text-lg font-bold text-indigo-900">{t.currentOrder} <span className="lg:hidden text-indigo-600 ml-1">({cart.length})</span></h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="lg:hidden font-bold text-indigo-700">₹{totalAmount}</div>
            <div className="lg:hidden text-indigo-500 text-xs">
              {cartExpanded ? '▼' : '▲'}
            </div>
          </div>
        </div>

        <div className={`flex flex-col flex-1 overflow-hidden lg:flex ${cartExpanded ? 'flex' : 'hidden'}`}>
          {/* Cart Items */}
          <div className={`${cart.length > 0 ? 'flex-1 overflow-y-auto min-h-[100px]' : 'hidden lg:block'} max-h-[30vh] lg:max-h-none p-3 lg:p-4 space-y-3`}>
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-10 flex flex-col items-center gap-2">
              <ShoppingCart className="w-10 h-10 opacity-20" />
              <p>{t.cartEmpty}</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product._id} className="flex gap-3 items-center border-b border-gray-50 pb-2 lg:pb-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                  {item.product.images?.[0] && <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs lg:text-sm text-gray-800 truncate">{item.product.name}</div>
                  <div className="text-[10px] lg:text-xs text-gray-500">₹{item.product.price} / {item.product.unit}</div>
                </div>
                <div className="flex items-center gap-1 lg:gap-2 bg-gray-50 rounded-lg border border-gray-200">
                  <button onClick={() => updateQuantity(item.product._id, -1)} className="p-1 lg:p-2 text-gray-500 hover:text-indigo-600"><Minus className="w-3 h-3" /></button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product._id, 1)} className="p-1 lg:p-2 text-gray-500 hover:text-indigo-600"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Section */}
        <div className="p-3 lg:p-4 border-t border-gray-100 bg-gray-50 space-y-3 lg:space-y-4">
          
          <div className="hidden lg:flex justify-between items-center font-bold text-lg">
            <span className="text-gray-600">{t.total}:</span>
            <span className="text-indigo-700 flex items-center"><IndianRupee className="w-5 h-5"/> {totalAmount}</span>
          </div>

          <div className="flex gap-2">
             <div className="flex-1 space-y-1 lg:space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-gray-500 uppercase">{t.paymentMode}</label>
                <div className="grid grid-cols-2 gap-1 lg:gap-2">
                  <button 
                    onClick={() => setPaymentMode('cod')}
                    className={`flex items-center justify-center gap-1 py-1.5 lg:py-2 text-[10px] lg:text-sm font-bold rounded-lg lg:rounded-xl border ${paymentMode === 'cod' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Banknote className="w-3 h-3 lg:w-4 lg:h-4"/> {t.cash}
                  </button>
                  <button 
                    onClick={() => setPaymentMode('upi')}
                    className={`flex items-center justify-center gap-1 py-1.5 lg:py-2 text-[10px] lg:text-sm font-bold rounded-lg lg:rounded-xl border ${paymentMode === 'upi' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    <CreditCard className="w-3 h-3 lg:w-4 lg:h-4"/> {t.upiOnline}
                  </button>
                </div>
             </div>
             
             <div className="flex-1 space-y-1 lg:space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-gray-500 uppercase">{t.deliveryType}</label>
                <div className="grid grid-cols-2 gap-1 lg:gap-2">
                  <button 
                    onClick={() => setDeliveryType('hub-pickup')}
                    className={`py-1.5 lg:py-2 text-[10px] lg:text-sm font-bold rounded-lg lg:rounded-xl border ${deliveryType === 'hub-pickup' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    {t.hubPickup}
                  </button>
                  <button 
                    onClick={() => setDeliveryType('home-delivery')}
                    className={`py-1.5 lg:py-2 text-[10px] lg:text-sm font-bold rounded-lg lg:rounded-xl border ${deliveryType === 'home-delivery' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    {t.homeDelivery}
                  </button>
                </div>
             </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={processing || cart.length === 0 || !selectedUser}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 lg:py-3 rounded-xl font-bold text-sm lg:text-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {processing ? <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5" />}
            {processing ? t.processing : t.completeSale}
          </button>
        </div>
        </div>

      </div>
    </div>
  )
}
