'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import axios from 'axios';
import { Loader2, FileText, CheckCircle, User, ChevronRight, Calculator, TrendingUp, Award, Briefcase, Clock, ArrowRight, DollarSign, Wallet } from 'lucide-react';
import Nav from '@/components/Nav';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';

const PROGRESS_STEPS = [
    { key: 'Pending', label: 'Applied', labelHi: 'आवेदन किया', icon: FileText, color: 'bg-orange-500' },
    { key: 'Approved', label: 'Approved', labelHi: 'स्वीकृत', icon: CheckCircle, color: 'bg-blue-500' },
    { key: 'Material Assigned', label: 'Material Assigned', labelHi: 'सामग्री मिली', icon: Briefcase, color: 'bg-purple-500' },
    { key: 'Work Started', label: 'Work Started', labelHi: 'काम शुरू', icon: TrendingUp, color: 'bg-indigo-500' },
    { key: 'Submitted', label: 'Submitted', labelHi: 'जमा किया', icon: FileText, color: 'bg-yellow-500' },
    { key: 'Quality Check', label: 'Quality Check', labelHi: 'गुणवत्ता जांच', icon: CheckCircle, color: 'bg-pink-500' },
    { key: 'Payment Released', label: 'Payment Released', labelHi: 'भुगतान हुआ', icon: DollarSign, color: 'bg-green-500' },
];

export default function WorkerDashboard() {
    const locale = useLocale();
    const isHindi = locale === 'hi';
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>({});
    const [applications, setApplications] = useState<any[]>([]);
    
    const [activeTab, setActiveTab] = useState<'applications' | 'calculator' | 'profile'>('applications');
    
    // Earnings calculator state
    const [calcPieces, setCalcPieces] = useState('50');
    const [calcRate, setCalcRate] = useState('2');
    const [calcDays, setCalcDays] = useState('26');

    useEffect(() => {
        axios.get('/api/me').then(res => { if (res.data?.user) setUser(res.data.user); }).catch(() => {});
        
        axios.get('/api/work/dashboard')
            .then(res => {
                if (res.data.success) {
                    setProfile(res.data.data.profile);
                    setApplications(res.data.data.applications);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const getStatusIndex = (status: string) => PROGRESS_STEPS.findIndex(s => s.key === status);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Approved': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Material Assigned': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Work Started': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'Submitted': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Quality Check': return 'bg-pink-100 text-pink-700 border-pink-200';
            case 'Payment Released': return 'bg-green-100 text-green-700 border-green-200';
            case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const dailyIncome = Number(calcPieces) * Number(calcRate);
    const weeklyIncome = dailyIncome * 7;
    const monthlyIncome = dailyIncome * Number(calcDays);
    const yearlyIncome = monthlyIncome * 12;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            {user && <Nav user={user} />}
            
            {/* Header */}
            <div className="bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 text-white px-5 pt-8 pb-6 rounded-b-[30px] shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('/welcome_bg.png')] bg-cover bg-center"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-400/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/40 overflow-hidden">
                        {user?.image ? (
                            <Image src={user.image} alt="User" width={64} height={64} className="rounded-full object-cover w-full h-full" />
                        ) : (
                            <User className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black">{user?.name || (isHindi ? 'कार्यकर्ता' : 'Worker')}</h1>
                        <p className="text-green-100 font-medium text-sm">
                            {isHindi ? 'कार्यकर्ता डैशबोर्ड' : 'Worker Dashboard'}
                        </p>
                    </div>
                </div>
                
                {/* Stats row */}
                <div className="relative z-10 flex gap-3 mt-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex-1 border border-white/20">
                        <div className="text-green-200 text-[10px] font-bold uppercase mb-1">{isHindi ? 'कुल कमाई' : 'Total Earnings'}</div>
                        <div className="text-xl font-black flex items-center gap-1"><Wallet className="w-4 h-4" /> ₹{profile.totalEarnings || 0}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex-1 border border-white/20">
                        <div className="text-green-200 text-[10px] font-bold uppercase mb-1">{isHindi ? 'पूरे काम' : 'Completed'}</div>
                        <div className="text-xl font-black flex items-center gap-1"><Award className="w-4 h-4" /> {profile.completedJobs || 0}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex-1 border border-white/20">
                        <div className="text-green-200 text-[10px] font-bold uppercase mb-1">{isHindi ? 'रेटिंग' : 'Rating'}</div>
                        <div className="text-xl font-black flex items-center gap-1">⭐ {profile.ratings || 0}</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-md mx-auto px-5 mt-6 mb-4">
                <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
                    <button 
                        onClick={() => setActiveTab('applications')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'applications' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}
                    >
                        {isHindi ? 'मेरे आवेदन' : 'Applications'}
                    </button>
                    <button 
                        onClick={() => setActiveTab('calculator')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'calculator' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}
                    >
                        {isHindi ? 'कमाई कैलकुलेटर' : 'Calculator'}
                    </button>
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'profile' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}
                    >
                        {isHindi ? 'प्रोफ़ाइल' : 'Profile'}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-md mx-auto px-5">
                {/* === APPLICATIONS TAB === */}
                {activeTab === 'applications' && (
                    <div className="space-y-4">
                        {applications.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="font-bold text-gray-800 mb-2">{isHindi ? 'कोई आवेदन नहीं' : 'No Applications'}</h3>
                                <p className="text-sm text-gray-500 mb-6">{isHindi ? 'आपने अभी तक किसी काम के लिए आवेदन नहीं किया है।' : 'You haven\'t applied for any work yet.'}</p>
                                <button 
                                    onClick={() => router.push(`/${locale}/work`)}
                                    className="bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition"
                                >
                                    {isHindi ? 'काम खोजें' : 'Find Work'}
                                </button>
                            </div>
                        ) : (
                            applications.map((app, idx) => {
                                const currentStepIndex = getStatusIndex(app.status);
                                return (
                                    <motion.div 
                                        key={idx} 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 mr-3">
                                                <h3 className="font-bold text-gray-900 text-base leading-tight">
                                                    {isHindi ? (app.workOpportunityId?.titleHindi || app.workOpportunityId?.title) : app.workOpportunityId?.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-0.5">{app.workOpportunityId?.companyName}</p>
                                            </div>
                                            <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 ${getStatusColor(app.status)}`}>
                                                {app.status}
                                            </div>
                                        </div>
                                        
                                        {/* Progress Pipeline */}
                                        {app.status !== 'Rejected' && (
                                            <div className="mb-4 -mx-1">
                                                <div className="flex items-center justify-between">
                                                    {PROGRESS_STEPS.map((step, i) => {
                                                        const isCompleted = i <= currentStepIndex;
                                                        const isCurrent = i === currentStepIndex;
                                                        const Icon = step.icon;
                                                        return (
                                                            <React.Fragment key={step.key}>
                                                                <div className="flex flex-col items-center" title={isHindi ? step.labelHi : step.label}>
                                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                                        isCompleted ? step.color + ' text-white' : 'bg-gray-100 text-gray-400'
                                                                    } ${isCurrent ? 'ring-2 ring-offset-1 ring-green-400' : ''}`}>
                                                                        <Icon className="w-3 h-3" />
                                                                    </div>
                                                                </div>
                                                                {i < PROGRESS_STEPS.length - 1 && (
                                                                    <div className={`flex-1 h-0.5 mx-0.5 rounded ${i < currentStepIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </div>
                                                <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">
                                                    {isHindi ? PROGRESS_STEPS[currentStepIndex]?.labelHi : PROGRESS_STEPS[currentStepIndex]?.label}
                                                </p>
                                            </div>
                                        )}

                                        <div className="bg-gray-50 rounded-xl p-3 mb-3 flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-medium mb-0.5">{isHindi ? 'प्रति पीस' : 'Per Piece'}</p>
                                                <p className="font-bold text-green-700">₹{app.workOpportunityId?.paymentPerPiece}</p>
                                            </div>
                                            <div className="h-8 w-px bg-gray-200"></div>
                                            <div className="text-center">
                                                <p className="text-[10px] text-gray-500 font-medium mb-0.5">{isHindi ? 'तय मात्रा' : 'Assigned'}</p>
                                                <p className="font-bold text-gray-800">{app.assignedQuantity || 0}</p>
                                            </div>
                                            <div className="h-8 w-px bg-gray-200"></div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-500 font-medium mb-0.5">{isHindi ? 'कमाई' : 'Earned'}</p>
                                                <p className="font-bold text-green-700">₹{app.earnedAmount || 0}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                                            <span>{new Date(app.appliedAt).toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                        
                        {applications.length > 0 && (
                            <div className="pt-4 pb-8">
                                <button 
                                    onClick={() => router.push(`/${locale}/work`)}
                                    className="w-full bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95"
                                >
                                    <Briefcase className="w-5 h-5" />
                                    {isHindi ? 'और काम खोजें' : 'Find More Work'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                {/* === CALCULATOR TAB === */}
                {activeTab === 'calculator' && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-green-600" />
                                {isHindi ? 'कमाई कैलकुलेटर' : 'Earnings Calculator'}
                            </h3>
                            <p className="text-sm text-gray-500 mb-5">{isHindi ? 'अपनी संभावित कमाई का अनुमान लगाएं' : 'Estimate your potential earnings'}</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{isHindi ? 'प्रतिदिन पीस' : 'Pieces Per Day'}</label>
                                    <input type="number" value={calcPieces} onChange={e => setCalcPieces(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-lg font-bold focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{isHindi ? 'प्रति पीस भुगतान (₹)' : 'Payment Per Piece (₹)'}</label>
                                    <input type="number" value={calcRate} onChange={e => setCalcRate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-lg font-bold focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{isHindi ? 'कार्य दिवस / माह' : 'Working Days / Month'}</label>
                                    <input type="number" value={calcDays} onChange={e => setCalcDays(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-lg font-bold focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-700 to-emerald-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                            <h4 className="font-bold text-green-100 text-sm uppercase tracking-wider mb-4">{isHindi ? 'आपकी अनुमानित कमाई' : 'Your Estimated Earnings'}</h4>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-xl p-3">
                                    <span className="text-green-100 font-medium">{isHindi ? '📅 रोजाना' : '📅 Daily'}</span>
                                    <span className="font-black text-xl">₹{dailyIncome.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-xl p-3">
                                    <span className="text-green-100 font-medium">{isHindi ? '📆 साप्ताहिक' : '📆 Weekly'}</span>
                                    <span className="font-black text-xl">₹{weeklyIncome.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <span className="text-white font-bold">{isHindi ? '🗓️ मासिक' : '🗓️ Monthly'}</span>
                                    <span className="font-black text-2xl text-green-200">₹{monthlyIncome.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-xl p-3">
                                    <span className="text-green-100 font-medium">{isHindi ? '📊 वार्षिक' : '📊 Yearly'}</span>
                                    <span className="font-black text-xl">₹{yearlyIncome.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* === PROFILE TAB === */}
                {activeTab === 'profile' && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{isHindi ? 'व्यक्तिगत जानकारी' : 'Personal Information'}</h3>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500 font-medium">{isHindi ? 'कौशल' : 'Skills'}</span>
                                    <span className="text-sm font-bold text-gray-800">{profile.skills?.join(', ') || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500 font-medium">{isHindi ? 'अनुभव' : 'Experience'}</span>
                                    <span className="text-sm font-bold text-gray-800">{profile.experience || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500 font-medium">{isHindi ? 'उपलब्ध घंटे' : 'Available Hours'}</span>
                                    <span className="text-sm font-bold text-gray-800">{profile.availableHours || 0} hrs/day</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                {isHindi ? 'दस्तावेज़' : 'Documents'}
                            </h3>
                            
                            {profile.aadhaarUrl ? (
                                <div className="flex items-center gap-3 bg-green-50 p-3 rounded-xl border border-green-100">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-green-800 text-sm">{isHindi ? 'आधार कार्ड' : 'Aadhaar Card'}</p>
                                        <p className="text-xs text-green-600 font-medium">{isHindi ? '✅ अपलोड किया गया' : '✅ Uploaded'}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 bg-orange-50 p-3 rounded-xl border border-orange-100">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-orange-800 text-sm">{isHindi ? 'आधार कार्ड' : 'Aadhaar Card'}</p>
                                        <p className="text-xs text-orange-600 font-medium">{isHindi ? '⚠️ अपलोड नहीं किया गया' : '⚠️ Not uploaded'}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Find More Work Button */}
                        <button 
                            onClick={() => router.push(`/${locale}/work`)}
                            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95"
                        >
                            <Briefcase className="w-5 h-5" />
                            {isHindi ? 'और काम खोजें' : 'Find More Work'}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
