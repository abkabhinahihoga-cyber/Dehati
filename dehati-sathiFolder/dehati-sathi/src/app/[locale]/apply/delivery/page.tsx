'use client'
import React, { useState } from 'react'
import { MapPin, Truck, Loader2, AlertCircle, Building2 } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'

export default function DeliveryJobApply() {
    const router = useRouter()
    const { latitude, longitude, address: userAddress } = useSelector((state: RootState) => state.location)

    const [step, setStep] = useState(1) 
    const [loading, setLoading] = useState(false)
    const [hubs, setHubs] = useState<any[]>([])
    const [locError, setLocError] = useState("")
    const [selectedHub, setSelectedHub] = useState("")

    // Updated Form State
    const [formData, setFormData] = useState({
        name: '', 
        fatherName: '', 
        mobile: '',
        vehicleType: 'bike',
        vehicleNumber: '',
        license: '',
        address: '',
        terms: false
    })

    const handleCheckAvailability = async () => {
        setLoading(true)
        setLocError("")
        if (!latitude || !longitude) {
            setLoading(false);
            return toast.error("Please select your location from the top bar first.");
        }
        try {
            const res = await axios.post('/api/delivery/check-vacancy', { lat: latitude, lng: longitude });
            if (res.data.success) {
                setHubs(res.data.hubs);
                if(res.data.hubs.length > 0) {
                    setStep(2);
                    toast.success("Hubs found!");
                } else {
                    setLocError("No Hubs found within 10km.");
                }
            }
        } catch (e) { toast.error("Failed to fetch hubs"); } 
        finally { setLoading(false); }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedHub) return toast.error("Please select a Hub");
        if(!formData.terms) return toast.error("Please accept Terms & Conditions");

        setLoading(true);
        try {
            const res = await axios.post('/api/delivery/apply', { ...formData, hubId: selectedHub });
            if(res.data.success) {
                toast.success("Application Sent Successfully!");
                router.push('/user/profile'); 
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to apply");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck size={32} />
                </div>
                <h1 className="text-3xl font-black text-gray-900">Become a Delivery Partner</h1>
                <p className="text-gray-500 mt-2">Earn by delivering fresh groceries in your village.</p>
            </div>

            {/* STEP 1: CHECK VACANCY */}
            {step === 1 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Check Vacancy Nearby</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Checking availability near: <br/>
                        <span className="font-bold text-indigo-600 block mt-1">{userAddress || "Please select a location..."}</span>
                    </p>
                    {locError && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium flex items-center justify-center gap-2"><AlertCircle size={16}/> {locError}</div>}
                    <button onClick={handleCheckAvailability} disabled={loading || !latitude} className={`w-full py-4 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${!latitude ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                        {loading ? <Loader2 className="animate-spin"/> : <MapPin/>} {latitude ? "Check Availability" : "Select Location First"}
                    </button>
                </div>
            )}

            {/* STEP 2: APPLICATION FORM */}
            {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Hub Selection */}
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Building2 size={18}/> Choose Your Hub</h3>
                        <div className="space-y-3">
                            {hubs.map((hub) => (
                                <label key={hub._id} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${!hub.isAvailable ? 'opacity-50 bg-gray-100 cursor-not-allowed border-transparent' : selectedHub === hub._id ? 'border-indigo-600 bg-white shadow-md' : 'border-gray-200 bg-white hover:border-indigo-300'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="hub" value={hub._id} disabled={!hub.isAvailable} onChange={(e) => setSelectedHub(e.target.value)} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500" />
                                        <div><p className="font-bold text-gray-900">{hub.name}</p><p className="text-xs text-gray-500">Vacancy: {2 - hub.filled} Seats Left</p></div>
                                    </div>
                                    {hub.isAvailable ? <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">OPEN</span> : <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">FULL</span>}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-800 border-b pb-2 mb-2">Personal Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name</label>
                                <input required type="text" placeholder="Your Name" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Father's Name</label>
                                <input required type="text" placeholder="Father's Name" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mobile Number</label>
                            <input required type="tel" maxLength={10} placeholder="10-digit Mobile" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Residential Address</label>
                            <textarea required rows={2} placeholder="Current Address..." className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-800 border-b pb-2 mb-2">Vehicle Details</h3>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Vehicle Type</label>
                            <select className="w-full p-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500" value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})}>
                                <option value="bike">Motorcycle</option>
                                <option value="scooter">Scooter</option>
                                <option value="ev">Electric Scooter</option>
                                <option value="cycle">Bicycle (No License Required)</option>
                            </select>
                        </div>

                        {/* CONDITIONAL RENDERING: Only show if NOT cycle */}
                        {formData.vehicleType !== 'cycle' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Vehicle Number</label>
                                    <input required type="text" placeholder="UP65 AB 1234" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Driving License No.</label>
                                    <input required type="text" placeholder="DL-1234567890" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.license} onChange={e => setFormData({...formData, license: e.target.value})} />
                                </div>
                            </div>
                        )}
                        
                        <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 mt-0.5 text-indigo-600 rounded focus:ring-indigo-500" checked={formData.terms} onChange={e => setFormData({...formData, terms: e.target.checked})} />
                            <span className="text-sm text-gray-600">I agree to the Terms & Conditions. I confirm that the details provided are accurate.</span>
                        </label>

                        <button type="submit" disabled={loading || !selectedHub} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200">
                            {loading ? "Submitting..." : "Submit Application"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}