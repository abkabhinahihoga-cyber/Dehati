'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, ArrowLeft, ShieldAlert, CheckCircle, ExternalLink, X, MessageSquareWarning } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AdminReportsPage() {
    const locale = useLocale();
    const isHindi = locale === 'hi';
    const router = useRouter();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/work/report');
            if (res.data.success) {
                setReports(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error(isHindi ? 'रिपोर्ट लोड करने में विफल' : 'Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const res = await axios.patch('/api/work/report', { id, status });
            if (res.data.success) {
                toast.success(isHindi ? 'स्थिति अपडेट की गई' : 'Status updated');
                if (selectedReport && selectedReport._id === id) {
                    setSelectedReport({ ...selectedReport, status });
                }
                fetchReports();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error(isHindi ? 'अपडेट विफल' : 'Update failed');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending': return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg uppercase">Pending</span>;
            case 'Reviewed': return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg uppercase">Reviewed</span>;
            case 'Resolved': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg uppercase">Resolved</span>;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            <main className="flex-1 p-4 md:p-8">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.push(`/${locale}/admin/dashboard`)} className="p-2 bg-white rounded-xl shadow-sm hover:bg-gray-50">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <ShieldAlert className="text-red-500 w-6 h-6" /> 
                            {isHindi ? 'ट्रस्ट और सुरक्षा रिपोर्ट' : 'Trust & Safety Reports'}
                        </h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">
                            {isHindi ? 'उपयोगकर्ताओं द्वारा सबमिट की गई रिपोर्ट प्रबंधित करें' : 'Manage reports submitted by users regarding fake jobs or frauds'}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-bold text-gray-600 text-sm">Date</th>
                                    <th className="p-4 font-bold text-gray-600 text-sm">Reported By</th>
                                    <th className="p-4 font-bold text-gray-600 text-sm">Job/Opportunity</th>
                                    <th className="p-4 font-bold text-gray-600 text-sm">Reason</th>
                                    <th className="p-4 font-bold text-gray-600 text-sm">Status</th>
                                    <th className="p-4 font-bold text-gray-600 text-sm text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-medium">No reports found</td></tr>
                                ) : reports.map((r: any) => (
                                    <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm text-gray-600">{new Date(r.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <p className="font-bold text-gray-900 text-sm">{r.userId?.name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{r.userId?.mobile}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-gray-900 text-sm">{r.workOpportunityId?.title}</p>
                                            <p className="text-xs text-gray-500">{r.workOpportunityId?.companyName}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-bold text-red-600 text-sm flex items-center gap-1">
                                                <MessageSquareWarning className="w-3 h-3" />
                                                {r.reason}
                                            </span>
                                        </td>
                                        <td className="p-4">{getStatusBadge(r.status)}</td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => setSelectedReport(r)}
                                                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-red-500" />
                                Report Details
                            </h2>
                            <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Reason</p>
                                <p className="font-black text-red-600 text-lg">{selectedReport.reason}</p>
                            </div>
                            
                            {selectedReport.details && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Additional Details</p>
                                    <p className="text-gray-700 text-sm">{selectedReport.details}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-xs font-bold text-blue-400 uppercase mb-1">Reported By</p>
                                    <p className="font-bold text-blue-900 text-sm">{selectedReport.userId?.name}</p>
                                    <p className="text-xs text-blue-700">{selectedReport.userId?.mobile}</p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                    <p className="text-xs font-bold text-orange-400 uppercase mb-1">Target Job</p>
                                    <p className="font-bold text-orange-900 text-sm">{selectedReport.workOpportunityId?.title}</p>
                                    <p className="text-xs text-orange-700">{selectedReport.workOpportunityId?.companyName}</p>
                                    <a href={`/${locale}/work/${selectedReport.workOpportunityId?._id}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-orange-600 mt-2 inline-flex items-center gap-1 hover:underline">
                                        View Job <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Update Status</p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleUpdateStatus(selectedReport._id, 'Pending')}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${selectedReport.status === 'Pending' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >Pending</button>
                                    <button 
                                        onClick={() => handleUpdateStatus(selectedReport._id, 'Reviewed')}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${selectedReport.status === 'Reviewed' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >Reviewed</button>
                                    <button 
                                        onClick={() => handleUpdateStatus(selectedReport._id, 'Resolved')}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1 ${selectedReport.status === 'Resolved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    ><CheckCircle className="w-3 h-3" /> Resolved</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
