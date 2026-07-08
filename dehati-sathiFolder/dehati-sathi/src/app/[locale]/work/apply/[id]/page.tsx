'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import axios from 'axios';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ApplyJob({ params }: { params: { locale: string; id: string } }) {
    const isHindi = params.locale === 'hi';
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        fullName: '',
        mobileNumber: '',
        village: '',
        district: '',
        state: '',
        age: '',
        occupation: '',
        workingHoursPerDay: ''
    });

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('/api/work/apply', {
                ...form,
                workOpportunityId: params.id,
                age: Number(form.age),
                workingHoursPerDay: Number(form.workingHoursPerDay)
            });
            if (res.data.success) {
                setSuccess(true);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-5 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">
                    {isHindi ? 'आवेदन सफल!' : 'Application Successful!'}
                </h1>
                <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                    {isHindi 
                        ? 'आपका आवेदन एडमिन को भेज दिया गया है। स्वीकृति मिलने पर आपको सूचित किया जाएगा।' 
                        : 'Your application has been sent to the admin. You will be notified upon approval.'}
                </p>
                <button 
                    onClick={() => router.push(`/${params.locale}/worker/dashboard`)}
                    className="w-full max-w-sm bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
                >
                    {isHindi ? 'डैशबोर्ड पर जाएं' : 'Go to Dashboard'}
                </button>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-white pb-10">
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center border-b border-gray-100 sticky top-0 z-50">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full mr-3">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="font-bold text-gray-900 text-lg">{isHindi ? 'काम के लिए आवेदन' : 'Apply for Work'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="p-5 max-w-md mx-auto space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{isHindi ? 'पूरा नाम' : 'Full Name'}</label>
                    <input required name="fullName" value={form.fullName} onChange={handleChange} type="text" className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-green-500" placeholder={isHindi ? 'अपना नाम लिखें' : 'Enter your name'} />
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{isHindi ? 'मोबाइल नंबर' : 'Mobile Number'}</label>
                    <input required name="mobileNumber" value={form.mobileNumber} onChange={handleChange} type="tel" className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-green-500" placeholder="10 digit number" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{isHindi ? 'गाँव' : 'Village'}</label>
                        <input required name="village" value={form.village} onChange={handleChange} type="text" className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{isHindi ? 'उम्र' : 'Age'}</label>
                        <input required name="age" value={form.age} onChange={handleChange} type="number" className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-green-500" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{isHindi ? 'जिला' : 'District'}</label>
                    <input required name="district" value={form.district} onChange={handleChange} type="text" className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{isHindi ? 'राज्य' : 'State'}</label>
                    <input required name="state" value={form.state} onChange={handleChange} type="text" className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{isHindi ? 'वर्तमान काम' : 'Current Occupation'}</label>
                    <input required name="occupation" value={form.occupation} onChange={handleChange} type="text" className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-green-500" placeholder={isHindi ? 'उदा. खेती, गृहिणी, छात्र' : 'e.g., Farming, Housewife, Student'} />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{isHindi ? 'रोजाना कितने घंटे काम कर सकते हैं?' : 'How many hours can you work daily?'}</label>
                    <input required name="workingHoursPerDay" value={form.workingHoursPerDay} onChange={handleChange} type="number" className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-green-500" placeholder="e.g., 4" />
                </div>

                <div className="pt-6">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_rgba(22,163,74,0.3)] active:scale-95 transition-all flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isHindi ? 'आवेदन जमा करें' : 'Submit Application')}
                    </button>
                </div>
            </form>
        </main>
    );
}
