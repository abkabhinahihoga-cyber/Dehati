'use client'
import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { Users, Package, Plus, Pencil, Save, Loader2, Image as ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { ALL_CATEGORIES } from '@/lib/constants'

export default function HubSellerProductsPage() {
  const [sellers, setSellers] = useState<any[]>([])
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    category: ALL_CATEGORIES[0],
    unit: 'kg',
    stock: '',
    retailPrice: '',
    wholesalePrice: ''
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    axios.get('/api/hub/users')
      .then(res => setSellers(res.data.users.filter((u: any) => u.role === 'seller')))
      .catch(err => toast.error('Failed to load sellers'))
      .finally(() => setLoading(false))
  }, [])

  const loadProducts = async (sellerId: string) => {
    setLoadingProducts(true)
    try {
      const res = await axios.get(`/api/hub/seller-products?sellerId=${sellerId}`)
      setProducts(res.data.products)
    } catch (err) {
      toast.error('Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleSelectSeller = (seller: any) => {
    setSelectedSeller(seller)
    setShowForm(false)
    loadProducts(seller._id)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      setImageFiles(files)
      setPreviewUrls(files.map(file => URL.createObjectURL(file)))
    }
  }

  const handleEdit = (product: any) => {
    setFormData({
      id: product._id,
      name: product.name,
      description: product.description || '',
      category: product.category,
      unit: product.unit,
      stock: product.stock?.toString() || '',
      retailPrice: product.retailPrice?.toString() || '',
      wholesalePrice: product.wholesalePrice?.toString() || ''
    })
    setPreviewUrls(product.images || [])
    setImageFiles([])
    setShowForm(true)
  }

  const handleCreateNew = () => {
    setFormData({
      id: '', name: '', description: '', category: ALL_CATEGORIES[0], unit: 'kg', stock: '', retailPrice: '', wholesalePrice: ''
    })
    setPreviewUrls([])
    setImageFiles([])
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSeller) return
    setSaving(true)

    try {
      const fd = new FormData()
      if (formData.id) fd.append('id', formData.id)
      fd.append('sellerId', selectedSeller._id)
      fd.append('name', formData.name)
      fd.append('description', formData.description)
      fd.append('category', formData.category)
      fd.append('unit', formData.unit)
      fd.append('stock', formData.stock)
      fd.append('retailPrice', formData.retailPrice)
      fd.append('wholesalePrice', formData.wholesalePrice)
      
      imageFiles.forEach(file => fd.append('images', file))

      if (formData.id) {
        await axios.put('/api/hub/seller-products', fd)
        toast.success('Product updated successfully')
      } else {
        await axios.post('/api/hub/seller-products', fd)
        toast.success('Product added successfully')
      }
      
      setShowForm(false)
      loadProducts(selectedSeller._id)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin w-8 h-8 text-indigo-500" /></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50 p-4 md:p-6 space-y-6">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 flex items-center gap-3">
          <Package className="w-8 h-8 text-indigo-600" /> Manage Seller Products
        </h1>
        <p className="text-indigo-600/80 text-sm mt-1 font-medium">Add or edit products on behalf of sellers linked to your hub.</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
        
        {/* Sidebar - Sellers List */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-xl flex flex-col h-[600px] overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
          <div className="p-5 border-b border-indigo-100 font-extrabold text-indigo-900 flex items-center gap-3 z-10 relative">
            <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-700" />
            </div>
            Select Seller
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 z-10 relative">
            {sellers.map(s => (
              <button 
                key={s._id}
                onClick={() => handleSelectSeller(s)}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group ${selectedSeller?._id === s._id ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md transform scale-[1.02]' : 'hover:bg-white hover:shadow-sm bg-white/40 border border-white/60'}`}
              >
                <div className={`font-bold text-sm ${selectedSeller?._id === s._id ? 'text-white' : 'text-gray-800 group-hover:text-indigo-700'}`}>{s.name}</div>
                <div className={`text-xs mt-1 ${selectedSeller?._id === s._id ? 'text-indigo-100' : 'text-gray-500'}`}>{s.sellerDetails?.shopName || 'No Shop Name'}</div>
              </button>
            ))}
            {sellers.length === 0 && <div className="text-center p-8 text-gray-400 text-sm">No sellers linked to this Hub</div>}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-xl h-[600px] flex flex-col overflow-hidden relative">
          {!selectedSeller ? (
            <div className="flex-1 flex flex-col items-center justify-center text-indigo-300/50">
              <Package className="w-24 h-24 mb-6" />
              <p className="text-indigo-400 font-medium">Select a seller to view and manage their products.</p>
            </div>
          ) : showForm ? (
            /* Product Form */
            <div className="flex-1 flex flex-col h-full bg-white relative z-10">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <h2 className="font-extrabold text-lg text-gray-800">{formData.id ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Product Name</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
                  <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Unit</label>
                    <input required placeholder="kg, liter, pc" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Stock</label>
                    <input type="number" required min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Retail Price (₹)</label>
                    <input type="number" required min="0" value={formData.retailPrice} onChange={e => setFormData({...formData, retailPrice: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Product Image</label>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="border-2 border-dashed border-indigo-200 rounded-xl p-6 flex flex-col items-center justify-center text-indigo-500 hover:bg-indigo-50 cursor-pointer transition-colors"
                  >
                    {previewUrls.length > 0 ? (
                      <div className="flex gap-2">
                        {previewUrls.map((url, idx) => (
                          <div key={idx} className="w-20 h-20 relative rounded-lg overflow-hidden border border-gray-200">
                            <Image src={url} alt="preview" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <span className="text-sm font-bold">Click to upload image</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />} {saving ? 'Saving...' : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Products List */
            <div className="flex-1 flex flex-col h-full z-10 relative">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-md shrink-0 sticky top-0 z-20">
                <div>
                  <h2 className="font-extrabold text-xl text-gray-800">{selectedSeller.name}&apos;s Products</h2>
                  <p className="text-sm font-medium text-indigo-500 mt-0.5">{products.length} items listed</p>
                </div>
                <button onClick={handleCreateNew} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5">
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
                {loadingProducts ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-indigo-500" /></div>
                ) : products.length === 0 ? (
                  <div className="text-center py-20 text-indigo-300">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="font-medium text-lg">No products found for this seller.</p>
                    <p className="text-sm mt-2 opacity-80">Click 'Add Product' to list their first item.</p>
                  </div>
                ) : (
                  products.map(p => (
                    <div key={p._id} className="bg-white border border-transparent shadow-sm hover:shadow-md hover:border-indigo-100 rounded-2xl p-4 flex gap-5 items-center transition-all group transform hover:-translate-y-0.5">
                      <div className="w-20 h-20 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100 shadow-inner">
                        {p.images?.[0] ? <Image src={p.images[0]} alt={p.name} width={80} height={80} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🌿</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-gray-800 text-lg truncate group-hover:text-indigo-700 transition-colors">{p.name}</div>
                        <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">{p.category}</div>
                        <div className="flex items-center gap-4 text-sm bg-indigo-50/50 w-fit px-3 py-1.5 rounded-lg border border-indigo-50">
                          <span className="text-indigo-700 font-extrabold flex items-center gap-1">₹{p.price}/{p.unit}</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-indigo-600/80 font-semibold">Stock: {p.stock}</span>
                        </div>
                      </div>
                      <button onClick={() => handleEdit(p)} className="p-3 bg-white text-gray-400 shadow-sm border border-gray-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all">
                        <Pencil className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
