'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import axios from 'axios';
import { Loader2, ArrowLeft, ShieldCheck, MapPin, Briefcase, ChevronRight, CheckCircle2, AlertTriangle, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function JobDetails({ params }: { params: { locale: string; id: string } }) {
    const isHindi = params.locale === 'hi';
    const router = useRouter();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await axios.get(`/api/work/${params.id}`);
                if (res.data.success) {
                    setJob(res.data.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6]">
                <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f7f6]">
                <p>{isHindi ? 'काम नहीं मिला' : 'Work not found'}</p>
                <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-xl">
                    {isHindi ? 'वापस जाएं' : 'Go Back'}
                </button>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#f4f7f6] pb-24">
            {/* Top Bar */}
            <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="font-bold text-gray-900 truncate px-4">{isHindi && job.titleHindi ? job.titleHindi : job.title}</h1>
                <div className="w-10"></div>
            </div>

            {/* Image Slider */}
            <div className="bg-white p-4">
                <div className="w-full h-64 bg-gray-50 rounded-2xl relative overflow-hidden flex items-center justify-center">
                    {job.productImages && job.productImages.length > 0 ? (
                        <Image src={job.productImages[0]} alt={job.title} fill className="object-contain p-4 mix-blend-multiply" />
                    ) : (
                        <span className="text-gray-400">No Image</span>
                    )}
                </div>
            </div>

            {/* Title & Trust */}
            <div className="bg-white px-5 pt-2 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold uppercase">{job.category}</span>
                    {job.isVerified && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold flex items-center gap-1 border border-blue-100">
                            <ShieldCheck className="w-3.5 h-3.5" /> 100% {isHindi ? 'वेरीफाइड' : 'Verified'}
                        </span>
                    )}
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">{isHindi && job.titleHindi ? job.titleHindi : job.title}</h2>
                <p className="text-gray-500 font-medium">{job.companyName}</p>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-2 gap-3 p-5">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">{isHindi ? 'काम का प्रकार' : 'Work Type'}</p>
                        <p className="font-bold text-gray-800 text-sm">{job.workType}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">{isHindi ? 'कठिनाई' : 'Difficulty'}</p>
                        <p className="font-bold text-gray-800 text-sm">{job.difficulty}</p>
                    </div>
                </div>
            </div>

            {/* Earnings Section */}
            <div className="mx-5 mb-5 bg-gradient-to-br from-green-700 to-green-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <p className="text-green-100 text-sm font-medium mb-1">{isHindi ? 'प्रति पीस कमाई' : 'Payment Per Piece'}</p>
                <h3 className="text-4xl font-black mb-4">₹{job.paymentPerPiece} <span className="text-base font-normal opacity-80">/ {isHindi ? 'पीस' : 'piece'}</span></h3>
                
                <div className="bg-black/20 rounded-xl p-4">
                    <p className="text-xs text-green-100 font-medium mb-2">{isHindi ? 'अनुमानित कमाई (उदाहरण)' : 'Estimated Earnings (Example)'}</p>
                    <div className="flex justify-between items-center text-sm">
                        <span>100 {isHindi ? 'पीस' : 'Pieces'}</span>
                        <span className="font-bold">₹{job.paymentPerPiece * 100}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                        <span>500 {isHindi ? 'पीस' : 'Pieces'}</span>
                        <span className="font-bold">₹{job.paymentPerPiece * 500}</span>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="bg-white px-5 py-6 mb-24">
                <h3 className="font-bold text-lg mb-3">{isHindi ? 'काम के बारे में' : 'About the Work'}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{job.description}</p>
                
                <div className="space-y-3">
                    {job.rawMaterialProvided && (
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            {isHindi ? 'कच्चा माल कंपनी देगी' : 'Raw material provided by company'}
                        </div>
                    )}
                    {job.trainingAvailable && (
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <PlayCircle className="w-5 h-5 text-blue-600" />
                            {isHindi ? 'ट्रेनिंग उपलब्ध है' : 'Training video available'}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Apply Action */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-6 flex gap-3 z-50">
                <Link 
                    href={`/${params.locale}/work/apply/${job._id}`}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center transition-all shadow-[0_8px_20px_rgba(22,163,74,0.3)] active:scale-95"
                >
                    {isHindi ? 'अभी अप्लाई करें' : 'Apply Now'}
                </Link>
            </div>
        </main>
    );
}
