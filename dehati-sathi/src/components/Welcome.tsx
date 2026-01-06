'use client'
import React from 'react'
import { motion } from "motion/react"
import { ArrowRight, BikeIcon, ShoppingBasket, StoreIcon } from 'lucide-react'
type propType={
    nextStep:(s:number)=>void
}
function Welcome({nextStep}:propType) {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen text-center p-6 bg-linear-to-b from-green-100 to-white'>
      <motion.div 
      initial={{
        opacity:0,
        y:-20
      }}
      animate={{
        opacity:1,
        y:0
      }}
      transition={{
        duration:1
      }}
      className='flex items-center gap-3'
      >
        <StoreIcon  className='w-10 h-10 text-green-600'/>
        <h1 className='text-4xl md:text-5xl font-extrabold text-green-700'>Dehati Sathi</h1>
        
      </motion.div>
      <motion.p 
        initial={{
        opacity:0,
        y:20
      }}
      animate={{
        opacity:1,
        y:0
      }}
      transition={{
        duration:1,
        delay:0.3
      }}
      className='mt-4 text-gray-700 text-lg md:text-xl max-w-lg'
      >
        Your One-stop destination for fresh groceries,organic produce,and daily essentials delivered rights to your doorsteps.
      </motion.p>
      <motion.div
      initial={{
        opacity:0,
        scale:0.8
      }}
      animate={{
        opacity:1,
        scale:1
      }}
      transition={{
        duration:1,
        delay:0.6
      }}
      className='flex items-center justify-center gap-10 mt-10'
      >
        <ShoppingBasket className='w-24 h-24 md:w-32 md:h-32 text-green-600 drop-shadow-md'/>
        <BikeIcon className='w-24 h-24 md:w-32 md:h-32 text-orange-600 drop-shadow-md'/>
      </motion.div>
      <motion.button
      initial={{
        opacity:0,
        y:20
      }}
      animate={{
        opacity:1,
        y:0
      }}
      transition={{
        duration:1,
        delay:1
      }}
      className='inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-2xl shadow-md transition-all duration-200 mt-10'
      onClick={()=>nextStep(2)}
      >
        Next
        <ArrowRight/>
      </motion.button>

    </div>
  )
}

export default Welcome
