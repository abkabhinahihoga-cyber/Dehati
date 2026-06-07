'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Store, Plus, Package, Upload, Loader2, X, Edit2, Save } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { HUB_GROCERY_CATEGORIES } from '@/lib/constants' // 👈 Uses the new STRICT list

export default function HubInventoryPage() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null) 
    
    // Default to the first item of the STRICT Hub list
    const [formData, setFormData] = useState({
        name: '', 
        price: '', 
        category: HUB_GROCERY_CATEGORIES[0] as string, 
        unit: 'pc', 
        stock: '', 
        description: ''
    })
    
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])

    const fetchProducts = () => {
        axios.get('/api/hub/inventory')
            .then(res => setProducts(res.data.products))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchProducts() }, [])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImageFiles(files);
            const previews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(previews);
        }
    }

    const handleEditClick = (product: any) => {
        setEditingId(product._id);
        // Ensure category matches Hub list, or default to first one
        const safeCategory = HUB_GROCERY_CATEGORIES.includes(product.category) 
            ? product.category 
            : HUB_GROCERY_CATEGORIES[0];

        setFormData({
            name: product.name,
            price: String(product.price),
            category: safeCategory,
            unit: product.unit,
            stock: String(product.stock),
            description: product.description || ''
        });
        setImagePreviews(product.images || []);
        setImageFiles([]); 
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', price: '', category: HUB_GROCERY_CATEGORIES[0] as string, unit: 'pc', stock: '', description: '' });
        setImageFiles([]);
        setImagePreviews([]);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId && imageFiles.length === 0) return toast.error("Please upload at least one image");

        setSubmitting(true);
        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("price", formData.price);
            data.append("category", formData.category);
            data.append("unit", formData.unit);
            data.append("stock", formData.stock);
            data.append("description", formData.description);
            imageFiles.forEach(file => data.append("images", file));

            let res;
            if (editingId) {
                data.append("id", editingId);
                res = await axios.put('/api/hub/inventory', data, { headers: { "Content-Type": "multipart/form-data" } });
            } else {
                res = await axios.post('/api/hub/inventory', data, { headers: { "Content-Type": "multipart/form-data" } });
            }

            if(res.data.success) {
                toast.success(editingId ? "Product Updated!" : "Product Added!");
                resetForm();
                fetchProducts();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div className="p-8 font-bold text-indigo-600 flex items-center gap-2"><Loader2 className="animate-spin"/> Loading Inventory...</div>

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><Store className="text-indigo-600"/> Dehati Shop Inventory</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage GST/Packaged products sold from this Hub.</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                    {showForm ? <><X size={20}/> Cancel</> : <><Plus size={20}/> Add New Item</>}
                </button>
            </header>

            {showForm && (
                <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xl mb-8">
                    <h3 className="font-bold text-gray-800 mb-6 text-lg border-b pb-2 flex items-center gap-2">
                        {editingId ? <Edit2 size={18} className="text-orange-500"/> : <Plus size={18} className="text-green-500"/>}
                        {editingId ? "Edit Product" : "Add New Kirana Item"}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Item Name</label><input required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Tata Salt 1kg" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} /></div>
                            
                            {/* 👇 NOW STRICTLY SHOWS HUB CATEGORIES ONLY */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Category</label>
                                <select className="w-full p-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500" value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})}>
                                    {HUB_GROCERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-5">
                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Price (₹)</label><input required type="number" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="MRP" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} /></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Unit</label><select className="w-full p-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500" value={formData.unit} onChange={e=>setFormData({...formData, unit: e.target.value})}><option value="pc">Per Piece</option><option value="pkt">Per Packet</option><option value="kg">Per Kg</option><option value="l">Per Litre</option><option value="box">Per Box</option></select></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Stock Qty</label><input required type="number" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Avail Qty" value={formData.stock} onChange={e=>setFormData({...formData, stock: e.target.value})} /></div>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Product Images (Multiple)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-indigo-400 transition-all relative">
                                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="text-center text-gray-400"><Upload className="mx-auto mb-2" /><span className="text-sm">Click to upload images</span></div>
                            </div>
                            {imagePreviews.length > 0 && (
                                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                    {imagePreviews.map((src, i) => (
                                        <div key={i} className="relative w-20 h-20 shrink-0 border rounded-lg overflow-hidden">
                                            <Image src={src} alt="preview" fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <button type="submit" disabled={submitting} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2">
                            {submitting ? <><Loader2 className="animate-spin"/> Processing...</> : <><Save size={20}/> {editingId ? "Update Product" : "Publish Product"}</>}
                        </button>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((item) => (
                    <div key={item._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
                        <div className="absolute top-2 right-2 z-10">
                            <button onClick={() => handleEditClick(item)} className="p-2 bg-white/90 backdrop-blur rounded-full shadow-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-gray-100">
                                <Edit2 size={16} />
                            </button>
                        </div>
                        <div className="h-40 bg-gray-50 rounded-lg mb-4 overflow-hidden relative border border-gray-100">
                             <Image src={item.images[0] || '/placeholder.png'} alt={item.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 border border-gray-200 inline-block px-1.5 rounded">{item.category}</div>
                        <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{item.name}</h3>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-indigo-700 font-black text-xl">₹{item.price}<span className="text-xs text-gray-400 font-normal">/{item.unit}</span></span>
                            <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded-md">Stock: {item.stock}</span>
                        </div>
                    </div>
                ))}
            </div>
            
            {products.length === 0 && !showForm && (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                    <h3 className="font-bold text-gray-400">Your Dehati Shop is Empty</h3>
                    <button onClick={() => setShowForm(true)} className="mt-4 text-indigo-600 font-bold hover:underline">Add First Product</button>
                </div>
            )}
        </div>
    )
}