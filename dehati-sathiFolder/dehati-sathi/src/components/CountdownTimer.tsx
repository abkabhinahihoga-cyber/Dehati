'use client'
import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export default function CountdownTimer() {
    // Start with empty to avoid server/client mismatch
    const [timeLeft, setTimeLeft] = useState<number | null>(null)

    useEffect(() => {
        // 1. Generate a random duration between 2 hours (7200s) and 6 hours (21600s)
        // This runs ONLY on the client, ensuring no hydration mismatch.
        const randomDuration = Math.floor(Math.random() * (21600 - 7200 + 1) + 7200)
        setTimeLeft(randomDuration)

        // 2. Start Countdown
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : 0))
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // Format seconds into HH:MM:SS
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h.toString().padStart(2, '0')}h : ${m.toString().padStart(2, '0')}m : ${s.toString().padStart(2, '0')}s`
    }

    if (timeLeft === null) return null // Don't render until client loads

    return (
        <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-md shadow-sm animate-pulse">
            <Clock className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm font-mono font-bold tracking-widest">
                {formatTime(timeLeft)}
            </span>
        </div>
    )
}