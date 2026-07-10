'use client';

import React, { useState, use } from 'react';
import { useLocale } from 'next-intl';
import axios from 'axios';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ApplyJob({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const resolvedParams = use(params);
    const isHindi = resolvedParams.locale === 'hi';
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [form, setForm] = useState({
        familyMembersInterested: '1'
    });
    
    React.useEffect(() => {
        axios.get('/api/me').then(res => { if (res.data?._id) setUser(res.data); }).catch(() => {});
    }, []);
    const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        
        if (!user?.workerProfile?.aadhaarUrl && !aadhaarFile) {
            toast.error(isHindi ? 'कृपया आधार कार्ड की फोटो अपलोड करें' : 'Please upload Aadhaar Card photo');
            return;
        }
        
        setLoading(true);
        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => formData.append(key, (form as any)[key]));
            formData.append('workOpportunityId', resolvedParams.id);
            formData.append('familyMembersInterested', form.familyMembersInterested);
            if (aadhaarFile) formData.append('aadhaarCard', aadhaarFile);
            
            const res = await axios.post('/api/work/apply', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
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
                    <label className="block text-sm font-bold text-gray-700 mb-1">{isHindi ? 'आपके परिवार के कितने लोग यह काम करेंगे?' : 'How many family members will work?'}</label>
                    <input required name="familyMembersInterested" value={form.familyMembersInterested} onChange={handleChange} type="number" min="1" className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-green-500" placeholder="e.g., 1, 2, 3" />
                </div>
                
                {user && !user.workerProfile?.aadhaarUrl && (
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{isHindi ? 'आधार कार्ड की फोटो' : 'Aadhaar Card Photo'}</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-green-300 rounded-xl cursor-pointer bg-green-50 hover:bg-green-100 transition">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                    <svg className="w-8 h-8 mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                    <p className="mb-2 text-sm text-gray-700 font-medium">{aadhaarFile ? aadhaarFile.name : (isHindi ? 'फोटो अपलोड करने के लिए क्लिक करें' : 'Click to upload photo')}</p>
                                    <p className="text-xs text-gray-500">{isHindi ? 'केवल इमेज (JPG, PNG)' : 'Images only (JPG, PNG)'}</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setAadhaarFile(e.target.files[0]);
                                    }
                                }} />
                            </label>
                        </div>
                    </div>
                )}

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
