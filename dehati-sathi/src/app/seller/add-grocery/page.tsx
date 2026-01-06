'use client'
import { ArrowLeft, Loader, PlusCircle, Upload, X } from 'lucide-react'
import Link from 'next/link'
import React, { ChangeEvent, FormEvent, useState } from 'react'
import { motion } from "motion/react"
import Image from 'next/image'
import axios from 'axios'

const categories = ["Fruits & Vegetables", "Dairy Products", "Old Books", "Rice,Atta & Grains", "HandCrafted Products", "Household Essentials", "Others"]
const units = ["kg", "g", "liter", "ml", "piece", "pack"]

function AddGrocery() {
    const [name, setName] = useState("")
    const [category, setCategory] = useState("")
    const [unit, setUnit] = useState("")
    const [minPrice, setMinPrice] = useState("")
    const [maxPrice, setMaxPrice] = useState("")
    const [stock, setStock] = useState("")
    const [loading, setLoading] = useState(false)
    
    // Multi-image state
    const [previews, setPreviews] = useState<string[]>([])
    const [imageFiles, setImageFiles] = useState<File[]>([])

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (imageFiles.length + files.length > 3) {
            alert("You can only upload up to 3 images")
            return
        }

        const newFiles = [...imageFiles, ...files]
        setImageFiles(newFiles)
        
        const newPreviews = files.map(file => URL.createObjectURL(file))
        setPreviews([...previews, ...newPreviews])
    }

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("name", name)
            formData.append("category", category)
            formData.append("unit", unit)
            formData.append("minPrice", minPrice)
            formData.append("maxPrice", maxPrice)
            formData.append("stock", stock)
            
            // Logic: Send the minimum price as the primary 'price' field
            formData.append("price", minPrice)

            imageFiles.forEach((file) => {
                formData.append("images", file)
            })

            const result = await axios.post("/api/seller/add-grocery", formData)
            console.log(result.data)
            setLoading(false)
        } catch (error) {
            console.error(error)
            setLoading(false)
        }
    }

    return (
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white py-16 px-4 relative'>
            <Link href={"/"} className='absolute top-6 left-6 flex items-center gap-2 text-green-700 font-semibold bg-white px-4 py-2 rounded-full shadow-md hover:bg-green-100 transition-all'>
                <ArrowLeft className='w-5 h-5' />
                <span className='hidden md:flex'>Back to Home</span>
            </Link>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className='bg-white w-full max-w-2xl shadow-2xl rounded-3xl border border-green-100 p-8'>
                <div className='flex flex-col items-center mb-8'>
                    <div className='flex items-center gap-3 text-green-600'>
                        <PlusCircle className='w-8 h-8' />
                        <h1 className='text-2xl font-bold text-gray-800'>Add Your Products</h1>
                    </div>
                </div>

                <form className='flex flex-col gap-6' onSubmit={handleSubmit}>
                    {/* Name */}
                    <div>
                        <label className='block text-gray-700 font-medium mb-1'>Product Name*</label>
                        <input type="text" required placeholder='e.g. Organic Tomato' onChange={(e) => setName(e.target.value)} value={name} className='w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none' />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {/* Category */}
                        <div>
                            <label className='block text-gray-700 font-medium mb-1'>Category*</label>
                            <select required value={category} onChange={(e) => setCategory(e.target.value)} className='w-full border border-gray-300 rounded-xl px-4 py-3 bg-white outline-none'>
                                <option value="">Select Category</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        {/* Unit */}
                        <div>
                            <label className='block text-gray-700 font-medium mb-1'>Unit*</label>
                            <select required value={unit} onChange={(e) => setUnit(e.target.value)} className='w-full border border-gray-300 rounded-xl px-4 py-3 bg-white outline-none'>
                                <option value="">Select Unit</option>
                                {units.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {/* Min Price */}
                        <div>
                            <label className='block text-gray-700 font-medium mb-1'>Min Price (₹)*</label>
                            <input type="number" required value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className='w-full border border-gray-300 rounded-xl px-4 py-3 outline-none' />
                        </div>
                        {/* Max Price */}
                        <div>
                            <label className='block text-gray-700 font-medium mb-1'>Max Price (₹)*</label>
                            <input type="number" required value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className='w-full border border-gray-300 rounded-xl px-4 py-3 outline-none' />
                        </div>
                        {/* Stock */}
                        <div>
                            <label className='block text-gray-700 font-medium mb-1'>Stock Qty*</label>
                            <input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} className='w-full border border-gray-300 rounded-xl px-4 py-3 outline-none' />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className='space-y-4'>
                        <label className='block text-gray-700 font-medium'>Product Images (Max 3)*</label>
                        <div className='flex flex-wrap gap-4'>
                            <label htmlFor="image" className='cursor-pointer flex flex-col items-center justify-center w-24 h-24 bg-green-50 text-green-700 border-2 border-dashed border-green-300 rounded-xl hover:bg-green-100 transition-all'>
                                <Upload className='w-6 h-6' />
                                <span className='text-[10px] mt-1'>Upload</span>
                                <input type="file" id='image' accept='image/*' hidden multiple onChange={handleImageChange} disabled={imageFiles.length >= 3} />
                            </label>

                            {previews.map((src, index) => (
                                <div key={index} className='relative w-24 h-24'>
                                    <Image src={src} fill alt='preview' className='rounded-xl object-cover border' />
                                    <button type='button' onClick={() => removeImage(index)} className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg'>
                                        <X className='w-3 h-3' />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className='w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2'
                    >
                        {loading ? <Loader className='animate-spin' /> : "Add Product"}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    )
}

export default AddGrocery