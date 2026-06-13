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
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-7 h-7 text-indigo-600" /> Manage Seller Products
        </h1>
        <p className="text-gray-500 text-sm mt-1">Add or edit products on behalf of sellers linked to your hub.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        
        {/* Sidebar - Sellers List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700 flex items-center gap-2">
            <Users className="w-5 h-5" /> Select Seller
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sellers.map(s => (
              <button 
                key={s._id}
                onClick={() => handleSelectSeller(s)}
                className={`w-full text-left p-3 rounded-xl transition-all ${selectedSeller?._id === s._id ? 'bg-indigo-50 border-indigo-200 border text-indigo-800 font-bold' : 'hover:bg-gray-50 border border-transparent text-gray-700'}`}
              >
                <div className="text-sm">{s.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.sellerDetails?.shopName || 'No Shop Name'}</div>
              </button>
            ))}
            {sellers.length === 0 && <div className="text-center p-4 text-gray-400 text-sm">No sellers linked</div>}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-[600px] flex flex-col overflow-hidden">
          {!selectedSeller ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Package className="w-16 h-16 opacity-20 mb-4" />
              <p>Select a seller from the left to view and manage their products.</p>
            </div>
          ) : showForm ? (
            /* Product Form */
            <div className="flex-1 flex flex-col h-full">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <h2 className="font-bold text-gray-800">{formData.id ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Product Name</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
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

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
                  <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm disabled:opacity-50">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Product
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Products List */
            <div className="flex-1 flex flex-col h-full">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <div>
                  <h2 className="font-bold text-gray-800">{selectedSeller.name}&apos;s Products</h2>
                  <p className="text-xs text-gray-500">{products.length} items</p>
                </div>
                <button onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all">
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                {loadingProducts ? (
                  <div className="flex justify-center p-10"><Loader2 className="animate-spin w-6 h-6 text-indigo-500" /></div>
                ) : products.length === 0 ? (
                  <div className="text-center p-10 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No products found for this seller.</p>
                  </div>
                ) : (
                  products.map(p => (
                    <div key={p._id} className="bg-white border border-gray-200 rounded-xl p-3 flex gap-4 items-center hover:shadow-sm transition-shadow">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        {p.images?.[0] ? <Image src={p.images[0]} alt={p.name} width={64} height={64} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🌿</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 truncate">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.category}</div>
                        <div className="mt-1 flex items-center gap-3 text-sm">
                          <span className="text-indigo-600 font-bold">₹{p.price}/{p.unit}</span>
                          <span className="text-gray-400 text-xs font-medium">Stock: {p.stock}</span>
                        </div>
                      </div>
                      <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors border border-gray-100 hover:border-indigo-100">
                        <Pencil className="w-4 h-4" />
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
