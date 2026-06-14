'use client'
import { ArrowLeft, PlusCircle, BookOpen } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { motion } from "framer-motion"
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { usePathname } from 'next/navigation'
import AddGroceryForm from '@/components/seller/AddGroceryForm' 
import AddBookForm from '@/components/seller/AddBookForm'

function AddProductPage() {
  const { mode } = useSelector((state: RootState) => state.mode)
  const pathname = usePathname()
  const isHindi = pathname.startsWith('/hi')

  const t = {
    backToDashboard: isHindi ? 'डैशबोर्ड पर वापस जाएं' : 'Back to Dashboard',
    addGrocery: isHindi ? 'नई किराने की वस्तु जोड़ें' : 'Add New Grocery Item',
    sellBook: isHindi ? 'पुरानी किताब बेचें' : 'Sell Old Book',
  }

  return (
    <div className={`min-h-screen py-8 px-4 md:px-8 pb-24 transition-colors duration-500 ${mode === 'grocery' ? 'bg-green-50' : 'bg-indigo-50'}`}>
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
            <Link href="/seller/dashboard" className='flex items-center gap-2 text-gray-600 hover:text-black transition'>
                <ArrowLeft className='w-5 h-5' /> {t.backToDashboard}
            </Link>
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${mode === 'grocery' ? 'text-green-800' : 'text-indigo-800'}`}>
                {mode === 'grocery' ? <PlusCircle className='text-green-600'/> : <BookOpen className='text-indigo-600'/>}
                {mode === 'grocery' ? t.addGrocery : t.sellBook}
            </h1>
        </div>

        <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            className='bg-white shadow-xl rounded-2xl p-6 md:p-8 border border-gray-100'
        >
            {/* Conditional Rendering based on Redux Mode */}
            {mode === 'grocery' ? (
                <AddGroceryForm /> 
            ) : (
                <AddBookForm />
            )}

        </motion.div>
      </div>
    </div>
  )
}

export default AddProductPage