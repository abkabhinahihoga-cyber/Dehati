'use client'
import React, { useEffect, useState } from 'react'
import { Store, Package, Users, Bike, ChevronRight, Clock, Zap } from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import { toast } from 'sonner'
import { useLocale } from 'next-intl'

export default function HubDashboard() {
    const locale = useLocale();
    const [stats, setStats] = useState({ revenue: 0, orders: 0, sellers: 0, pendingDeliveryReqs: 0 })
    const [autoTime, setAutoTime] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Data + Settings
                const [dashboardRes, requestsRes, settingsRes] = await Promise.all([
                    axios.get('/api/hub/dashboard'),
                    axios.get('/api/hub/delivery-requests'),
                    axios.get('/api/hub/settings') 
                ]);

                setStats(prev => ({
                    ...prev,
                    ...(dashboardRes.data.success ? dashboardRes.data.stats : {}),
                    pendingDeliveryReqs: requestsRes.data.success ? requestsRes.data.applicants.length : 0
                }));

                // 👇 SET TIME FROM DB
                if (settingsRes.data.success) {
                    setAutoTime(settingsRes.data.time || ""); 
                }
            } catch (error) { console.error(error); }
        };
        fetchData();
    }, [])

    const saveAutoTime = async () => {
        setLoading(true);
        try {
            await axios.post('/api/hub/settings', { time: autoTime });
            toast.success(locale === 'hi' ? "समय सहेजा गया!" : "Time Saved!");
        } catch(e) { toast.error(locale === 'hi' ? "सहेजने में विफल" : "Failed to save"); }
        finally { setLoading(false); }
    }

    const triggerManualAutoAssign = async () => {
        if(!confirm(locale === 'hi' ? "क्या आप अभी ड्राइवरों को सभी लंबित ऑर्डर जारी करना चाहते हैं?" : "Release all pending orders to drivers now?")) return;
        const toastId = toast.loading(locale === 'hi' ? "रिलीज़ किया जा रहा है..." : "Releasing...");
        try {
            // 👇 CALL NEW SPECIFIC ROUTE
            const res = await axios.post('/api/hub/release-orders');
            toast.success(res.data.message, { id: toastId });
        } catch(e) { toast.error(locale === 'hi' ? "विफल" : "Failed", { id: toastId }); }
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-black text-gray-800 mb-8">{locale === 'hi' ? 'हब डैशबोर्ड' : 'Hub Dashboard'}</h1>

            {/* AUTO ASSIGN CARD */}
            <div className="bg-gradient-to-r from-green-50 to-white p-6 rounded-2xl shadow-sm border border-green-100 mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-600 text-white rounded-lg shadow-md"><Clock size={20}/></div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">{locale === 'hi' ? 'ऑटो-असाइनमेंट शेड्यूलर' : 'Auto-Assignment Scheduler'}</h3>
                        <p className="text-xs text-gray-500">{locale === 'hi' ? 'सभी उपलब्ध ड्राइवरों को स्वचालित रूप से लंबित ऑर्डर पेश करें।' : 'Automatically offer pending orders to all available drivers.'}</p>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{locale === 'hi' ? 'दैनिक रिलीज़ का समय' : 'Daily Release Time'}</label>
                        <input 
                            type="time" 
                            className="w-full p-3 border border-gray-300 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-green-500"
                            value={autoTime}
                            onChange={(e) => setAutoTime(e.target.value)}
                        />
                    </div>
                    <button onClick={saveAutoTime} disabled={loading} className="w-full md:w-auto bg-green-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200">
                        {loading ? (locale === 'hi' ? "सेव हो रहा है..." : "Saving...") : (locale === 'hi' ? "समय सहेजें" : "Save Time")}
                    </button>
                    <button onClick={triggerManualAutoAssign} className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-green-700 border border-green-200 font-bold py-3 px-6 rounded-xl hover:bg-green-50 transition-colors">
                        <Zap size={18} fill="currentColor"/> {locale === 'hi' ? 'अभी रिलीज़ करें' : 'Release Now'}
                    </button>
                </div>
            </div>

            {/* Existing Stats Code... (Keep the rest of your page as is) */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">{locale === 'hi' ? 'कुल आय' : 'Total Revenue'}</p>
                            <h3 className="text-3xl font-black text-green-600 mt-1">₹{stats.revenue}</h3>
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Store size={24}/></div>
                    </div>
                </div>
               
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">{locale === 'hi' ? 'सक्रिय ऑर्डर' : 'Active Orders'}</p>
                            <h3 className="text-3xl font-black text-gray-800 mt-1">{stats.orders}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Package size={24}/></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">{locale === 'hi' ? 'जुड़े हुए विक्रेता' : 'Linked Sellers'}</p>
                            <h3 className="text-3xl font-black text-gray-800 mt-1">{stats.sellers}</h3>
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Users size={24}/></div>
                    </div>
                </div>
                <Link href="/hub/delivery-requests" className="group">
                    <div className="bg-green-600 p-6 rounded-2xl shadow-lg shadow-green-200 transition-transform hover:scale-105 cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Bike size={80} className="text-white"/></div>
                        <div className="relative z-10 text-white">
                            <p className="text-xs font-bold uppercase opacity-80">{locale === 'hi' ? 'नौकरी के आवेदन' : 'Job Applications'}</p>
                            <h3 className="text-3xl font-black mt-1">{stats.pendingDeliveryReqs}</h3>
                            <div className="mt-4 flex items-center gap-2 text-sm font-bold bg-white/20 w-fit px-3 py-1 rounded-lg backdrop-blur-sm group-hover:bg-white group-hover:text-green-600 transition-colors">
                                {locale === 'hi' ? 'अनुरोधों की समीक्षा करें' : 'Review Requests'} <ChevronRight size={16}/>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 mb-6">{locale === 'hi' ? 'त्वरित प्रबंधन' : 'Quick Management'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Link href="/hub/orders" className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-full flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                        <Package size={20}/>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">{locale === 'hi' ? 'ऑर्डर ट्रैक करें' : 'Track Orders'}</h4>
                        <p className="text-xs text-gray-500">{locale === 'hi' ? 'स्थिति और इतिहास देखें' : 'View Status & History'}</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}