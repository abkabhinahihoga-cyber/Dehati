'use client';

import React, { useEffect, useState, use } from 'react';
import { useLocale } from 'next-intl';
import axios from 'axios';
import { Loader2, ArrowLeft, ShieldCheck, MapPin, Briefcase, CheckCircle2, PlayCircle, Share2, Bookmark, Phone, MessageCircle, AlertTriangle, Clock, Star, Users, Package, ChevronDown, ChevronUp, IndianRupee } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function JobDetails({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const resolvedParams = use(params);
    const isHindi = resolvedParams.locale === 'hi';
    const router = useRouter();
    const [job, setJob] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [showFAQ, setShowFAQ] = useState<number | null>(null);

    useEffect(() => {
        axios.get('/api/me').then(res => { if (res.data?.user) setUser(res.data.user); }).catch(() => {});
    }, []);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await axios.get(`/api/work/${resolvedParams.id}`);
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
    }, [resolvedParams.id]);

    const handleShare = async () => {
        const shareData = {
            title: job.title,
            text: `${job.title} - ₹${job.paymentPerPiece}/${job.paymentUnit || 'piece'} | ${job.companyName} | Dehati Saathi Work & Earn`,
            url: window.location.href
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success(isHindi ? 'लिंक कॉपी हो गया!' : 'Link copied!');
            }
        } catch {}
    };

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

    const defaultFaqs = [
        { q: isHindi ? 'क्या कोई शुल्क देना होगा?' : 'Do I need to pay any fee?', a: isHindi ? 'नहीं, कोई भी शुल्क नहीं देना होगा। सारा काम मुफ्त में मिलता है।' : 'No, you don\'t need to pay any fee. All work is provided free of cost.' },
        { q: isHindi ? 'कच्चा माल कैसे मिलेगा?' : 'How will I get raw material?', a: isHindi ? 'कंपनी या नजदीकी पिकअप सेंटर से कच्चा माल दिया जाएगा।' : 'Raw material will be provided by the company or nearest pickup center.' },
        { q: isHindi ? 'पैसे कब मिलेंगे?' : 'When will I get paid?', a: isHindi ? 'क्वालिटी चेक के बाद 7 दिन के अंदर भुगतान किया जाएगा।' : 'Payment will be made within 7 days after quality check.' },
        { q: isHindi ? 'कितने लोग काम कर सकते हैं?' : 'How many people can work?', a: isHindi ? 'आपके परिवार के सदस्य भी साथ में काम कर सकते हैं।' : 'Your family members can also work together.' },
    ];
    
    const faqs = (job.faqs && job.faqs.length > 0) ? job.faqs.map((f: any) => ({ q: f.question, a: f.answer })) : defaultFaqs;
    
    const whatsappContact = job.adminContactWhatsApp || job.assignedHub?.managerPhone || "917565089255";
    const phoneContact = job.adminContactPhone || job.assignedHub?.managerPhone || "+917565089255";
    const cleanWhatsapp = whatsappContact.replace(/\D/g, '');

    return (
        <main className="min-h-screen bg-[#f4f7f6] pb-28">
            {/* Top Bar */}
            <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="font-bold text-gray-900 truncate px-4 text-sm">{isHindi && job.titleHindi ? job.titleHindi : job.title}</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setSaved(!saved)} className={`w-10 h-10 flex items-center justify-center rounded-full ${saved ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
                        <Bookmark className="w-5 h-5" fill={saved ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-500">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Image */}
            <div className="bg-white p-4">
                <div className="w-full h-64 bg-gray-50 rounded-2xl relative overflow-hidden flex items-center justify-center">
                    {job.productImages && job.productImages.length > 0 ? (
                        <Image src={job.productImages[0]} alt={job.title} fill className="object-contain p-4 mix-blend-multiply" />
                    ) : (
                        <div className="text-center">
                            <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-2" />
                            <span className="text-gray-400 text-sm">{isHindi ? 'कोई इमेज नहीं' : 'No Image'}</span>
                        </div>
                    )}
                    {job.isVerified && (
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm pl-1.5 pr-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-green-100">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                            <span className="text-[10px] font-black text-green-800 uppercase">{isHindi ? 'वेरीफाइड' : 'Verified'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Title & Company */}
            <div className="bg-white px-5 pt-2 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold uppercase">{job.category}</span>
                    {job.trustScore > 0 && (
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-bold flex items-center gap-1 border border-amber-100">
                            <Star className="w-3 h-3" fill="currentColor" /> {job.trustScore}/100
                        </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-bold ${job.workAvailability === 'High Demand' ? 'bg-green-50 text-green-700' : job.workAvailability === 'Limited' ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'}`}>
                        {job.workAvailability || 'High Demand'}
                    </span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">{isHindi && job.titleHindi ? job.titleHindi : job.title}</h2>
                <p className="text-gray-500 font-medium">{job.companyName}</p>
            </div>

            {/* Key Highlights Grid */}
            <div className="grid grid-cols-2 gap-3 p-5">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">{isHindi ? 'काम का प्रकार' : 'Work Type'}</p>
                        <p className="font-bold text-gray-800 text-sm">{job.workType === 'Home Based' ? (isHindi ? 'घर बैठे' : 'Home Based') : job.workType}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">{isHindi ? 'कठिनाई' : 'Difficulty'}</p>
                        <p className="font-bold text-gray-800 text-sm">{job.difficulty === 'Easy' ? (isHindi ? 'आसान' : 'Easy') : job.difficulty}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                        <Star className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">{isHindi ? 'कौशल स्तर' : 'Skill Level'}</p>
                        <p className="font-bold text-gray-800 text-sm">{job.skillLevel || 'Beginner'}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">{isHindi ? 'समय/पीस' : 'Time/Piece'}</p>
                        <p className="font-bold text-gray-800 text-sm">{job.estimatedTimePerPieceMinutes ? `${job.estimatedTimePerPieceMinutes} min` : 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Earnings Card */}
            <div className="mx-5 mb-5 bg-gradient-to-br from-green-700 to-emerald-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <p className="text-green-100 text-sm font-medium mb-1">{isHindi ? 'प्रति यूनिट कमाई' : `Payment Per ${job.paymentUnit || 'piece'}`}</p>
                <h3 className="text-4xl font-black mb-4">₹{job.paymentPerPiece} <span className="text-base font-normal opacity-80">/ {job.paymentUnit || (isHindi ? 'पीस' : 'piece')}</span></h3>
                
                <div className="bg-black/20 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-green-100 font-bold mb-2 uppercase tracking-wider">{isHindi ? 'कमाई का अनुमान' : 'Earnings Estimate'}</p>
                    <div className="flex justify-between items-center text-sm">
                        <span>100 {job.paymentUnit || (isHindi ? 'पीस' : 'Pieces')}</span>
                        <span className="font-bold">₹{job.paymentPerPiece * 100}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span>500 {job.paymentUnit || (isHindi ? 'पीस' : 'Pieces')}</span>
                        <span className="font-bold">₹{job.paymentPerPiece * 500}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-white/20 pt-2 mt-2">
                        <span className="font-bold">{isHindi ? 'रोज़ाना (अनुमान)' : 'Daily (Est.)'}</span>
                        <span className="font-black text-lg">₹{job.estimatedDailyIncome || (job.paymentPerPiece * 50)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold">{isHindi ? 'मासिक (अनुमान)' : 'Monthly (Est.)'}</span>
                        <span className="font-black text-lg text-green-200">₹{job.estimatedMonthlyIncome || ((job.estimatedDailyIncome || job.paymentPerPiece * 50) * 26)}</span>
                    </div>
                </div>
            </div>

            {/* About the Work */}
            <div className="bg-white px-5 py-6 mb-3">
                <h3 className="font-bold text-lg mb-3">{isHindi ? 'काम के बारे में' : 'About the Work'}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{job.description || (isHindi ? 'विवरण उपलब्ध नहीं' : 'No description available')}</p>
                
                {/* Features badges */}
                <div className="space-y-3">
                    {job.rawMaterialProvided && (
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-700 bg-green-50 p-3 rounded-xl border border-green-100">
                            <Package className="w-5 h-5 text-green-600" />
                            {isHindi ? '✅ कच्चा माल कंपनी देगी' : '✅ Raw material provided by company'}
                        </div>
                    )}
                    {job.trainingAvailable && (
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-700 bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <PlayCircle className="w-5 h-5 text-blue-600" />
                            {isHindi ? '📚 ट्रेनिंग उपलब्ध है' : '📚 Training available'}
                        </div>
                    )}
                    {job.availablePositions && (
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-700 bg-purple-50 p-3 rounded-xl border border-purple-100">
                            <Users className="w-5 h-5 text-purple-600" />
                            {isHindi ? `${job.availablePositions} पद उपलब्ध` : `${job.availablePositions} positions available`}
                        </div>
                    )}
                </div>
            </div>

            {/* Step-by-Step Process */}
            {job.stepByStepProcess && job.stepByStepProcess.length > 0 && (
                <div className="bg-white px-5 py-6 mb-3">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        📋 {isHindi ? 'काम कैसे करें' : 'Step-by-Step Process'}
                    </h3>
                    <div className="space-y-3">
                        {job.stepByStepProcess.map((step: string, i: number) => (
                            <div key={i} className="flex gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm shrink-0">{i + 1}</div>
                                <p className="text-gray-700 text-sm pt-1.5">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quality Guidelines */}
            {job.qualityGuidelines && (
                <div className="bg-white px-5 py-6 mb-3">
                    <h3 className="font-bold text-lg mb-3">🎯 {isHindi ? 'गुणवत्ता दिशानिर्देश' : 'Quality Guidelines'}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{job.qualityGuidelines}</p>
                </div>
            )}

            {/* Required Tools */}
            {job.requiredTools && job.requiredTools.length > 0 && (
                <div className="bg-white px-5 py-6 mb-3">
                    <h3 className="font-bold text-lg mb-3">🔧 {isHindi ? 'आवश्यक उपकरण' : 'Required Tools'}</h3>
                    <div className="flex flex-wrap gap-2">
                        {job.requiredTools.map((tool: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-100">{tool}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Training Video */}
            {job.trainingVideoUrl && (
                <div className="bg-white px-5 py-6 mb-3">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <PlayCircle className="w-5 h-5 text-red-600" />
                        {isHindi ? 'ट्रेनिंग वीडियो' : 'Training Video'}
                    </h3>
                    <a 
                        href={job.trainingVideoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full flex flex-col items-center justify-center p-6 bg-red-50 rounded-2xl border border-red-100 text-red-700 font-bold gap-2 hover:bg-red-100 transition-colors"
                    >
                        <PlayCircle className="w-10 h-10" />
                        {isHindi ? 'यूट्यूब पर वीडियो देखें' : 'Watch Video on YouTube'}
                    </a>
                </div>
            )}

            {/* Pickup & Delivery */}
            {(job.pickupProcess || job.nearestPickupCenter) && (
                <div className="bg-white px-5 py-6 mb-3">
                    <h3 className="font-bold text-lg mb-3">🚚 {isHindi ? 'पिकअप और डिलीवरी' : 'Pickup & Delivery'}</h3>
                    {job.pickupProcess && <p className="text-gray-600 text-sm leading-relaxed mb-2">{job.pickupProcess}</p>}
                    {job.nearestPickupCenter && (
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">{isHindi ? 'निकटतम पिकअप:' : 'Nearest Pickup:'} {job.nearestPickupCenter}</span>
                        </div>
                    )}
                </div>
            )}

            {/* FAQs */}
            <div className="bg-white px-5 py-6 mb-3">
                <h3 className="font-bold text-lg mb-4">❓ {isHindi ? 'अक्सर पूछे जाने वाले सवाल' : 'FAQs'}</h3>
                <div className="space-y-2">
                    {faqs.map((faq, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                            <button onClick={() => setShowFAQ(showFAQ === i ? null : i)} className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <span className="font-bold text-sm text-gray-800">{faq.q}</span>
                                {showFAQ === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </button>
                            {showFAQ === i && (
                                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-6 z-50">
                <div className="flex flex-col gap-2 max-w-md mx-auto">
                    {job.assignedHub && (!user || user.hubId !== job.assignedHub._id) && (
                        <div className="text-center px-4 py-2 bg-red-50 text-red-600 font-medium text-xs rounded-lg border border-red-100">
                            {isHindi ? `यह काम केवल ${job.assignedHub.name} के सदस्यों के लिए है।` : `This job is restricted to members of ${job.assignedHub.name}.`}
                        </div>
                    )}
                    <div className="flex gap-3 w-full">
                        <a href={`https://wa.me/${cleanWhatsapp}`} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center text-green-600 shrink-0 hover:bg-green-100 transition-colors">
                            <MessageCircle className="w-6 h-6" />
                        </a>
                        <a href={`tel:${phoneContact}`} className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 hover:bg-blue-100 transition-colors">
                            <Phone className="w-6 h-6" />
                        </a>
                        {(!job.assignedHub || (user && user.hubId === job.assignedHub._id)) ? (
                            <Link 
                                href={`/${params.locale}/work/apply/${job._id}`}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center transition-all shadow-[0_8px_20px_rgba(22,163,74,0.3)] active:scale-95"
                            >
                                {isHindi ? 'अभी अप्लाई करें' : 'Apply Now'}
                            </Link>
                        ) : (
                            <button 
                                disabled
                                className="flex-1 bg-gray-300 text-gray-500 font-bold text-lg py-4 rounded-2xl flex items-center justify-center cursor-not-allowed"
                            >
                                {isHindi ? 'अप्लाई नहीं कर सकते' : 'Cannot Apply'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
