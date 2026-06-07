'use client'
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { Upload, X, Loader2, Calculator, Book, FileText, IndianRupee } from 'lucide-react'
import Image from 'next/image'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BOOK_CATEGORIES } from '@/lib/constants' // 👈 Updated Import

// ❌ Removed: const categories = [...]

function AddBookForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Form State
    const [materialType, setMaterialType] = useState('book') // 'book' or 'notes'
    
    const [name, setName] = useState("")
    const [author, setAuthor] = useState("") 
    const [publication, setPublication] = useState("")
    const [year, setYear] = useState("")
    const [category, setCategory] = useState("")
    const [condition, setCondition] = useState("good") 
    const [printedPrice, setPrintedPrice] = useState("")
    const [sellingPrice, setSellingPrice] = useState("")
    const [description, setDescription] = useState("")

    // Image State
    const [previews, setPreviews] = useState<string[]>([])
    const [imageFiles, setImageFiles] = useState<File[]>([])

    // --- AUTO PRICE CALCULATOR (Only for Books) ---
    useEffect(() => {
        // If it's NOTES, don't auto-calculate. Let user type.
        if (materialType === 'notes') return;

        if (!printedPrice || !condition) return;
        
        const price = parseFloat(printedPrice);
        let discount = 0.50; 

        if (condition === 'like-new') discount = 0.45; 
        if (condition === 'good') discount = 0.40;     
        if (condition === 'fair') discount = 0.30;     

        const calculated = Math.round(price * discount);
        setSellingPrice(String(calculated));
    }, [printedPrice, condition, materialType])

    // Reset price when switching modes
    useEffect(() => {
        setSellingPrice("")
        setPrintedPrice("")
    }, [materialType])

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return
        setImageFiles([...imageFiles, ...files])
        setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
    }

    const removeImage = (index: number) => {
        setPreviews(prev => prev.filter((_, i) => i !== index))
        setImageFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData()
            
            formData.append("productType", "book") 
            formData.append("name", name)
            formData.append("category", category)
            formData.append("description", description)
            formData.append("stock", "1")
            
            // For notes, we might not have a printed price, so send selling price as both
            const finalWholesale = sellingPrice
            const finalRetail = sellingPrice

            formData.append("wholesalePrice", finalWholesale)
            formData.append("retailPrice", finalRetail)

            const details = {
                type: materialType, 
                author,
                publication,
                year,
                condition: materialType === 'notes' ? 'good' : condition, // Default condition for notes
                printedPrice: materialType === 'notes' ? '0' : printedPrice
            }
            formData.append("bookDetails", JSON.stringify(details))

            imageFiles.forEach(file => formData.append("images", file))

            await axios.post("/api/seller/add-product", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            toast.success("Listed Successfully!")
            router.push('/seller/dashboard')
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to add")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className='grid md:grid-cols-2 gap-8'>
            <div className='space-y-5'>
                {/* --- Material Switcher --- */}
                <div className='bg-indigo-50 p-1 rounded-lg flex mb-6'>
                    <button type="button" onClick={() => setMaterialType('book')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${materialType === 'book' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}>
                        <Book size={18}/> Old Book
                    </button>
                    <button type="button" onClick={() => setMaterialType('notes')} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${materialType === 'notes' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}>
                        <FileText size={18}/> Handwritten Notes
                    </button>
                </div>

                <div>
                    <label className='block text-gray-700 font-semibold mb-2'>
                        {materialType === 'book' ? 'Book Title' : 'Subject / Topic Name'}
                    </label>
                    <input type="text" required placeholder={materialType === 'book' ? 'e.g. HC Verma Physics' : 'e.g. Kota Class 11 Physics Notes'} value={name} onChange={e => setName(e.target.value)} 
                        className='w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none' />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                    <div>
                        <label className='block text-gray-700 font-semibold mb-2'>
                            {materialType === 'book' ? 'Author (Optional)' : 'Creator / Teacher'}
                        </label>
                        {/* REMOVED 'required' HERE */}
                        <input type="text" placeholder={materialType === 'book' ? 'e.g. HC Verma' : 'e.g. Topper Student'} value={author} onChange={e => setAuthor(e.target.value)} 
                            className='w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none' />
                    </div>
                    <div>
                        <label className='block text-gray-700 font-semibold mb-2'>
                             {materialType === 'book' ? 'Publication' : 'Institute/Source'}
                        </label>
                        <input type="text" placeholder={materialType === 'book' ? 'Publisher' : 'e.g. Allen/Self'} value={publication} onChange={e => setPublication(e.target.value)} 
                            className='w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none' />
                    </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                    <div>
                        <label className='block text-gray-700 font-semibold mb-2'>Class/Category</label>
                        {/* 👇 UPDATED MAP */}
                        <select required value={category} onChange={e => setCategory(e.target.value)} className='w-full border rounded-xl px-4 py-3 bg-white outline-none'>
                            <option value="">Select Level</option>
                            {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className='block text-gray-700 font-semibold mb-2'>
                            {materialType === 'book' ? 'Publish Year' : 'Written Year'}
                        </label>
                        <input type="number" placeholder='e.g. 2023' value={year} onChange={e => setYear(e.target.value)} 
                            className='w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none' />
                    </div>
                </div>

                <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Description</label>
                    <textarea rows={3} placeholder={materialType === 'book' ? 'Mention torn pages, condition...' : 'Mention handwriting quality, topics covered...'} value={description} onChange={e => setDescription(e.target.value)} 
                        className='w-full border rounded-xl px-4 py-3 outline-none resize-none' />
                </div>
            </div>

            <div className='space-y-6'>
                
                {/* --- PRICING SECTION --- */}
                {materialType === 'book' ? (
                    // 1. OLD BOOK: CALCULATOR UI
                    <div className='bg-indigo-50 p-5 rounded-xl border border-indigo-100 transition-all'>
                        <h3 className='text-indigo-800 font-bold mb-4 flex items-center gap-2'><Calculator className='w-4 h-4'/> Price Calculator</h3>
                        
                        <div className='mb-4'>
                            <label className='block text-gray-600 text-sm font-medium mb-2'>Book Condition</label>
                            <select required value={condition} onChange={e => setCondition(e.target.value)} 
                                className='w-full border rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-indigo-500'>
                                <option value="new">New / Unused (50% MRP)</option>
                                <option value="like-new">Like New (45% MRP)</option>
                                <option value="good">Good (40% MRP)</option>
                                <option value="fair">Fair / Torn Pages (30% MRP)</option>
                            </select>
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label className='block text-gray-600 text-sm font-medium mb-1'>Printed MRP (₹)</label>
                                <input type="number" required placeholder='500' value={printedPrice} onChange={e => setPrintedPrice(e.target.value)} 
                                    className='w-full border rounded-xl px-3 py-2 outline-none' />
                            </div>
                            <div>
                                <label className='block text-gray-600 text-sm font-medium mb-1'>Selling Price</label>
                                <input type="number" required readOnly value={sellingPrice} 
                                    className='w-full border border-indigo-300 bg-indigo-100 rounded-xl px-3 py-2 outline-none font-bold text-indigo-700 cursor-not-allowed' />
                                <p className='text-[10px] text-indigo-500 mt-1'>Auto-calculated</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // 2. NOTES: MANUAL PRICE UI
                    <div className='bg-yellow-50 p-5 rounded-xl border border-yellow-100 transition-all'>
                        <h3 className='text-yellow-800 font-bold mb-4 flex items-center gap-2'><IndianRupee className='w-4 h-4'/> Set Your Price</h3>
                        
                        <div>
                            <label className='block text-gray-700 font-bold mb-2'>Selling Price (₹)</label>
                            <input type="number" required placeholder='e.g. 150' value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} 
                                className='w-full text-2xl font-bold text-green-700 border border-yellow-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 outline-none' />
                            <p className='text-xs text-gray-500 mt-2'>Enter the fair price for your hard work.</p>
                        </div>
                    </div>
                )}

                <div>
                    <label className='block text-gray-700 font-semibold mb-3'>Upload Photos</label>
                    <div className='flex flex-wrap gap-3'>
                        <label className='cursor-pointer flex flex-col items-center justify-center w-24 h-24 bg-gray-50 border-2 border-dashed border-indigo-300 rounded-xl hover:bg-indigo-50 transition-all text-indigo-600'>
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

                <button disabled={loading} className='w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50'>
                    {loading ? <Loader2 className='animate-spin' /> : (materialType === 'book' ? "List Book" : "List Notes")}
                </button>
            </div>
        </form>
    )
}

export default AddBookForm