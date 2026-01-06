import React from "react"
import connectDb from "./lib/db"
import User from "./models/user.model"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import EditRoleMobile from "@/components/EditRoleMobile"
import Nav from "@/components/Nav"
import UserDashboard from "@/components/UserDashboard"
import SellerDashboard from "@/components/SellerDashboard"
import AdminDashboard from "@/components/AdminDashboard"
import DeliveryBoy from "@/components/DeliveryBoy"

 async function Home() {
  await connectDb()
  const session=await auth()
  const user=await User.findById(session?.user?.id)
  if(!user){
    redirect("/login")
  }
  const inComplete=!user.mobile|| !user.role ||(!user.mobile && user.role=="user")
  if(inComplete){
    return<EditRoleMobile/>

  }
  const plainUser=JSON.parse(JSON.stringify(user))
  return (
    <>
      <Nav user={plainUser}/>
      {user.role=="user"?(
        <UserDashboard user={user}/>
      ):user.role=="seller"?(
        <SellerDashboard/>
      ):user.role=="admin"?(
        <AdminDashboard/>
      ):<DeliveryBoy/>
    }
    </>
  )
}
export default Home
