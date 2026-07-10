'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { ArrowLeft, PlayCircle, FileText, CheckCircle, Award, Star, Video, Download, Volume2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

const TRAINING_MODULES = [
    {
        id: 1,
        title: 'Agarbatti Making Basics',
        titleHi: 'अगरबत्ती बनाने के मूल तत्व',
        category: 'Manufacturing',
        categoryHi: 'निर्माण',
        thumbnail: 'https://images.unsplash.com/photo-1608500218899-7347da738ba5?q=80&w=2000&auto=format&fit=crop',
        duration: '15 min',
        rating: 4.8,
        completed: false,
        type: 'Video',
        color: 'from-amber-500 to-orange-600'
    },
    {
        id: 2,
        title: 'Quality Packaging Guide',
        titleHi: 'क्वालिटी पैकेजिंग गाइड',
        category: 'Packaging',
        categoryHi: 'पैकेजिंग',
        thumbnail: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2000&auto=format&fit=crop',
        duration: '10 min',
        rating: 4.9,
        completed: true,
        type: 'Interactive',
        color: 'from-blue-500 to-indigo-600'
    },
    {
        id: 3,
        title: 'Tailoring: Perfect Stitch',
        titleHi: 'सिलाई: परफेक्ट स्टिच',
        category: 'Tailoring',
        categoryHi: 'सिलाई',
        thumbnail: 'https://images.unsplash.com/photo-1555529771-835f59bfc50c?q=80&w=2000&auto=format&fit=crop',
        duration: '25 min',
        rating: 4.7,
        completed: false,
        type: 'Course',
        color: 'from-pink-500 to-rose-600'
    }
];

export default function TrainingHub() {
    const locale = useLocale();
    const isHindi = locale === 'hi';
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'video' | 'pdf'>('all');

    return (
        <main className="min-h-screen bg-[#f4f7f6] pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 text-white px-5 pt-6 pb-12 rounded-b-[40px] shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('/welcome_bg.png')] bg-cover bg-center"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative z-10 flex items-center mb-6">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="font-bold text-lg ml-3">{isHindi ? 'ट्रेनिंग सेंटर' : 'Training Center'}</h1>
                </div>

                <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-2">{isHindi ? 'नई स्किल्स सीखें' : 'Learn New Skills'}</h2>
                    <p className="text-blue-100 font-medium mb-6">
                        {isHindi ? 'मुफ्त ट्रेनिंग वीडियो देखें और अपनी कमाई बढ़ाएं' : 'Watch free training videos and increase your earnings'}
                    </p>

                    {/* Search */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-11 pr-4 py-4 bg-white border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-blue-500/30 text-sm font-medium shadow-lg"
                            placeholder={isHindi ? 'ट्रेनिंग खोजें...' : 'Search training...'}
                        />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-md mx-auto px-5 -mt-6 relative z-20">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 flex justify-between items-center">
                    <div className="text-center flex-1">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Award className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-2xl font-black text-gray-900">3</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">{isHindi ? 'सर्टिफिकेट' : 'Certificates'}</p>
                    </div>
                    <div className="w-px h-12 bg-gray-100"></div>
                    <div className="text-center flex-1">
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-2xl font-black text-gray-900">12</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">{isHindi ? 'पूरे किए गए कोर्स' : 'Completed'}</p>
                    </div>
                    <div className="w-px h-12 bg-gray-100"></div>
                    <div className="text-center flex-1">
                        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Star className="w-5 h-5 text-amber-600" />
                        </div>
                        <p className="text-2xl font-black text-gray-900">Level 2</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">{isHindi ? 'आपकी रैंक' : 'Your Rank'}</p>
                    </div>
                </div>
            </div>

            {/* Quick Access */}
            <div className="max-w-md mx-auto px-5 mt-6 mb-4">
                <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    <button onClick={() => setActiveTab('all')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500'}`}>{isHindi ? 'सभी' : 'All'}</button>
                    <button onClick={() => setActiveTab('video')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'video' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500'}`}>{isHindi ? 'वीडियो' : 'Videos'}</button>
                    <button onClick={() => setActiveTab('pdf')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'pdf' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500'}`}>{isHindi ? 'गाइड (PDF)' : 'Guides (PDF)'}</button>
                </div>
            </div>

            {/* Modules */}
            <div className="max-w-md mx-auto px-5 mt-4 space-y-4">
                {TRAINING_MODULES.map(mod => (
                    <div key={mod.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 relative overflow-hidden group">
                        <div className="w-24 h-24 rounded-xl overflow-hidden relative shrink-0">
                            <Image src={mod.thumbnail} alt={mod.title} fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                {mod.type === 'Video' || mod.type === 'Course' ? <PlayCircle className="w-8 h-8 text-white/90" /> : <FileText className="w-8 h-8 text-white/90" />}
                            </div>
                        </div>
                        <div className="flex-1 py-1">
                            <div className="flex justify-between items-start mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600`}>{isHindi ? mod.categoryHi : mod.category}</span>
                                {mod.completed && <CheckCircle className="w-4 h-4 text-green-500" />}
                            </div>
                            <h3 className="font-bold text-gray-900 leading-tight mb-1">{isHindi ? mod.titleHi : mod.title}</h3>
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {mod.duration}</span>
                                <span className="flex items-center gap-1 text-amber-500"><Star className="w-3.5 h-3.5 fill-current" /> {mod.rating}</span>
                            </div>
                            <div className="mt-3">
                                <button className={`w-full py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${mod.color} shadow-sm active:scale-95 transition-transform`}>
                                    {mod.completed ? (isHindi ? 'दोबारा देखें' : 'Watch Again') : (isHindi ? 'शुरू करें' : 'Start Learning')}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Audio Guides Section */}
            <div className="max-w-md mx-auto px-5 mt-6 mb-8">
                <h3 className="font-bold text-lg mb-3">{isHindi ? 'ऑडियो गाइड्स' : 'Audio Guides'}</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl mb-2 border border-blue-100 cursor-pointer active:scale-95 transition-transform">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                            <Volume2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-blue-900 text-sm">{isHindi ? 'प्लेटफॉर्म का उपयोग कैसे करें?' : 'How to use the platform?'}</p>
                            <p className="text-xs text-blue-700">2 mins • {isHindi ? 'हिंदी में' : 'In Hindi'}</p>
                        </div>
                        <PlayCircle className="w-6 h-6 text-blue-500 ml-auto" />
                    </div>
                    <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl cursor-pointer active:scale-95 transition-transform">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 shrink-0">
                            <Volume2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-sm">{isHindi ? 'पैसे कैसे निकालें?' : 'How to withdraw money?'}</p>
                            <p className="text-xs text-gray-500">3 mins • {isHindi ? 'हिंदी में' : 'In Hindi'}</p>
                        </div>
                        <PlayCircle className="w-6 h-6 text-gray-400 ml-auto" />
                    </div>
                </div>
            </div>
        </main>
    );
}
