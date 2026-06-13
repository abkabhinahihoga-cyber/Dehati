'use client'
import { Loader2, Upload, X, IndianRupee, CheckCircle, PackageSearch } from 'lucide-react'
import React, { ChangeEvent, FormEvent, useState, useEffect } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface MandiBhav {
  price: number
  minPrice: number
  maxPrice: number
}

interface ProductOption {
  _id: string
  name: string
  nameHindi: string
  category: string
  unit: string
  image: string
  description: string
  mandiBhav: MandiBhav
}

function AddGroceryForm() {
  const router = useRouter()
  const [options, setOptions] = useState<ProductOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState("")
  const [stock, setStock] = useState("")
  const [retailPrice, setRetailPrice] = useState("")
  const [qualityScale, setQualityScale] = useState(5)
  const [previews, setPreviews] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    try {
      const { data } = await axios.get('/api/seller/product-options')
      if (data.success) {
        setOptions(data.products)
      }
    } catch (err) {
      toast.error('Failed to load product catalog')
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleSelectProduct = (product: ProductOption) => {
    setSelectedProduct(product)
    setDescription(product.description || "")
    setRetailPrice(product.mandiBhav?.price?.toString() || "")
    setQualityScale(5) // default to average
    setStock("")
    setPreviews([])
    setImageFiles([])
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const newFiles = [...imageFiles, ...files]
    setImageFiles(newFiles)
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("name", selectedProduct.name)
      formData.append("category", selectedProduct.category)
      formData.append("unit", selectedProduct.unit)
      
      formData.append("masterProductId", selectedProduct._id)
      formData.append("description", description)
      formData.append("stock", stock)
      formData.append("price", retailPrice) // selling price
      formData.append("retailPrice", retailPrice) // retail price
      formData.append("qualityScale", qualityScale.toString())
      formData.append("productType", "grocery") 

      imageFiles.forEach((file) => formData.append("images", file))

      await axios.post("/api/seller/add-product", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success("Grocery Item Added Successfully!")
      router.push('/seller/dashboard')
    } catch (error: any) {
      toast.error("Failed: " + (error.response?.data?.error || "Server Error"))
    } finally {
      setLoading(false)
    }
  }

  const getQualityText = (val: number) => {
    if (val <= 2) return "Bad (1-2)"
    if (val <= 4) return "Ok (3-4)"
    if (val <= 6) return "Average (5-6)"
    if (val <= 8) return "Good (7-8)"
    return "Very Good (9-10)"
  }
  
  const getQualityColor = (val: number) => {
    if (val <= 2) return "text-red-500"
    if (val <= 4) return "text-orange-500"
    if (val <= 6) return "text-yellow-600"
    if (val <= 8) return "text-emerald-500"
    return "text-green-600"
  }

  if (loadingOptions) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>
  }

  if (!selectedProduct) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
          <h3 className="text-green-800 font-bold text-lg mb-2 flex items-center gap-2">
            <PackageSearch className="w-5 h-5" /> Select Product to Sell
          </h3>
          <p className="text-green-700 text-sm">Choose from the products currently enabled by your Hub Manager.</p>
        </div>
        
        {options.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>Your hub has not enabled any products yet.</p>
            <p className="text-sm">Please contact your hub manager.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {options.map(p => (
              <button 
                key={p._id} 
                onClick={() => handleSelectProduct(p)}
                className="bg-white rounded-2xl border hover:border-green-400 hover:shadow-md transition-all p-3 text-left group"
              >
                <div className="w-full h-24 bg-gray-50 rounded-xl overflow-hidden mb-3 relative">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                  ) : <div className="flex items-center justify-center h-full text-2xl">🌿</div>}
                </div>
                <div className="font-bold text-gray-800 text-sm truncate">{p.name}</div>
                {p.nameHindi && <div className="text-gray-500 text-xs truncate">{p.nameHindi}</div>}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{p.category}</span>
                  <span className="text-xs font-bold text-green-600">₹{p.mandiBhav?.price || 0}/{p.unit}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className='grid md:grid-cols-2 gap-8'>
        {/* Left Column */}
        <div className='space-y-6'>
            {/* Selected Product Card */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-4 items-center relative">
              <button type="button" onClick={() => setSelectedProduct(null)} className="absolute top-2 right-2 text-green-700 hover:bg-green-200 p-1 rounded-full transition">
                <X className="w-4 h-4" />
              </button>
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex-shrink-0 relative">
                {selectedProduct.image ? (
                  <Image src={selectedProduct.image} alt={selectedProduct.name} fill className="object-cover" />
                ) : <div className="flex items-center justify-center h-full text-xl">🌿</div>}
              </div>
              <div>
                <div className="font-bold text-green-900">{selectedProduct.name} <span className="text-green-700 text-sm font-normal">({selectedProduct.nameHindi})</span></div>
                <div className="text-sm text-green-700">Category: <strong>{selectedProduct.category}</strong> • Unit: <strong>per {selectedProduct.unit}</strong></div>
              </div>
            </div>

            <div>
                <label className='block text-gray-700 font-semibold mb-2'>Quality Scale (1-10)</label>
                <div className="bg-gray-50 p-4 rounded-xl border">
                  <input 
                    type="range" 
                    min="1" max="10" 
                    value={qualityScale} 
                    onChange={e => setQualityScale(parseInt(e.target.value))}
                    className="w-full accent-green-600 mb-2"
                  />
                  <div className="flex justify-between text-xs text-gray-400 font-bold px-1">
                    <span>1</span><span>5</span><span>10</span>
                  </div>
                  <div className={`text-center font-bold text-sm mt-3 ${getQualityColor(qualityScale)}`}>
                    Selected: {getQualityText(qualityScale)}
                  </div>
                </div>
            </div>

            <div>
                <label className='block text-gray-700 font-semibold mb-2'>Description</label>
                <textarea rows={3} placeholder='Describe freshness, harvest date...' value={description} onChange={e => setDescription(e.target.value)} 
                    className='w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white transition resize-none' />
            </div>

            <div>
                <label className='block text-gray-700 font-semibold mb-2'>Stock Qty (in {selectedProduct.unit}s)</label>
                <input type="number" required placeholder='e.g. 100' value={stock} onChange={e => setStock(e.target.value)} className='w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none' />
            </div>
        </div>

        {/* Right Column */}
        <div className='space-y-6'>
            <div className='bg-emerald-50 p-5 rounded-xl border border-emerald-100'>
                <h3 className='text-emerald-800 font-bold mb-4 flex items-center gap-2'><IndianRupee className='w-4 h-4'/> Pricing Details</h3>
                
                <div className="mb-4 bg-white p-3 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <div className="text-sm text-gray-600">Today's Mandi Bhav:</div>
                  <div className="font-bold text-emerald-600 text-lg">₹{selectedProduct.mandiBhav?.price || 0} / {selectedProduct.unit}</div>
                </div>
                
                <div className="text-xs text-emerald-700 mb-2">Price auto-filled from Mandi Bhav, but you can change it:</div>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                    <input type="number" required placeholder='Selling Price' value={retailPrice} onChange={e => setRetailPrice(e.target.value)} 
                           className='w-full border-2 border-emerald-200 rounded-xl pl-8 pr-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-bold text-lg' />
                </div>
                
                {(selectedProduct.mandiBhav?.minPrice > 0 || selectedProduct.mandiBhav?.maxPrice > 0) && (
                  <div className="mt-2 text-xs text-emerald-600 bg-emerald-100/50 p-2 rounded-lg flex justify-between">
                    <span>Hub Min: ₹{selectedProduct.mandiBhav.minPrice}</span>
                    <span>Hub Max: ₹{selectedProduct.mandiBhav.maxPrice}</span>
                  </div>
                )}
            </div>

            <div>
                <label className='block text-gray-700 font-semibold mb-3'>Real Photos of Your Produce</label>
                <div className='flex flex-wrap gap-3'>
                    <label className='cursor-pointer flex flex-col items-center justify-center w-24 h-24 bg-gray-50 border-2 border-dashed border-green-300 rounded-xl hover:bg-green-50 transition-all text-green-600'>
                        <Upload className='w-6 h-6 mb-1' />
                        <span className='text-xs font-medium'>Add</span>
                        <input type="file" multiple accept="image/*" hidden onChange={handleImageChange} />
                    </label>
                    {previews.map((src, i) => (
                        <div key={i} className='relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200'>
                            <Image src={src} fill alt="preview" className='object-cover' />
                            <button type="button" onClick={() => removeImage(i)} className='absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition'><X className='w-3 h-3' /></button>
                        </div>
                    ))}
                </div>
            </div>

            <button disabled={loading || imageFiles.length === 0} className='w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'>
                {loading ? <Loader2 className="animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {loading ? "Publishing..." : "List Product for Sale"}
            </button>
            {imageFiles.length === 0 && <p className="text-xs text-red-500 text-center mt-2">Please add at least 1 real photo to sell.</p>}
        </div>
    </form>
  )
}

export default AddGroceryForm