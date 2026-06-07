'use client'
import { AppDispatch } from '@/redux/store'
import { setUserData } from '@/redux/userSlice'
import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

function useGetMe() {
    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        const getMe = async () => {
            try {
                // 1. Fetch data
                const result = await axios.get("/api/me")
                
                // 2. Check structure matches route.ts response: { user: {...}, status: 200 }
                if (result.data && result.data.user) {
                    dispatch(setUserData(result.data.user))
                }
            } catch (error) {
                console.error("Error fetching user:", error)
            }
        }
        
        getMe()
    }, [dispatch])
}

export default useGetMe