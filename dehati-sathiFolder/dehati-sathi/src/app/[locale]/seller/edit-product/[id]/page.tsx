'use client'
import { ArrowLeft, Loader2, Save, Upload, X, Book, Store, FileText, Calculator, IndianRupee } from 'lucide-react'
import Link from 'next/link'
import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { motion } from "framer-motion"
import Image from 'next/image'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { SELLER_GROCERY_CATEGORIES, BOOK_CATEGORIES } from '@/lib/constants'

// Common Units
const units = ["kg", "g", "liter", "ml", "piece", "dozen"]

function EditProduct() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
      name: "", 
      description: "", 
      category: "", 
      unit: "piece", 
      stock: "", 
      wholesalePrice: "", 
      retailPrice: "",
      productType: "grocery", 
      
      // Book Specifics
      materialType: "book", // 'book' or 'notes'
      author: "",
      publication: "",
      year: "",
      condition: "good",
      printedPrice: ""
  })

  const [currentImages, setCurrentImages] = useState<string[]>([]) 
  const [newPreviews, setNewPreviews] = useState<string[]>([]) 
  const [newFiles, setNewFiles] = useState<File[]>([]) 

  // --- 1. AUTO PRICE CALCULATOR (Only for Books) ---
  useEffect(() => {
    // Only run if it's a book AND we have a printed price
    if (formData.productType !== 'book' || formData.materialType === 'notes') return;
    if (!formData.printedPrice) return;
    
    const price = parseFloat(formData.printedPrice);
    let discount = 0.50; 

    if (formData.condition === 'like-new') discount = 0.45; 
    if (formData.condition === 'good') discount = 0.40;     
    if (formData.condition === 'fair') discount = 0.30;     

    const calculated = Math.round(price * discount);
    setFormData(prev => ({ ...prev, retailPrice: String(calculated) }));
  }, [formData.printedPrice, formData.condition, formData.materialType, formData.productType]);

  // --- 2. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await axios.get(`/api/seller/product/${params.id}`)
            if(res.data.success) {
                const p = res.data.product
                const isBook = p.productType === 'book';
                
                const validList: readonly string[] = isBook ? BOOK_CATEGORIES : SELLER_GROCERY_CATEGORIES;
                let safeCategory = p.category;
                if (!validList.includes(p.category)) safeCategory = validList[0];

                setFormData({
                    name: p.name,
                    description: p.description || "",
                    category: safeCategory,
                    unit: p.unit || "piece",
                    stock: String(p.stock),
                    wholesalePrice: String(p.wholesalePrice),
                    retailPrice: String(p.retailPrice),
                    productType: p.productType || "grocery",
                    
                    // Populate Book Details
                    materialType: p.bookDetails?.type || "book", // 'book' or 'notes'
                    author: p.bookDetails?.author || "",
                    publication: p.bookDetails?.publication || "",
                    year: p.bookDetails?.year || "",
                    condition: p.bookDetails?.condition || "good",
                    printedPrice: p.bookDetails?.printedPrice || ""
                })
                setCurrentImages(p.images || [])
            }
        } catch (error) {
            toast.error("Failed to load product")
            router.push('/seller/dashboard')
        } finally {
            setLoading(false)
        }
    }
    fetchData()
  }, [params.id, router])

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setNewFiles([...newFiles, ...files])
    const previews = files.map(file => URL.createObjectURL(file))
    setNewPreviews([...newPreviews, ...previews])
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = new FormData()
      
      // Common Fields
      data.append("name", formData.name)
      data.append("description", formData.description)
      data.append("category", formData.category)
      data.append("stock", formData.stock)
      data.append("productType", formData.productType)
      data.append("retailPrice", formData.retailPrice)
      
      if(formData.productType === 'grocery') {
          data.append("unit", formData.unit)
          data.append("wholesalePrice", formData.wholesalePrice)
      } else {
          // For books/notes
          data.append("wholesalePrice", formData.retailPrice)
          data.append("unit", "piece")
          
          const bookDetails = {
              type: formData.materialType, // Save correct type
              author: formData.author,
              publication: formData.publication,
              year: formData.year,
              condition: formData.materialType === 'notes' ? 'good' : formData.condition,
              printedPrice: formData.materialType === 'notes' ? '0' : formData.printedPrice
          }
          data.append("bookDetails", JSON.stringify(bookDetails))
      }

      newFiles.forEach((file) => data.append("images", file))

      await axios.put(`/api/seller/product/${params.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success("Product Updated Successfully!")
      router.push('/seller/dashboard')
    } catch (error) {
      toast.error("Update Failed")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className='h-screen flex items-center justify-center'><Loader2 className='animate-spin'/></div>

  const isBook = formData.productType === 'book';
  const activeCategories = isBook ? BOOK_CATEGORIES : SELLER_GROCERY_CATEGORIES;

  return (
    <div className={`min-h-screen py-12 px-4 md:px-8 ${isBook ? 'bg-indigo-50' : 'bg-green-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className='flex items-center justify-between mb-8'>
            <Link href="/seller/dashboard" className='flex items-center gap-2 text-gray-600 hover:text-black transition'>
                <ArrowLeft className='w-5 h-5' /> Back
            </Link>
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${isBook ? 'text-indigo-800' : 'text-green-800'}`}>
                {isBook ? <Book className='w-6 h-6'/> : <Store className='w-6 h-6'/>} 
                Edit {isBook ? (formData.materialType === 'book' ? "Book Details" : "Notes Details") : "Grocery Item"}
            </h1>
        </div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className='bg-white shadow-xl rounded-2xl p-6 md:p-8 border border-gray-100'>
            <form onSubmit={handleSubmit} className='grid md:grid-cols-2 gap-8'>
                
                {/* --- LEFT COLUMN --- */}
                <div className='space-y-6'>
                    
                    {/* 👇 MATERIAL TYPE SWITCHER (Only for Student Zone) */}
                    {isBook && (
                        <div className='bg-indigo-50 p-1 rounded-lg flex mb-4'>
                            <button type="button" onClick={() => setFormData({...formData, materialType: 'book'})} className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.materialType === 'book' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}>
                                <Book size={16}/> Old Book
                            </button>
                            <button type="button" onClick={() => setFormData({...formData, materialType: 'notes'})} className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.materialType === 'notes' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}>
                                <FileText size={16}/> Notes
                            </button>
                        </div>
                    )}

                    <div>
                        <label className='block text-gray-700 font-semibold mb-2'>
                            {isBook ? (formData.materialType === 'book' ? 'Book Title' : 'Subject Name') : 'Product Name'}
                        </label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                            className='w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-indigo-500' />
                    </div>
                    
                    <div>
                        <label className='block text-gray-700 font-semibold mb-2'>Category</label>
                        <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} 
                            className='w-full border rounded-xl px-4 py-3 bg-white outline-none'>
                            {activeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {isBook ? (
                        <>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-gray-700 font-semibold mb-2'>{formData.materialType === 'book' ? 'Author' : 'Creator'}</label>
                                    <input type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} 
                                        className='w-full border rounded-xl px-3 py-3 outline-none' />
                                </div>
                                <div>
                                    <label className='block text-gray-700 font-semibold mb-2'>{formData.materialType === 'book' ? 'Publication' : 'Institute'}</label>
                                    <input type="text" value={formData.publication} onChange={e => setFormData({...formData, publication: e.target.value})} 
                                        className='w-full border rounded-xl px-3 py-3 outline-none' />
                                </div>
                            </div>
                            
                            {/* Only show Condition/Year for Books, Maybe Year for Notes too */}
                            <div className='grid grid-cols-2 gap-4'>
                                {formData.materialType === 'book' && (
                                    <div>
                                        <label className='block text-gray-700 font-semibold mb-2'>Condition</label>
                                        <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className='w-full border rounded-xl px-3 py-3 bg-white'>
                                            <option value="new">New</option>
                                            <option value="like-new">Like New</option>
                                            <option value="good">Good</option>
                                            <option value="fair">Fair</option>
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className='block text-gray-700 font-semibold mb-2'>Year</label>
                                    <input type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} 
                                        className='w-full border rounded-xl px-3 py-3 outline-none' />
                                </div>
                            </div>
                        </>
                    ) : (
                        // Grocery Pricing Inputs
                        <div className='grid grid-cols-2 gap-4'>
                             <div>
                                <label className='block text-gray-700 font-semibold mb-2'>Wholesale (₹)</label>
                                <input type="number" required value={formData.wholesalePrice} onChange={e => setFormData({...formData, wholesalePrice: e.target.value})} 
                                    className='w-full border rounded-xl px-3 py-3 outline-none' />
                            </div>
                            <div>
                                <label className='block text-gray-700 font-semibold mb-2'>Retail (₹)</label>
                                <input type="number" required value={formData.retailPrice} onChange={e => setFormData({...formData, retailPrice: e.target.value})} 
                                    className='w-full border rounded-xl px-3 py-3 outline-none' />
                            </div>
                        </div>
                    )}
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className='space-y-6'>
                    <div>
                        <label className='block text-gray-700 font-semibold mb-2'>Description</label>
                        <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} 
                            className='w-full border rounded-xl px-4 py-3 outline-none resize-none' />
                    </div>
                    
                    {/* BOOK PRICING LOGIC */}
                    {isBook && formData.materialType === 'book' ? (
                        <div className='bg-indigo-50 p-4 rounded-xl border border-indigo-100'>
                            <h3 className='text-indigo-800 font-bold mb-3 flex items-center gap-2 text-sm'><Calculator className='w-4 h-4'/> Price Calculator</h3>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-gray-600 text-xs font-bold mb-1'>Printed MRP (₹)</label>
                                    <input type="number" placeholder='500' value={formData.printedPrice} onChange={e => setFormData({...formData, printedPrice: e.target.value})} 
                                        className='w-full border rounded-xl px-3 py-2 outline-none' />
                                </div>
                                <div>
                                    <label className='block text-gray-600 text-xs font-bold mb-1'>Selling Price</label>
                                    <input type="number" readOnly value={formData.retailPrice} 
                                        className='w-full border border-indigo-300 bg-indigo-100 rounded-xl px-3 py-2 outline-none font-bold text-indigo-700 cursor-not-allowed' />
                                </div>
                            </div>
                        </div>
                    ) : isBook && formData.materialType === 'notes' ? (
                        <div className='bg-yellow-50 p-4 rounded-xl border border-yellow-100'>
                            <h3 className='text-yellow-800 font-bold mb-3 flex items-center gap-2 text-sm'><IndianRupee className='w-4 h-4'/> Set Your Price</h3>
                            <div>
                                <label className='block text-gray-700 font-bold mb-1 text-xs'>Selling Price (₹)</label>
                                <input type="number" required value={formData.retailPrice} onChange={e => setFormData({...formData, retailPrice: e.target.value})} 
                                    className='w-full text-xl font-bold text-green-700 border border-yellow-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yellow-500 outline-none' />
                            </div>
                        </div>
                    ) : (
                        // Grocery Stock/Unit
                        <div className='grid grid-cols-2 gap-4'>
                             <div>
                                <label className='block text-gray-700 font-semibold mb-2'>Stock Qty</label>
                                <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} 
                                    className='w-full border rounded-xl px-3 py-3 outline-none' />
                            </div>
                            <div>
                                <label className='block text-gray-700 font-semibold mb-2'>Unit</label>
                                <select required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} 
                                    className='w-full border rounded-xl px-3 py-3 bg-white outline-none'>
                                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Image Section */}
                    <div>
                        <label className='block text-gray-700 font-semibold mb-2'>Update Images (Optional)</label>
                        <div className='flex gap-2 overflow-x-auto pb-2'>
                            {currentImages.map((src, i) => (
                                <div key={'old'+i} className='relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border'>
                                    <Image src={src} fill alt="old" className='object-cover opacity-75' />
                                </div>
                            ))}
                            {newPreviews.map((src, i) => (
                                <div key={'new'+i} className='relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-green-500'>
                                    <Image src={src} fill alt="new" className='object-cover' />
                                </div>
                            ))}
                            <label className='w-16 h-16 flex items-center justify-center bg-gray-100 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-200 transition'>
                                <Upload className='w-5 h-5 text-gray-500' />
                                <input type="file" multiple accept="image/*" hidden onChange={handleImageChange} />
                            </label>
                        </div>
                    </div>

                    <button disabled={saving} className={`w-full text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${isBook ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'}`}>
                        {saving ? <Loader2 className='animate-spin' /> : "Update Product"}
                    </button>
                </div>
            </form>
        </motion.div>
      </div>
    </div>
  )
}

export default EditProduct