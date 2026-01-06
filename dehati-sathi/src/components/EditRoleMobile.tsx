'use client'
import React, { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Bike, Tractor, User, UserCog } from 'lucide-react'
import axios from 'axios'
import { redirect } from 'next/dist/server/api-utils'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'


function EditRoleMobile() {
  const [roles] = useState([
    { id: 'admin', label: 'Admin', icon: UserCog },
    { id: 'user', label: 'Buyer', icon: User },
    { id: 'seller', label: 'Seller', icon: Tractor },
    { id: 'deliveryBoy', label: 'Delivery Boy', icon: Bike }
  ])
  const [selectedRole, setSelectedRole] = useState('')
  const [mobile, setMobile] = useState("")
  const {update}=useSession()
  const router=useRouter()
  const handleEdit = async () => {
  try {
    const result = await axios.post("/api/user/edit-role-mobile", {
      role: selectedRole, // Ensure key name matches backend destructuring
      mobile: mobile
    });
    await update({role:selectedRole})
    router.push("/")
    // Add success logic here (e.g., redirect or toast)
  } catch (error) {
    console.error("Submission failed", error);
  }
};
 
  

  return (
    <div className="flex flex-col items-center min-h-screen p-6 w-full">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-3xl md:text-4xl font-extrabold text-green-700 text-center mt-8"
      >
        Select Your Role
      </motion.h1>

      <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-10">
        {roles.map((role) => {
          const Icon = role.icon
          const isSelected = selectedRole === role.id
          const base =
            'flex flex-col items-center justify-center w-48 h-44 rounded-2xl border-2 transition-all'
          const conditional = isSelected
            ? 'border-green-600 bg-green-100 shadow-lg'
            : 'border-gray-300 bg-white hover:border-green-400'
          return (
            <motion.div
              key={role.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedRole(role.id)}
              className={`${base} ${conditional}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedRole(role.id)
              }}
            >
              <Icon
                className={isSelected ? 'text-green-600 w-10 h-10' : 'text-gray-600 w-10 h-10'}
              />
              <span className="mt-3 font-medium">{role.label}</span>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="flex flex-col items-center mt-10"
      >
        <label htmlFor="mobile" className="text-gray-700 font-medium mb-2">
          Enter Your Mobile No.
        </label>
        <input
          type="tel"
          id="mobile"
          className="w-64 md:w-80 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none text-gray-800"
          placeholder="eg.7543945762"
          onChange={(e)=>setMobile(e.target.value)}
        />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        disabled={mobile.length!==10 || !selectedRole}
        
        className={`inline-flex items-center gap-2 font-semibold py-3 px-8 rounded-2xl shadow-md transition-all duration-200 w-[200px] mt-20 ${
            selectedRole && mobile.length===10
           ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        onClick={handleEdit}
      >
        Go to Home
        <ArrowRight/>
      </motion.button>
    </div>
  )
}

export default EditRoleMobile