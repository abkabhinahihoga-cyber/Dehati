'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import axios from 'axios';
import { Loader2, Search, Briefcase, ShieldCheck, Filter, ChevronRight, Calendar, Star, Home, Users, GraduationCap, Sparkles, Package, Flower2, Heart, Scissors, UtensilsCrossed, Gem, TreePine, Leaf, Gift, MoreHorizontal, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JobCard from '@/components/work/JobCard';
import Nav from '@/components/Nav';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ALL_CATEGORIES = [
    { name: 'All', nameHi: 'सभी', icon: Sparkles, color: 'bg-green-100 text-green-700' },
    { name: 'Mala Making', nameHi: 'माला बनाना', icon: Flower2, color: 'bg-pink-100 text-pink-700' },
    { name: 'Rakhi Making', nameHi: 'राखी बनाना', icon: Heart, color: 'bg-red-100 text-red-700' },
    { name: 'Artificial Jewellery', nameHi: 'आर्टिफिशियल ज्वेलरी', icon: Gem, color: 'bg-purple-100 text-purple-700' },
    { name: 'Agarbatti', nameHi: 'अगरबत्ती', icon: Leaf, color: 'bg-amber-100 text-amber-700' },
    { name: 'Puja Material', nameHi: 'पूजा सामग्री', icon: Star, color: 'bg-yellow-100 text-yellow-700' },
    { name: 'Candle Making', nameHi: 'मोमबत्ती बनाना', icon: Sparkles, color: 'bg-orange-100 text-orange-700' },
    { name: 'Packaging', nameHi: 'पैकेजिंग', icon: Package, color: 'bg-blue-100 text-blue-700' },
    { name: 'Paper Bag Making', nameHi: 'पेपर बैग बनाना', icon: Package, color: 'bg-teal-100 text-teal-700' },
    { name: 'Tailoring', nameHi: 'सिलाई', icon: Scissors, color: 'bg-indigo-100 text-indigo-700' },
    { name: 'Food Processing', nameHi: 'खाद्य प्रसंस्करण', icon: UtensilsCrossed, color: 'bg-lime-100 text-lime-700' },
    { name: 'Handicrafts', nameHi: 'हस्तशिल्प', icon: Gem, color: 'bg-rose-100 text-rose-700' },
    { name: 'Bamboo Products', nameHi: 'बांस उत्पाद', icon: TreePine, color: 'bg-emerald-100 text-emerald-700' },
    { name: 'Seed Ball Making', nameHi: 'सीड बॉल बनाना', icon: Leaf, color: 'bg-green-100 text-green-700' },
    { name: 'Seasonal Products', nameHi: 'मौसमी उत्पाद', icon: Gift, color: 'bg-cyan-100 text-cyan-700' },
    { name: 'Other Home-Based Work', nameHi: 'अन्य घरेलू काम', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700' },
];

const QUICK_FILTERS = [
    { key: 'homeBased', label: 'Work From Home', labelHi: 'घर बैठे काम', icon: Home },
    { key: 'womenFriendly', label: 'Women Friendly', labelHi: 'महिलाओं के लिए', icon: Users },
    { key: 'studentFriendly', label: 'Student Friendly', labelHi: 'छात्रों के लिए', icon: GraduationCap },
    { key: 'noExperience', label: 'No Experience', labelHi: 'बिना अनुभव', icon: Sparkles },
    { key: 'trainingAvailable', label: 'Training Available', labelHi: 'ट्रेनिंग उपलब्ध', icon: Star },
    { key: 'rawMaterial', label: 'Raw Material Provided', labelHi: 'कच्चा माल मिलेगा', icon: Package },
    { key: 'verified', label: 'Verified Only', labelHi: 'केवल वेरीफाइड', icon: ShieldCheck },
];

const SEASONAL_CALENDAR = [
    { month: 'Jan', monthHi: 'जनवरी', work: 'Kites', workHi: 'पतंग', emoji: '🪁' },
    { month: 'Feb', monthHi: 'फरवरी', work: 'Wedding Products', workHi: 'शादी सामग्री', emoji: '💍' },
    { month: 'Mar', monthHi: 'मार्च', work: 'Holi Products', workHi: 'होली उत्पाद', emoji: '🎨' },
    { month: 'Jul', monthHi: 'जुलाई', work: 'Rakhi', workHi: 'राखी', emoji: '🧶' },
    { month: 'Sep', monthHi: 'सितंबर', work: 'Ganesh Festival', workHi: 'गणेश उत्सव', emoji: '🐘' },
    { month: 'Oct', monthHi: 'अक्टूबर', work: 'Diwali Products', workHi: 'दीवाली उत्पाद', emoji: '🪔' },
    { month: 'Dec', monthHi: 'दिसंबर', work: 'Christmas Decor', workHi: 'क्रिसमस सजावट', emoji: '🎄' },
];

export default function WorkMarketplace() {
    const locale = useLocale();
    const router = useRouter();
    const isHindi = locale === 'hi';
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [user, setUser] = useState<any>(null);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [showSeasonalCalendar, setShowSeasonalCalendar] = useState(false);

    useEffect(() => {
        axios.get('/api/me').then(res => { if (res.data?.user) setUser(res.data.user); }).catch(() => {});
    }, []);

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                const url = category === 'All' ? '/api/work' : `/api/work?category=${encodeURIComponent(category)}`;
                const res = await axios.get(url);
                if (res.data.success) {
                    setJobs(res.data.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, [category]);

    const toggleFilter = (key: string) => {
        setActiveFilters(prev => prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]);
    };

    const filteredJobs = useMemo(() => {
        let result = jobs.filter((j: any) => {
            const query = search.toLowerCase();
            return j.title.toLowerCase().includes(query) || (j.titleHindi && j.titleHindi.toLowerCase().includes(query)) || j.companyName.toLowerCase().includes(query);
        });

        // Apply quick filters
        if (activeFilters.includes('homeBased')) result = result.filter((j: any) => j.workType === 'Home Based');
        if (activeFilters.includes('trainingAvailable')) result = result.filter((j: any) => j.trainingAvailable);
        if (activeFilters.includes('rawMaterial')) result = result.filter((j: any) => j.rawMaterialProvided);
        if (activeFilters.includes('verified')) result = result.filter((j: any) => j.isVerified);
        if (activeFilters.includes('noExperience')) result = result.filter((j: any) => j.skillLevel === 'Beginner');

        return result;
    }, [jobs, search, activeFilters]);

    return (
        <main className="min-h-screen bg-[#f4f7f6] pb-24">
            {user && <Nav user={user} />}
            
            {/* HERO SECTION */}
            <div className="bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 text-white px-5 pt-8 pb-14 rounded-b-[40px] shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('/welcome_bg.png')] bg-cover bg-center"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
                
                <div className="relative z-10 max-w-md mx-auto">
                    <div className="inline-flex items-center gap-1.5 bg-green-900/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-green-600/40">
                        <ShieldCheck className="w-4 h-4 text-green-300" />
                        {isHindi ? '100% वेरीफाइड काम' : '100% Verified Work'}
                    </div>
                    
                    <h1 className="text-3xl font-black mb-1 leading-tight">
                        Work & Earn
                    </h1>
                    <p className="text-green-100 text-lg font-semibold mb-1">
                        {isHindi ? 'घर बैठे काम करें, अपने गाँव से कमाएँ' : 'Work from Home, Earn from your Village'}
                    </p>
                    <p className="text-green-200/80 text-sm font-medium mb-6">
                        {isHindi ? 'बिना किसी इन्वेस्टमेंट के असली और सुरक्षित काम खोजें।' : 'Find genuine and secure work without any investment.'}
                    </p>

                    {/* SEARCH BAR */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-11 pr-4 py-4 bg-white border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-green-500/30 text-base font-medium shadow-xl"
                            placeholder={isHindi ? 'काम या कंपनी खोजें...' : 'Search work or company...'}
                        />
                    </div>
                </div>
            </div>

            {/* QUICK FILTERS */}
            <div className="max-w-md mx-auto px-5 -mt-6 relative z-20">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <Filter className="w-4 h-4 text-green-600" />
                            {isHindi ? 'फिल्टर' : 'Quick Filters'}
                        </h3>
                        {activeFilters.length > 0 && (
                            <button onClick={() => setActiveFilters([])} className="text-xs text-red-500 font-bold">
                                {isHindi ? 'सभी हटाएं' : 'Clear All'}
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_FILTERS.map((f) => {
                            const Icon = f.icon;
                            const active = activeFilters.includes(f.key);
                            return (
                                <button
                                    key={f.key}
                                    onClick={() => toggleFilter(f.key)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                        active
                                            ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                            : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-green-300'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {isHindi ? f.labelHi : f.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* CATEGORIES SCROLL */}
            <div className="max-w-md mx-auto px-5 mt-6 mb-2">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-green-600" />
                        {isHindi ? 'श्रेणियां' : 'Categories'}
                    </h2>
                </div>
                <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-5 px-5">
                    {ALL_CATEGORIES.map((cat, i) => {
                        const Icon = cat.icon;
                        return (
                            <button
                                key={i}
                                onClick={() => setCategory(cat.name)}
                                className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 ${
                                    category === cat.name 
                                        ? 'bg-green-600 text-white shadow-green-200' 
                                        : `${cat.color} border border-gray-100 hover:shadow-md`
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {isHindi ? cat.nameHi : cat.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* SEASONAL WORK CALENDAR */}
            <div className="max-w-md mx-auto px-5 mt-4 mb-4">
                <button
                    onClick={() => setShowSeasonalCalendar(!showSeasonalCalendar)}
                    className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-amber-700" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-amber-900 text-sm">{isHindi ? 'मौसमी काम कैलेंडर' : 'Seasonal Work Calendar'}</h3>
                            <p className="text-xs text-amber-700">{isHindi ? 'पूरे साल काम की योजना बनाएं' : 'Plan your work throughout the year'}</p>
                        </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-amber-600 transition-transform ${showSeasonalCalendar ? 'rotate-90' : ''}`} />
                </button>
                
                <AnimatePresence>
                    {showSeasonalCalendar && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-2 gap-2 mt-3">
                                {SEASONAL_CALENDAR.map((s, i) => (
                                    <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3 shadow-sm">
                                        <span className="text-2xl">{s.emoji}</span>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">{isHindi ? s.monthHi : s.month}</p>
                                            <p className="font-bold text-gray-800 text-sm">{isHindi ? s.workHi : s.work}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => router.push(`/${locale}/work/calendar`)}
                                className="w-full mt-3 bg-amber-500 text-white font-bold py-3 rounded-xl shadow-sm hover:bg-amber-600 transition-colors text-sm flex items-center justify-center gap-2"
                            >
                                {isHindi ? 'पूरा कैलेंडर देखें' : 'View Full Calendar'}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* TRAINING CENTER BANNER */}
            <div className="max-w-md mx-auto px-5 mb-4">
                <button
                    onClick={() => router.push(`/${locale}/work/training`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group text-left"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 shrink-0">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-lg mb-1 leading-tight">{isHindi ? 'ट्रेनिंग सेंटर' : 'Training Center'}</h3>
                            <p className="text-blue-100 text-xs font-medium">{isHindi ? 'मुफ्त वीडियो देखें और काम सीखें' : 'Watch free videos and learn work'}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
                    </div>
                </button>
            </div>

            {/* JOB LISTINGS */}
            <div className="max-w-md mx-auto px-5 mt-4">
                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    {isHindi ? 'नए काम के अवसर' : 'Latest Opportunities'}
                    {filteredJobs.length > 0 && (
                        <span className="text-xs text-gray-400 font-normal ml-auto">{filteredJobs.length} {isHindi ? 'काम' : 'jobs'}</span>
                    )}
                </h2>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                        <p className="text-gray-500 font-medium">{isHindi ? 'काम खोजा जा रहा है...' : 'Finding work...'}</p>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Briefcase className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">{isHindi ? 'कोई काम नहीं मिला' : 'No work found'}</h3>
                        <p className="text-sm text-gray-500">{isHindi ? 'कृपया दूसरी श्रेणी या फिल्टर चुनें' : 'Try a different category or filter'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredJobs.map((job: any) => (
                            <JobCard key={job._id} job={job} />
                        ))}
                    </div>
                )}
            </div>

            {/* Trust Banner */}
            <div className="max-w-md mx-auto px-5 mt-8">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                            <ShieldCheck className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-900 mb-1">{isHindi ? '⚠️ कभी पैसे न दें!' : '⚠️ Never Pay for Jobs!'}</h3>
                            <p className="text-sm text-red-700 leading-relaxed">
                                {isHindi 
                                    ? 'कोई भी असली कंपनी काम देने के लिए पैसे नहीं मांगती। अगर कोई पैसे मांगे, तो तुरंत रिपोर्ट करें।' 
                                    : 'No genuine company asks for money to provide work. If anyone asks for payment, report immediately.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
