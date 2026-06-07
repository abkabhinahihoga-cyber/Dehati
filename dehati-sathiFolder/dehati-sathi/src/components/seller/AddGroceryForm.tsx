'use client'
import { Loader2, Upload, X, IndianRupee } from 'lucide-react'
import React, { ChangeEvent, FormEvent, useState } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { SELLER_GROCERY_CATEGORIES } from '@/lib/constants' // 👈 USES SPECIFIC LIST

const units = ["kg", "g", "liter", "ml", "piece", "dozen"]

function AddGroceryForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("") 
  const [unit, setUnit] = useState("")
  const [stock, setStock] = useState("")
  const [wholesalePrice, setWholesalePrice] = useState("")
  const [retailPrice, setRetailPrice] = useState("")
  const [previews, setPreviews] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])

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
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("description", description)
      formData.append("category", category)
      formData.append("unit", unit)
      formData.append("stock", stock)
      formData.append("wholesalePrice", wholesalePrice)
      formData.append("retailPrice", retailPrice)
      formData.append("productType", "grocery") 

      imageFiles.forEach((file) => formData.append("images", file))

      await axios.post("/api/seller/add-product", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      alert("Grocery Item Added Successfully!")
      router.push('/seller/dashboard')
    } catch (error: any) {
      alert("Failed: " + (error.response?.data?.error || "Server Error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='grid md:grid-cols-2 gap-8'>
        {/* Left Column */}
        <div className='space-y-6'>
            <div>
                <label className='block text-gray-700 font-semibold mb-2'>Product Name</label>
                <input type="text" required placeholder='e.g. Fresh Desi Tomatoes' value={name} onChange={e => setName(e.target.value)} 
                    className='w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white transition' />
            </div>
            <div>
                <label className='block text-gray-700 font-semibold mb-2'>Description</label>
                <textarea rows={4} placeholder='Describe quality, origin, freshness...' value={description} onChange={e => setDescription(e.target.value)} 
                    className='w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white transition resize-none' />
            </div>
            <div className='grid grid-cols-2 gap-4'>
                <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Category</label>
                    {/* 👇 SELLER SPECIFIC MAP */}
                    <select required value={category} onChange={e => setCategory(e.target.value)} className='w-full border rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-green-500'>
                        <option value="">Select...</option>
                        {SELLER_GROCERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Stock Qty</label>
                    <input type="number" required placeholder='100' value={stock} onChange={e => setStock(e.target.value)} className='w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none' />
                </div>
            </div>
        </div>

        {/* Right Column (Pricing etc - kept same) */}
        <div className='space-y-6'>
            <div className='bg-green-50 p-5 rounded-xl border border-green-100'>
                <h3 className='text-green-800 font-bold mb-4 flex items-center gap-2'><IndianRupee className='w-4 h-4'/> Pricing Details</h3>
                <div className='grid grid-cols-2 gap-4'>
                    <div>
                        <label className='block text-gray-600 text-sm font-medium mb-1'>Wholesale Price (₹)</label>
                        <input type="number" required placeholder='40' value={wholesalePrice} onChange={e => setWholesalePrice(e.target.value)} className='w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none' />
                    </div>
                    <div>
                        <label className='block text-gray-600 text-sm font-medium mb-1'>Retail Price (₹)</label>
                        <input type="number" required placeholder='55' value={retailPrice} onChange={e => setRetailPrice(e.target.value)} className='w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none' />
                    </div>
                </div>
                <div className='mt-4'>
                     <label className='block text-gray-600 text-sm font-medium mb-1'>Unit Type</label>
                     <select required value={unit} onChange={e => setUnit(e.target.value)} className='w-full border rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-green-500'>
                        <option value="">Select Unit</option>
                        {units.map(u => <option key={u} value={u}>per {u}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className='block text-gray-700 font-semibold mb-3'>Product Images</label>
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

            <button disabled={loading} className='w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'>
                {loading ? <Loader2 className='animate-spin' /> : "Publish Product"}
            </button>
        </div>
    </form>
  )
}

export default AddGroceryForm