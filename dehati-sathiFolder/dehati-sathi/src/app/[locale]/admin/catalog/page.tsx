'use client'
import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { PlusCircle, Pencil, Trash2, Loader2, Upload, X, CheckCircle, BookOpen } from 'lucide-react'

const CATEGORIES = [
  "Vegetables", "Fruits", "Grains & Pulses", "Dairy", "Spices", "Oils & Ghee",
  "Dry Fruits", "Herbs", "Flowers", "Other"
]
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
}

function AdminCatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<string>("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: "", nameHindi: "", category: "", unit: "", description: "", isActive: true
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
    setForm({ name: "", nameHindi: "", category: "", unit: "", description: "", isActive: true })
    setPreview("")
    setImageFile(null)
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({ name: p.name, nameHindi: p.nameHindi, category: p.category, unit: p.unit, description: p.description, isActive: p.isActive })
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
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
      if (imageFile) fd.append('image', imageFile)

      if (editProduct) {
        await axios.put(`/api/admin/catalog/${editProduct._id}`, fd)
      } else {
        await axios.post('/api/admin/catalog', fd)
      }
      setShowForm(false)
      fetchProducts()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error saving')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product from the master catalog?')) return
    await axios.delete(`/api/admin/catalog/${id}`)
    fetchProducts()
  }

  const grouped = products.reduce((acc: Record<string, Product[]>, p) => {
    (acc[p.category] = acc[p.category] || []).push(p)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-green-600" /> Master Product Catalog
            </h1>
            <p className="text-green-700 text-sm mt-1">Define products. Hub managers will enable them and set Mandi Bhav prices.</p>
          </div>
          <button onClick={openAdd} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-md transition-all">
            <PlusCircle className="w-5 h-5" /> Add Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm text-center">
            <div className="text-3xl font-bold text-green-700">{products.length}</div>
            <div className="text-xs text-gray-500 mt-1">Total Products</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm text-center">
            <div className="text-3xl font-bold text-emerald-600">{products.filter(p => p.isActive).length}</div>
            <div className="text-xs text-gray-500 mt-1">Active</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm text-center">
            <div className="text-3xl font-bold text-orange-500">{products.filter(p => !p.isActive).length}</div>
            <div className="text-xs text-gray-500 mt-1">Inactive</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm text-center">
            <div className="text-3xl font-bold text-blue-600">{Object.keys(grouped).length}</div>
            <div className="text-xs text-gray-500 mt-1">Categories</div>
          </div>
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

        {products.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-400">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No products in the catalog yet.</p>
            <p className="text-sm">Click "Add Product" to get started.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image */}
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
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Description (default)</label>
                  <textarea rows={3} placeholder="Brief description visible to sellers/buyers..." value={form.description}
                    onChange={e => setForm(f => ({...f, description: e.target.value}))}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-400 outline-none resize-none" />
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({...f, isActive: e.target.checked}))}
                    className="w-4 h-4 text-green-600 rounded" />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Active (available for hubs to enable)</label>
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
