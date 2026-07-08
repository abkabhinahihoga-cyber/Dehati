'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Plus, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { useLocale } from 'next-intl';

export default function AdminWorkManagement() {
    const locale = useLocale();
    const isHindi = locale === 'hi';
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'jobs' | 'applications'>('jobs');

    useEffect(() => {
        fetchData();
    }, [view]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (view === 'jobs') {
                const res = await axios.get('/api/admin/work');
                setJobs(res.data.data);
            } else {
                const res = await axios.get('/api/admin/work?action=applications');
                setApplications(res.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{isHindi ? 'काम प्रबंधन' : 'Work Management'}</h1>
                <div className="flex gap-2">
                    <button onClick={() => setView('jobs')} className={`px-4 py-2 rounded-lg font-bold ${view === 'jobs' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                        {isHindi ? 'काम सूची' : 'Job Listings'}
                    </button>
                    <button onClick={() => setView('applications')} className={`px-4 py-2 rounded-lg font-bold ${view === 'applications' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                        {isHindi ? 'आवेदन' : 'Applications'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-green-600 w-8 h-8" /></div>
            ) : view === 'jobs' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-bold text-gray-600">Title</th>
                                <th className="p-4 font-bold text-gray-600">Company</th>
                                <th className="p-4 font-bold text-gray-600">Payment</th>
                                <th className="p-4 font-bold text-gray-600">Status</th>
                                <th className="p-4 font-bold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job: any) => (
                                <tr key={job._id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-4 font-medium">{job.title}</td>
                                    <td className="p-4 text-gray-600">{job.companyName}</td>
                                    <td className="p-4 text-green-600 font-bold">₹{job.paymentPerPiece}/pc</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs ${job.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {job.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button className="text-blue-600 hover:bg-blue-50 p-2 rounded"><Edit2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-bold text-gray-600">Applicant</th>
                                <th className="p-4 font-bold text-gray-600">Job Title</th>
                                <th className="p-4 font-bold text-gray-600">Status</th>
                                <th className="p-4 font-bold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map((app: any) => (
                                <tr key={app._id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-4">
                                        <p className="font-bold">{app.fullName}</p>
                                        <p className="text-xs text-gray-500">{app.mobileNumber}</p>
                                    </td>
                                    <td className="p-4">{app.workOpportunityId?.title}</td>
                                    <td className="p-4 font-bold text-orange-600">{app.status}</td>
                                    <td className="p-4 flex gap-2">
                                        <button className="text-green-600 hover:bg-green-50 p-2 rounded" title="Approve"><CheckCircle2 className="w-5 h-5" /></button>
                                        <button className="text-red-600 hover:bg-red-50 p-2 rounded" title="Reject"><XCircle className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
