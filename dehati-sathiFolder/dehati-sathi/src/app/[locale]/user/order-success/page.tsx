'use client'
import React, { useEffect } from 'react'
import { motion } from "framer-motion"
import { CheckCircle, Package, Home, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
// import { clearCart } from '@/redux/cartSlice' 

function OrderSuccessPage() {
  const router = useRouter()
  const dispatch = useDispatch()

  // Optional: Clear cart on load 
  useEffect(() => {
      // dispatch(clearCart()); 
  }, [dispatch]);

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className='bg-white max-w-sm w-full rounded-2xl shadow-xl p-6 text-center border border-gray-100'
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
          className='w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5'
        >
          <CheckCircle className='text-green-600 w-10 h-10' strokeWidth={2.5} />
        </motion.div>

        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Order Placed!</h1>
        <p className='text-sm text-gray-500 mb-6 px-4'>
          Thank you for your purchase. We have received your order and are processing it.
        </p>

        <div className='bg-gray-50 rounded-xl p-4 mb-6 text-left flex items-start gap-3 border border-gray-100'>
            <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm shrink-0">
                <Package className='text-gray-700' size={18} />
            </div>
            <div>
                <h3 className='font-semibold text-gray-900 text-xs uppercase tracking-wide mb-0.5'>Order Status</h3>
                <p className='text-xs text-gray-500 leading-relaxed'>
                    You will receive a notification shortly. You can track the live status in your orders tab.
                </p>
            </div>
        </div>

        <div className='space-y-3'>
          {/* Primary Action: Track Order */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/user/my-orders")}
            className='w-full bg-zinc-900 text-white py-2.5 rounded-lg font-medium text-sm shadow-md shadow-zinc-200 hover:bg-black transition-all flex items-center justify-center gap-2'
          >
            <Package size={16} /> Track Order
          </motion.button>

          {/* Secondary Action: Continue Shopping */}
          <Link href="/" className='block w-full'>
            <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: "#f4f4f5" }}
                whileTap={{ scale: 0.97 }}
                className='w-full bg-white text-gray-700 border border-gray-200 py-2.5 rounded-lg font-medium text-sm hover:text-gray-900 transition-all flex items-center justify-center gap-2'
            >
                <Home size={16} /> Continue Shopping
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default OrderSuccessPage