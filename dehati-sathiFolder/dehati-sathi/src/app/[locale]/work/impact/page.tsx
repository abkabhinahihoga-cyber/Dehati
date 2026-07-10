'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { ArrowLeft, Users, Briefcase, TrendingUp, HeartHandshake, ShieldCheck, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const STATS = [
    { label: 'Families Supported', labelHi: 'सहायता प्राप्त परिवार', value: '1,200+', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Active Jobs', labelHi: 'सक्रिय काम', value: '150+', icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Total Earnings', labelHi: 'कुल कमाई (₹)', value: '₹50L+', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Verified Partners', labelHi: 'वेरीफाइड पार्टनर्स', value: '45', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-100' },
];

const TESTIMONIALS = [
    {
        name: 'Sita Devi',
        village: 'Rampur, UP',
        text: 'Started agarbatti making 3 months ago. Now I earn ₹4,000 every month sitting at home.',
        textHi: '3 महीने पहले अगरबत्ती बनाना शुरू किया। अब घर बैठे हर महीने ₹4,000 कमाती हूँ।',
        image: 'https://images.unsplash.com/photo-1589315570072-56450209e9f6?q=80&w=2000&auto=format&fit=crop',
    },
    {
        name: 'Ramesh Singh',
        village: 'Varanasi, UP',
        text: 'Got a tailoring contract through Dehati Saathi. Very safe and payments are always on time.',
        textHi: 'देहाती साथी के जरिए सिलाई का काम मिला। बहुत सुरक्षित है और पैसे हमेशा समय पर मिलते हैं।',
        image: 'https://images.unsplash.com/photo-1623838274716-e55d648fcba0?q=80&w=2000&auto=format&fit=crop',
    }
];

export default function ImpactDashboard() {
    const locale = useLocale();
    const isHindi = locale === 'hi';
    const router = useRouter();

    return (
        <main className="min-h-screen bg-[#f4f7f6] pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 text-white px-5 pt-6 pb-16 rounded-b-[40px] shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('/welcome_bg.png')] bg-cover bg-center"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative z-10 flex items-center mb-6">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="font-bold text-lg ml-3">{isHindi ? 'हमारा प्रभाव' : 'Our Impact'}</h1>
                </div>

                <div className="relative z-10 text-center">
                    <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 mb-4 shadow-lg">
                        <HeartHandshake className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-4xl font-black mb-2 leading-tight">{isHindi ? 'गांवों का विकास' : 'Empowering Villages'}</h2>
                    <p className="text-green-100 font-medium">
                        {isHindi ? 'देहाती साथी के माध्यम से घर बैठे रोजगार' : 'Bringing employment to doorsteps through Dehati Saathi'}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="max-w-md mx-auto px-5 -mt-10 relative z-20">
                <div className="grid grid-cols-2 gap-4">
                    {STATS.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <div key={idx} className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 text-center hover:-translate-y-1 transition-transform">
                                <div className={`w-12 h-12 ${stat.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-1">{stat.value}</h3>
                                <p className="text-xs font-bold text-gray-500 uppercase">{isHindi ? stat.labelHi : stat.label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Testimonials */}
            <div className="max-w-md mx-auto px-5 mt-10">
                <h3 className="font-bold text-xl text-gray-900 mb-4 text-center">{isHindi ? 'सफलता की कहानियाँ' : 'Success Stories'}</h3>
                <div className="space-y-4">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                            <div className="flex gap-1 mb-3">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                            </div>
                            <p className="text-gray-700 italic font-medium leading-relaxed mb-4">"{isHindi ? t.textHi : t.text}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden relative">
                                    <Image src={t.image} alt={t.name} fill className="object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{t.name}</h4>
                                    <p className="text-xs text-gray-500">{t.village}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="max-w-md mx-auto px-5 mt-8 mb-6">
                <button onClick={() => router.push(`/${locale}/work`)} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 active:scale-95 transition-all">
                    {isHindi ? 'आज ही काम शुरू करें' : 'Start Working Today'}
                </button>
            </div>
        </main>
    );
}
