'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { ArrowLeft, Calendar, Info, Clock, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

const SEASONAL_CALENDAR = [
    {
        month: 'Jan - Feb', monthHi: 'जनवरी - फरवरी',
        items: [
            { title: 'Kites (Makar Sankranti)', titleHi: 'पतंग बनाना (मकर संक्रांति)', demand: 'High', color: 'bg-blue-100 text-blue-700' },
            { title: 'Wedding Products', titleHi: 'शादी का सामान', demand: 'Very High', color: 'bg-red-100 text-red-700' },
            { title: 'Agarbatti', titleHi: 'अगरबत्ती', demand: 'Steady', color: 'bg-green-100 text-green-700' }
        ]
    },
    {
        month: 'Mar - Apr', monthHi: 'मार्च - अप्रैल',
        items: [
            { title: 'Holi Colors & Water Guns', titleHi: 'होली के रंग और पिचकारी', demand: 'Very High', color: 'bg-fuchsia-100 text-fuchsia-700' },
            { title: 'Papad & Pickles', titleHi: 'पापड़ और अचार', demand: 'High', color: 'bg-orange-100 text-orange-700' },
            { title: 'Cotton Wicks', titleHi: 'रुई की बत्ती', demand: 'Steady', color: 'bg-green-100 text-green-700' }
        ]
    },
    {
        month: 'May - Jun', monthHi: 'मई - जून',
        items: [
            { title: 'Paper Bags', titleHi: 'कागज के थैले', demand: 'High', color: 'bg-yellow-100 text-yellow-700' },
            { title: 'Seed Balls', titleHi: 'सीड बॉल (बीज)', demand: 'High', color: 'bg-emerald-100 text-emerald-700' }
        ]
    },
    {
        month: 'Jul - Aug', monthHi: 'जुलाई - अगस्त',
        items: [
            { title: 'Rakhi Making', titleHi: 'राखी बनाना', demand: 'Very High', color: 'bg-red-100 text-red-700' },
            { title: 'Teej/Sawan Items', titleHi: 'तीज/सावन सामग्री', demand: 'High', color: 'bg-green-100 text-green-700' },
            { title: 'Umbrella Repair Kits', titleHi: 'छाता रिपेयर किट', demand: 'Medium', color: 'bg-blue-100 text-blue-700' }
        ]
    },
    {
        month: 'Sep - Oct', monthHi: 'सितंबर - अक्टूबर',
        items: [
            { title: 'Ganesh Festival Decor', titleHi: 'गणेश उत्सव सजावट', demand: 'Very High', color: 'bg-amber-100 text-amber-700' },
            { title: 'Dussehra Products', titleHi: 'दशहरा सामग्री', demand: 'High', color: 'bg-orange-100 text-orange-700' },
            { title: 'Navratri Puja Kits', titleHi: 'नवरात्रि पूजा किट', demand: 'High', color: 'bg-rose-100 text-rose-700' }
        ]
    },
    {
        month: 'Nov - Dec', monthHi: 'नवंबर - दिसंबर',
        items: [
            { title: 'Diwali Diyas & Decor', titleHi: 'दीवाली दीये और सजावट', demand: 'Very High', color: 'bg-orange-100 text-orange-700' },
            { title: 'Candle Making', titleHi: 'मोमबत्ती बनाना', demand: 'High', color: 'bg-yellow-100 text-yellow-700' },
            { title: 'Winter Clothes Stitching', titleHi: 'गर्म कपड़ों की सिलाई', demand: 'High', color: 'bg-cyan-100 text-cyan-700' }
        ]
    }
];

export default function SeasonalCalendar() {
    const locale = useLocale();
    const isHindi = locale === 'hi';
    const router = useRouter();

    return (
        <main className="min-h-screen bg-[#f4f7f6] pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white px-5 pt-6 pb-12 rounded-b-[40px] shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('/welcome_bg.png')] bg-cover bg-center"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/30 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative z-10 flex items-center mb-6">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="font-bold text-lg ml-3">{isHindi ? 'मौसमी कैलेंडर' : 'Seasonal Calendar'}</h1>
                </div>

                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 mb-4 shadow-lg">
                        <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-black mb-2 leading-tight">{isHindi ? 'पूरे साल की योजना बनाएं' : 'Plan Your Year'}</h2>
                    <p className="text-amber-100 font-medium text-sm">
                        {isHindi ? 'त्योहारों और मौसम के अनुसार काम की मांग। समय से पहले तैयारी करें और ज्यादा कमाएं!' : 'Work demand based on festivals and seasons. Prepare early and earn more!'}
                    </p>
                </div>
            </div>

            {/* Info Card */}
            <div className="max-w-md mx-auto px-5 -mt-6 relative z-20 mb-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                        <Info className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm mb-1">{isHindi ? 'प्रो टिप' : 'Pro Tip'}</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            {isHindi ? 'त्योहार से 1-2 महीने पहले काम शुरू हो जाता है। उदाहरण के लिए, राखी का काम जून में शुरू हो जाता है।' : 'Work starts 1-2 months before the festival. For example, Rakhi making starts in June.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Calendar Timeline */}
            <div className="max-w-md mx-auto px-5">
                <div className="space-y-6">
                    {SEASONAL_CALENDAR.map((period, idx) => (
                        <div key={idx} className="relative">
                            {/* Vertical line connecting blocks */}
                            {idx !== SEASONAL_CALENDAR.length - 1 && (
                                <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-gray-200"></div>
                            )}
                            
                            <div className="flex gap-4">
                                {/* Dot indicator */}
                                <div className="w-10 h-10 rounded-full bg-white border-4 border-orange-100 shadow-sm flex items-center justify-center shrink-0 relative z-10 mt-1 text-orange-500">
                                    <Clock className="w-4 h-4" />
                                </div>
                                
                                {/* Content Card */}
                                <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <h3 className="font-black text-lg text-gray-900 mb-3">{isHindi ? period.monthHi : period.month}</h3>
                                    
                                    <div className="space-y-3">
                                        {period.items.map((item, itemIdx) => (
                                            <div key={itemIdx} className="flex justify-between items-start">
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                    <span className="text-sm font-bold text-gray-700 leading-snug">{isHindi ? item.titleHi : item.title}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ml-2 ${item.color}`}>
                                                    {isHindi && item.demand === 'Very High' ? 'बहुत ज्यादा' : 
                                                     isHindi && item.demand === 'High' ? 'ज्यादा' : 
                                                     isHindi && item.demand === 'Steady' ? 'लगातार' : 
                                                     isHindi && item.demand === 'Medium' ? 'मध्यम' : item.demand}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Bottom CTA */}
            <div className="max-w-md mx-auto px-5 mt-8 mb-6">
                <button onClick={() => router.push(`/${locale}/work`)} className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_rgba(249,115,22,0.3)] hover:bg-orange-600 active:scale-95 transition-all">
                    {isHindi ? 'अभी उपलब्ध काम देखें' : 'View Available Work Now'}
                </button>
            </div>
        </main>
    );
}
