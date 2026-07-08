'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import axios from 'axios';
import { Loader2, ArrowLeft, TrendingUp, Briefcase, IndianRupee, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function WorkerDashboard() {
    const locale = useLocale();
    const isHindi = locale === 'hi';
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [navUser, setNavUser] = useState<any>(null);
    
    // Earnings calculator state
    const [calcPieces, setCalcPieces] = useState<number>(100);
    const [calcPrice, setCalcPrice] = useState<number>(2);

    useEffect(() => {
        axios.get('/api/me').then(res => { if (res.data?.user) setNavUser(res.data.user); }).catch(() => {});
        const fetchDashboard = async () => {
            try {
                const res = await axios.get('/api/work/dashboard');
                if (res.data.success) {
                    setData(res.data.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f4f7f6] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            </div>
        );
    }

    const { profile, applications } = data;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'Approved': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Material Assigned': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'Work Started': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'Submitted': return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'Payment Released': return 'bg-green-50 text-green-700 border-green-100';
            case 'Rejected': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const translateStatus = (status: string) => {
        if (!isHindi) return status;
        const translations: any = {
            'Pending': 'लंबित (Pending)',
            'Approved': 'स्वीकृत (Approved)',
            'Material Assigned': 'कच्चा माल मिला',
            'Work Started': 'काम शुरू हुआ',
            'Submitted': 'जमा किया गया',
            'Payment Released': 'भुगतान हो गया',
            'Rejected': 'अस्वीकृत'
        };
        return translations[status] || status;
    };

    return (
        <main className="min-h-screen bg-[#f4f7f6] pb-24">
            {navUser && <Nav user={navUser} />}
            
            {/* Header */}
            <div className="bg-green-700 text-white px-5 pt-8 pb-16 rounded-b-[40px] shadow-lg relative">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-2xl font-black">{isHindi ? 'मेरा काम डैशबोर्ड' : 'My Work Dashboard'}</h1>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl">
                        <p className="text-green-100 text-xs font-bold uppercase mb-1">{isHindi ? 'कुल कमाई' : 'Total Earnings'}</p>
                        <h2 className="text-3xl font-black flex items-center gap-1">
                            <IndianRupee className="w-6 h-6" />
                            {profile.totalEarnings || 0}
                        </h2>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl">
                        <p className="text-green-100 text-xs font-bold uppercase mb-1">{isHindi ? 'पूरे किए गए काम' : 'Completed Jobs'}</p>
                        <h2 className="text-3xl font-black">{profile.completedJobs || 0}</h2>
                    </div>
                </div>
            </div>

            {/* Applications List */}
            <div className="max-w-md mx-auto px-5 -mt-8 relative z-20">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900 text-lg">{isHindi ? 'मेरे आवेदन' : 'My Applications'}</h2>
                    <Link href={`/${locale}/work`} className="text-green-600 text-sm font-bold flex items-center">
                        {isHindi ? 'नया काम खोजें' : 'Find Work'} <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {applications.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl text-center shadow-sm border border-gray-100 mb-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Briefcase className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">{isHindi ? 'कोई आवेदन नहीं' : 'No Applications yet'}</h3>
                        <p className="text-sm text-gray-500 mb-4">{isHindi ? 'पैसे कमाने के लिए काम ढूंढना शुरू करें।' : 'Start applying to jobs to earn money.'}</p>
                        <Link href={`/${locale}/work`} className="bg-green-600 text-white px-6 py-2.5 rounded-full font-bold shadow-md">
                            {isHindi ? 'काम खोजें' : 'Find Work'}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3 mb-6">
                        {applications.map((app: any) => (
                            <Link key={app._id} href={`/${locale}/work/${app.workOpportunityId._id}`}>
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900 line-clamp-1">
                                            {isHindi && app.workOpportunityId.titleHindi ? app.workOpportunityId.titleHindi : app.workOpportunityId.title}
                                        </h3>
                                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border ${getStatusColor(app.status)} shrink-0`}>
                                            {translateStatus(app.status)}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 mb-3">{app.workOpportunityId.companyName}</p>
                                    
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                        <div className="flex items-center gap-1 text-green-700 font-bold">
                                            <IndianRupee className="w-3.5 h-3.5" />
                                            {app.workOpportunityId.paymentPerPiece} <span className="text-[10px] text-green-600/70 font-medium">/ {isHindi ? 'पीस' : 'piece'}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 font-medium">
                                            {new Date(app.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Earnings Calculator */}
            <div className="max-w-md mx-auto px-5">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <h2 className="font-bold text-gray-900">{isHindi ? 'कमाई कैलकुलेटर' : 'Earnings Calculator'}</h2>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div>
                            <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                                <span>{isHindi ? 'रोज कितने पीस बना सकते हैं?' : 'Pieces per day'}</span>
                                <span className="text-green-600">{calcPieces}</span>
                            </div>
                            <input type="range" min="10" max="1000" step="10" value={calcPieces} onChange={(e) => setCalcPieces(Number(e.target.value))} className="w-full accent-green-600" />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                                <span>{isHindi ? 'प्रति पीस रेट (₹)' : 'Rate per piece (₹)'}</span>
                                <span className="text-green-600">₹{calcPrice}</span>
                            </div>
                            <input type="range" min="0.5" max="50" step="0.5" value={calcPrice} onChange={(e) => setCalcPrice(Number(e.target.value))} className="w-full accent-green-600" />
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{isHindi ? 'रोजाना कमाई' : 'Daily Income'}</p>
                            <p className="text-xl font-black text-gray-900">₹{(calcPieces * calcPrice).toFixed(0)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{isHindi ? 'महीने की कमाई' : 'Monthly Income'}</p>
                            <p className="text-xl font-black text-green-600">₹{(calcPieces * calcPrice * 30).toFixed(0)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
