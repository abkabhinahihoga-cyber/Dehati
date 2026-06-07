'use client'
import PasswordRegisterForm from '@/components/PasswordRegisterForm'
import React from 'react'
import { useRouter } from 'next/navigation'

function Register() {
  const router = useRouter()

  const handleBack = () => {
    router.push('/login')
  }

  return (
    <div>
      <PasswordRegisterForm />
    </div>
  )
}

export default Register