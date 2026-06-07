import React from 'react'
import AdminDashboard from '@/components/AdminDashboard' // Import the component we made earlier
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic";

async function AdminPage() {
  // 1. Server-Side Security Check
  const session = await auth()
  
  // If not logged in or not an admin, kick them out
  if (!session?.user || session.user.role !== 'admin') {
    redirect("/")
  }

  // 2. Render the Dashboard Component
  return (
    <>
      <AdminDashboard />
    </>
  )
}

export default AdminPage