'use client'
import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { PlusCircle, Pencil, Trash2, Loader2, Upload, X, CheckCircle, BookOpen, Building2, Leaf, Package, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { GROCERY_CATEGORIES, getCategoryLabel } from '@/lib/constants'
import { useLocale } from 'next-intl'

const CATEGORIES = GROCERY_CATEGORIES
const UNITS = ["kg", "g", "quintal", "liter", "ml", "piece", "dozen", "bundle"]

interface Product {
  _id: string
  name: string
  nameHindi: string
  category: string
  unit: string
  image: string
  description: string
  isActive: boolean
  isHubProduct: boolean
  retailPrice?: number
  wholesalePrice?: number
}

function AdminCatalogPage() {
  const locale = useLocale()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<string>("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [viewFilter, setViewFilter] = useState<'all' | 'hub' | 'seller'>('all')
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: "", nameHindi: "", category: "", unit: "", description: "",
    isActive: true, isHubProduct: false, retailPrice: 0, wholesalePrice: 0
  })

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/admin/catalog')
      setProducts(data.products)
    } finally { setLoading(false) }
  }

  const openAdd = () => {
    setEditProduct(null)
    setForm({ name: "", nameHindi: "", category: "", unit: "", description: "", isActive: true, isHubProduct: false, retailPrice: 0, wholesalePrice: 0 })
    setPreview("")
    setImageFile(null)
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({
      name: p.name, nameHindi: p.nameHindi, category: p.category, unit: p.unit,
      description: p.description, isActive: p.isActive, isHubProduct: p.isHubProduct,
      retailPrice: p.retailPrice || 0, wholesalePrice: p.wholesalePrice || 0
    })
    setPreview(p.image || "")
    setImageFile(null)
    setShowForm(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImageFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('nameHindi', form.nameHindi)
      fd.append('category', form.category)
      fd.append('unit', form.unit)
      fd.append('description', form.description)
      fd.append('isActive', String(form.isActive))
      fd.append('isHubProduct', String(form.isHubProduct))
      if (form.isHubProduct) {
        fd.append('retailPrice', String(form.retailPrice))
        fd.append('wholesalePrice', String(form.wholesalePrice))
      }
      if (imageFile) fd.append('image', imageFile)

      if (editProduct) {
        await axios.put(`/api/admin/catalog/${editProduct._id}`, fd)
        toast.success('Product updated!')
      } else {
        await axios.post('/api/admin/catalog', fd)
        toast.success('Product added to catalog!')
      }
      setShowForm(false)
      fetchProducts()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error saving')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product from the master catalog?')) return
    try {
      await axios.delete(`/api/admin/catalog/${id}`)
      toast.success('Deleted')
      fetchProducts()
    } catch { toast.error('Delete failed') }
  }

  const filtered = products.filter(p => {
    if (viewFilter === 'hub') return p.isHubProduct
    if (viewFilter === 'seller') return !p.isHubProduct
    return true
  })

  const grouped = filtered.reduce((acc: Record<string, Product[]>, p) => {
    (acc[p.category] = acc[p.category] || []).push(p)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-green-600" /> Master Product Catalog
            </h1>
            <p className="text-green-700 text-sm mt-1">Manage all products across the platform.</p>
          </div>
          <button onClick={openAdd} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-md transition-all">
            <PlusCircle className="w-5 h-5" /> Add Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm text-center">
            <div className="text-3xl font-bold text-green-700">{products.length}</div>
            <div className="text-xs text-gray-500 mt-1">Total Products</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm text-center">
            <div className="text-3xl font-bold text-blue-600">{products.filter(p => p.isHubProduct).length}</div>
            <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1"><Building2 className="w-3 h-3"/> Hub (GST)</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm text-center">
            <div className="text-3xl font-bold text-emerald-600">{products.filter(p => !p.isHubProduct).length}</div>
            <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1"><Leaf className="w-3 h-3"/> Raw (Seller)</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm text-center">
            <div className="text-3xl font-bold text-orange-500">{products.filter(p => !p.isActive).length}</div>
            <div className="text-xs text-gray-500 mt-1">Inactive</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'all', label: 'All Products', icon: <Package className="w-4 h-4" /> },
            { id: 'hub', label: 'Hub (GST)', icon: <Building2 className="w-4 h-4" /> },
            { id: 'seller', label: 'Raw (Seller)', icon: <Leaf className="w-4 h-4" /> },
          ].map(f => (
            <button key={f.id} onClick={() => setViewFilter(f.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${viewFilter === f.id ? 'bg-green-600 text-white border-green-600 shadow' : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'}`}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {/* Product Grid by Category */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-green-500" /></div>
        ) : Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-bold text-green-800 mb-3 px-1 border-l-4 border-green-500 pl-3">{category}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map(p => (
                <div key={p._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden group hover:shadow-md transition-all ${!p.isActive ? 'opacity-50' : ''}`}>
                  <div className="relative h-28 bg-gray-50">
                    {p.image ? (
                      <Image src={p.image} alt={p.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl">🌿</div>
                    )}
                    {/* GST / Raw Badge */}
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow ${p.isHubProduct ? 'bg-blue-600' : 'bg-green-600'}`}>
                      {p.isHubProduct ? 'GST' : 'RAW'}
                    </div>
                    {!p.isActive && (
                      <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-red-500 px-2 py-0.5 rounded-full">Inactive</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-bold text-gray-800 text-sm truncate">{p.name}</div>
                    {p.nameHindi && <div className="text-gray-500 text-xs">{p.nameHindi}</div>}
                    <div className="text-green-600 text-xs font-medium mt-1">per {p.unit}</div>
                    {p.isHubProduct && p.retailPrice ? (
                      <div className="text-xs text-blue-600 font-medium mt-0.5">
                        R: ₹{p.retailPrice} / W: ₹{p.wholesalePrice}
                      </div>
                    ) : null}
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => openEdit(p)} className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-1 rounded-lg transition flex items-center justify-center gap-1">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 py-1 rounded-lg transition flex items-center justify-center gap-1">
                        <Trash2 className="w-3 h-3" /> Del
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-400">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No products found.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-green-300 bg-green-50 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-green-100 transition"
                    onClick={() => fileRef.current?.click()}
                  >
                    {preview ? (
                      <Image src={preview} alt="preview" width={96} height={96} className="object-cover w-full h-full rounded-2xl" />
                    ) : (
                      <div className="text-center text-green-600">
                        <Upload className="w-6 h-6 mx-auto" />
                        <span className="text-xs">Image</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
                  <div className="flex-1 space-y-2">
                    <input required placeholder="Product Name (English)" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-400 outline-none" />
                    <input placeholder="नाम (हिंदी)" value={form.nameHindi} onChange={e => setForm(f => ({...f, nameHindi: e.target.value}))}
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-400 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Category</label>
                    <select required value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-400 outline-none bg-white">
                      <option value="">Select...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c, locale)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Unit</label>
                    <select required value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))}
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-400 outline-none bg-white">
                      <option value="">Select...</option>
                      {UNITS.map(u => <option key={u} value={u}>per {u}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                  <textarea rows={2} placeholder="Brief description..." value={form.description}
                    onChange={e => setForm(f => ({...f, description: e.target.value}))}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-400 outline-none resize-none" />
                </div>

                {/* GST / Hub Product Toggle */}
                <div className={`rounded-2xl border-2 p-4 transition-all ${form.isHubProduct ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <input type="checkbox" id="isHubProduct" checked={form.isHubProduct} onChange={e => setForm(f => ({...f, isHubProduct: e.target.checked}))}
                      className="w-4 h-4 text-blue-600 rounded" />
                    <label htmlFor="isHubProduct" className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" /> Hub Product (GST-applicable)
                    </label>
                  </div>
                  {form.isHubProduct ? (
                    <>
                      <p className="text-xs text-blue-600 mb-3 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Stock managed by Hub. Price set globally by Admin.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1 block">Retail Price (₹)</label>
                          <input type="number" min={0} value={form.retailPrice} onChange={e => setForm(f => ({...f, retailPrice: Number(e.target.value)}))}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1 block">Wholesale Price (₹)</label>
                          <input type="number" min={0} value={form.wholesalePrice} onChange={e => setForm(f => ({...f, wholesalePrice: Number(e.target.value)}))}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">Raw agricultural product — sold by sellers using Mandi Bhav pricing.</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({...f, isActive: e.target.checked}))}
                    className="w-4 h-4 text-green-600 rounded" />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Active (hubs can enable this product)</label>
                </div>

                <button type="submit" disabled={saving} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  {editProduct ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCatalogPage
