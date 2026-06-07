'use client'
import { IOrder } from '@/app/models/order.model'
import axios from 'axios'
import React, { useEffect, useState } from 'react'

function ManageOrders() {
    const [orders,setOrders]=useState<IOrder[]>()
    useEffect(()=>{
        const getOrders=async ()=>{
            try {
               const result=await axios.get("/api/admin/get-orders") 
               setOrders(result.data)
            } catch (error) {
                console.log(error)
            }
        }
        getOrders()
    },[])
  return (
    <div>
      
    </div>
  )
}

export default ManageOrders
