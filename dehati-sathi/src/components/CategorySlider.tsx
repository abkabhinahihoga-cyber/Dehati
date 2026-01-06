'use client'
import { Apple, Book, Box, Hand, Home, Milk, Wheat } from 'lucide-react'
import React from 'react'
import {motion} from "motion/react"

function CategorySlider() {
    const categories=[
        
            {id:1,name:"Fruits & Vegetables" ,icon:Apple ,color: "bg-green-100"},
             {id:2,name:"Dairy Products" ,icon: Milk ,color:"bg-yellow-100"},
              {id:3,name:"Old Books" ,icon: Book ,color:"bg-blue-100"},
               {id:4,name:"Rice,Atta & Grains" ,icon:Wheat ,color:"bg-orange-100"},
                {id:5,name:"HandCrafted Products" ,icon: Hand ,color:"bg-rose-100 "},
                 {id:6,name:"Household Essentials" ,icon: Home ,color:"bg-lime-100"},
                  {id:7,name:"Others" ,icon: Box ,color:"bg-teal-100"},
    ]
  return (
    <motion.div
    className='w-[90%] md:w-[80%] mx-auto mt-10 relative'>
      <h2 className='text-2xl md:text-3xl font-bold text-green-700 mb-6 text-center'>🛒Shop by Category</h2>
    </motion.div>
  )
}

export default CategorySlider
