'use client'
import React, { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function DebugPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const router = useRouter()

    const handleApprove = async () => {
        setLoading(true)
        setMessage('')
        try {
            // If email is empty, it approves YOU (the logged-in user)
            const res = await axios.post('/api/debug/approve-seller', { email })
            
            if (res.data.success) {
                setMessage("✅ Success! " + res.data.message)
                alert("Approval Successful! Please Log Out and Log In again to see changes.")
                router.push('/login') // Redirect to force re-login
            }
        } catch (error: any) {
            setMessage("❌ Error: " + (error.response?.data?.message || "Failed"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h1 className="text-2xl font-bold text-red-600 mb-2">Developer Tools</h1>
                <p className="text-gray-500 mb-6 text-sm">
                    Use this to bypass Admin approval while the DB server is inaccessible.
                </p>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enter Email to Approve (Optional)
                </label>
                <input 
                    type="email" 
                    placeholder="Leave empty to approve YOURSELF"
                    className="w-full p-3 border rounded-xl mb-4 bg-gray-50 outline-none focus:ring-2 focus:ring-red-200"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <button 
                    onClick={handleApprove}
                    disabled={loading}
                    className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin"/> : "Force Approve Seller"}
                </button>

                {message && (
                    <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${message.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DebugPage