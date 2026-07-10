import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BadgeCheck, MapPin, IndianRupee, Clock, ChevronRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function JobCard({ job }: { job: any }) {
    const locale = useLocale();
    const isHindi = locale === 'hi';

    return (
        <Link href={`/${locale}/work/${job._id}`}>
            <motion.div 
                whileHover={{ y: -4 }}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col h-full"
            >
                {/* Image Section */}
                <div className="relative h-48 w-full bg-gray-50 p-4">
                    {job.productImages && job.productImages.length > 0 ? (
                        <Image 
                            src={job.productImages[0]} 
                            alt={job.title} 
                            fill 
                            className="object-contain p-2 mix-blend-multiply" 
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
                            <span className="text-gray-400">No Image</span>
                        </div>
                    )}
                    
                    {job.isVerified && (
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm pl-1 pr-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-green-100">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                            <span className="text-[10px] font-black text-green-800 tracking-wide uppercase">
                                {isHindi ? 'वेरीफाइड' : 'Verified'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-3">
                        <p className="text-xs font-bold text-green-600 mb-1">{job.category}</p>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">
                            {isHindi && job.titleHindi ? job.titleHindi : job.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                            {job.companyName}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold flex items-center gap-1 border border-gray-100">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.workType === 'Home Based' ? (isHindi ? 'घर बैठे काम' : 'Home Based') : job.workType}
                        </span>
                        <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-semibold border border-orange-100">
                            {job.difficulty === 'Easy' ? (isHindi ? 'आसान' : 'Easy') : job.difficulty}
                        </span>
                        {job.trainingAvailable && (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">
                                {isHindi ? 'ट्रेनिंग उपलब्ध' : 'Training Available'}
                            </span>
                        )}
                    </div>

                    {/* Earnings */}
                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">
                                {isHindi ? 'कमाई' : 'Earnings'}
                            </p>
                            <div className="flex items-center gap-1 text-green-700">
                                <IndianRupee className="w-4 h-4" strokeWidth={3} />
                                <span className="font-black text-xl">{job.paymentPerPiece}</span>
                                <span className="text-xs font-bold mt-1 text-green-600/70">/ {job.paymentUnit || (isHindi ? 'पीस' : 'piece')}</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
