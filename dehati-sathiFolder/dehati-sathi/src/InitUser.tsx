'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { setUserData } from '@/redux/userSlice'

const InitUser = () => {
    const { data: session, status } = useSession()
    const dispatch = useDispatch()

    useEffect(() => {
        const fetchUserData = async () => {
            // Only fetch if NextAuth says we are logged in
            if (status === 'authenticated') {
                try {
                    // Fetch latest user data (including location/language) from DB
                    const response = await axios.get('/api/me')
                    
                    if (response.data) {
                        dispatch(setUserData(response.data))
                    }
                } catch (error: any) {
                    // Ignore 401 errors (Guest mode), log others
                    // This prevents red errors in console when user is not logged in
                    if (error.response?.status === 404) {
                        // DB user was deleted but session cookie exists -> force logout
                        import('next-auth/react').then(({ signOut }) => signOut({ callbackUrl: '/login' }));
                    } else if (error.response && error.response.status !== 401) {
                        console.error("Fetch error:", error)
                    }
                }
            }
        }
        
        fetchUserData()
    }, [status, dispatch])

    return null
}

export default InitUser