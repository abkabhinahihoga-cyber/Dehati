'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import axios from 'axios';
import { Loader2, Search, Briefcase, ChevronRight, ShieldCheck, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import JobCard from '@/components/work/JobCard';
import Nav from '@/components/Nav';

export default function WorkMarketplace() {
    const locale = useLocale();
    const isHindi = locale === 'hi';
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [user, setUser] = useState<any>(null);

    const categories = [
        'All', 'Agarbatti', 'Mala Making', 'Rakhi Making', 'Packaging', 'Tailoring'
    ];

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

    const filteredJobs = jobs.filter((j: any) => {
        const query = search.toLowerCase();
        return j.title.toLowerCase().includes(query) || (j.titleHindi && j.titleHindi.toLowerCase().includes(query)) || j.companyName.toLowerCase().includes(query);
    });

    return (
        <main className="min-h-screen bg-[#f4f7f6] pb-24">
            {user && <Nav user={user} />}
            
            {/* HERO SECTION */}
            <div className="bg-green-700 text-white px-5 pt-8 pb-12 rounded-b-[40px] shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('/welcome_bg.png')] bg-cover bg-center"></div>
                <div className="relative z-10 max-w-md mx-auto">
                    <div className="inline-flex items-center gap-1.5 bg-green-800/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-green-600">
                        <ShieldCheck className="w-4 h-4 text-green-300" />
                        {isHindi ? '100% वेरीफाइड काम' : '100% Verified Work'}
                    </div>
                    
                    <h1 className="text-3xl font-black mb-2 leading-tight">
                        {isHindi ? 'घर बैठे काम करें, अपने गाँव से कमाएँ' : 'Work from Home, Earn from your Village'}
                    </h1>
                    <p className="text-green-50 text-sm font-medium opacity-90 mb-6">
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

            {/* CATEGORIES SCROLL */}
            <div className="max-w-md mx-auto px-5 mt-6 mb-2">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-green-600" />
                        {isHindi ? 'श्रेणियां (Categories)' : 'Categories'}
                    </h2>
                </div>
                <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-5 px-5">
                    {categories.map((cat, i) => (
                        <button
                            key={i}
                            onClick={() => setCategory(cat)}
                            className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                                category === cat 
                                    ? 'bg-green-600 text-white shadow-green-200' 
                                    : 'bg-white text-gray-600 border border-gray-100 hover:border-green-300 hover:bg-green-50'
                            }`}
                        >
                            {cat === 'All' ? (isHindi ? 'सभी' : 'All') : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* JOB LISTINGS */}
            <div className="max-w-md mx-auto px-5 mt-4">
                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    {isHindi ? 'नए काम के अवसर' : 'Latest Opportunities'}
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
                        <p className="text-sm text-gray-500">{isHindi ? 'कृपया दूसरी श्रेणी चुनें' : 'Please select another category'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredJobs.map((job: any) => (
                            <JobCard key={job._id} job={job} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
