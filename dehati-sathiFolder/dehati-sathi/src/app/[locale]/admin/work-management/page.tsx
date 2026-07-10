'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Plus, CheckCircle2, XCircle, Trash2, X, ImagePlus, Eye, ChevronRight, Users, Briefcase, DollarSign, FileText, Edit, PlusCircle, MinusCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import Image from 'next/image';

const ALL_CATEGORIES = [
    'Mala Making', 'Rakhi Making', 'Artificial Jewellery', 'Agarbatti', 'Puja Material',
    'Candle Making', 'Packaging', 'Paper Bag Making', 'Tailoring', 'Food Processing',
    'Handicrafts', 'Bamboo Products', 'Seed Ball Making', 'Seasonal Products', 'Other Home-Based Work'
];

const STATUS_OPTIONS = [
    'Pending', 'Approved', 'Rejected', 'Material Assigned', 'Work Started', 'Submitted', 'Quality Check', 'Payment Released'
];

const initialFormData = {
    _id: '',
    title: '', titleHindi: '', companyName: '', category: 'Tailoring', 
    description: '', paymentPerPiece: '', paymentUnit: 'piece', estimatedDailyIncome: '', estimatedMonthlyIncome: '',
    minimumQuantity: '1', difficulty: 'Easy', timePerPiece: '', trainingVideoUrl: '',
    skillLevel: 'Beginner', workType: 'Home Based', rawMaterialProvided: false, trainingAvailable: false,
    isVerified: true, trustScore: '80', availablePositions: '', whoCanApply: '',
    qualityGuidelines: '', pickupProcess: '', nearestPickupCenter: '',
    requiredSkills: '', requiredTools: '', stepByStepProcess: '', commonMistakes: '',
    womenFriendly: false, studentFriendly: false, seniorCitizenFriendly: false, noExperienceRequired: false,
    isSeasonal: false, seasonMonths: '', workAvailability: 'High Demand',
    assignedHub: '', adminContactPhone: '', adminContactWhatsApp: '',
    faqs: [] as {question: string, answer: string}[]
};

export default function AdminWorkManagement() {
    const locale = useLocale();
    const isHindi = locale === 'hi';
    const [jobs, setJobs] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [hubs, setHubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'jobs' | 'applications'>('jobs');
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState<any>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    useEffect(() => {
        fetchData();
        fetchHubs();
    }, [view]);

    const fetchHubs = async () => {
        try {
            const res = await axios.get('/api/hub/all');
            if (res.data.success) setHubs(res.data.hubs || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (view === 'jobs') {
                const res = await axios.get('/api/admin/work');
                setJobs(res.data.data || []);
            } else {
                const res = await axios.get('/api/admin/work?action=applications');
                setApplications(res.data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateJob = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            if (formData._id) data.append('_id', formData._id);
            
            // Simple string fields
            const simpleFields = ['title', 'titleHindi', 'companyName', 'category', 'description', 
                'paymentPerPiece', 'paymentUnit', 'estimatedDailyIncome', 'estimatedMonthlyIncome', 'minimumQuantity', 'difficulty', 
                'timePerPiece', 'trainingVideoUrl', 'skillLevel', 'workType', 'trustScore', 
                'availablePositions', 'whoCanApply', 'qualityGuidelines', 'pickupProcess', 'nearestPickupCenter',
                'assignedHub', 'adminContactPhone', 'adminContactWhatsApp', 'workAvailability'];
            simpleFields.forEach(key => {
                if ((formData as any)[key] !== undefined && (formData as any)[key] !== null) {
                    data.append(key, (formData as any)[key]);
                }
            });
            
            data.append('rawMaterialProvided', String(formData.rawMaterialProvided));
            data.append('trainingAvailable', String(formData.trainingAvailable));
            data.append('isVerified', String(formData.isVerified));
            data.append('womenFriendly', String(formData.womenFriendly));
            data.append('studentFriendly', String(formData.studentFriendly));
            data.append('seniorCitizenFriendly', String(formData.seniorCitizenFriendly));
            data.append('noExperienceRequired', String(formData.noExperienceRequired));
            data.append('isSeasonal', String(formData.isSeasonal));

            // Comma-separated fields
            if (formData.requiredSkills) data.append('requiredSkills', formData.requiredSkills);
            if (formData.requiredTools) data.append('requiredTools', formData.requiredTools);
            if (formData.stepByStepProcess) data.append('stepByStepProcess', formData.stepByStepProcess);
            if (formData.commonMistakes) data.append('commonMistakes', formData.commonMistakes);
            if (formData.seasonMonths) data.append('seasonMonths', formData.seasonMonths);
            
            data.append('faqs', JSON.stringify(formData.faqs));

            if (selectedImage) {
                data.append('image', selectedImage);
            }

            const res = await axios.post('/api/admin/work', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (res.data.success) {
                toast.success(isHindi ? 'काम सफलतापूर्वक सहेजा गया!' : 'Job saved successfully!');
                setShowModal(false);
                setFormData(initialFormData);
                setSelectedImage(null);
                fetchData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save job');
        }
    };

    const handleDeleteJob = async (id: string) => {
        if (!confirm('Are you sure you want to delete this job?')) return;
        try {
            const res = await axios.delete(`/api/admin/work?id=${id}`);
            if (res.data.success) {
                toast.success('Job deleted');
                fetchData();
            }
        } catch (error: any) {
            toast.error('Failed to delete job');
        }
    };

    const handleEditJob = (job: any) => {
        setFormData({
            ...initialFormData,
            ...job,
            requiredSkills: job.requiredSkills?.join(', ') || '',
            requiredTools: job.requiredTools?.join(', ') || '',
            stepByStepProcess: job.stepByStepProcess?.join('\n') || '',
            commonMistakes: job.commonMistakes?.join('\n') || '',
            seasonMonths: job.seasonMonths?.join(', ') || '',
            assignedHub: job.assignedHub?._id || job.assignedHub || '',
            faqs: job.faqs || []
        });
        setShowModal(true);
    };

    const handleApplicationAction = async (id: string, status: string) => {
        try {
            const res = await axios.patch('/api/admin/work/application', { id, status });
            if (res.data.success) {
                toast.success(`Application status updated to: ${status}`);
                fetchData();
            }
        } catch (error: any) {
            toast.error(`Failed to update application`);
        }
    };

    const pendingCount = (applications || []).filter((a: any) => a.status === 'Pending').length;

    const addFaq = () => setFormData({...formData, faqs: [...formData.faqs, {question: '', answer: ''}]});
    const updateFaq = (index: number, field: 'question'|'answer', value: string) => {
        const newFaqs = [...formData.faqs];
        newFaqs[index][field] = value;
        setFormData({...formData, faqs: newFaqs});
    };
    const removeFaq = (index: number) => {
        setFormData({...formData, faqs: formData.faqs.filter((_, i) => i !== index)});
    };

    return (
        <div className="p-4 md:p-6 w-full max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{isHindi ? 'काम प्रबंधन' : 'Work & Earn Management'}</h1>
                    <p className="text-sm text-gray-500 mt-1">{isHindi ? 'काम जोड़ें, आवेदन प्रबंधित करें' : 'Add jobs, manage applications'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setView('jobs')} className={`px-4 py-2 rounded-lg font-bold transition-all ${view === 'jobs' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        <Briefcase className="w-4 h-4 inline mr-1.5" />
                        {isHindi ? 'काम सूची' : 'Job Listings'}
                    </button>
                    <button onClick={() => setView('applications')} className={`px-4 py-2 rounded-lg font-bold transition-all relative ${view === 'applications' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        <Users className="w-4 h-4 inline mr-1.5" />
                        {isHindi ? 'आवेदन' : 'Applications'}
                        {pendingCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold">{pendingCount}</span>}
                    </button>
                    {view === 'jobs' && (
                        <button onClick={() => { setFormData(initialFormData); setSelectedImage(null); setShowModal(true); }} className="px-4 py-2 rounded-lg font-bold bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700 transition-all">
                            <Plus size={18} /> {isHindi ? 'नया काम जोड़ें' : 'Add Job'}
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-green-600 w-8 h-8" /></div>
            ) : view === 'jobs' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-bold text-gray-600 text-sm">Title</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Company</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Hub</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Payment</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Status</th>
                                <th className="p-4 font-bold text-gray-600 text-sm text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(jobs || []).map((job: any) => (
                                <tr key={job._id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-4 font-medium flex items-center gap-3">
                                        {job.productImages?.[0] ? (
                                            <img src={job.productImages[0]} alt="" className="w-10 h-10 rounded-md object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400"><ImagePlus size={16} /></div>
                                        )}
                                        <div>
                                            <p className="font-bold text-gray-900">{job.title}</p>
                                            <p className="text-xs text-gray-500">{job.titleHindi}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600 text-sm">{job.companyName}</td>
                                    <td className="p-4 text-sm"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium text-xs">{job.assignedHub?.name || 'Unassigned'}</span></td>
                                    <td className="p-4 text-green-600 font-bold">₹{job.paymentPerPiece}/{job.paymentUnit || 'pc'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${job.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {job.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex gap-2 justify-end">
                                        <button onClick={() => handleEditJob(job)} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteJob(job._id)} className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                            {(!jobs || jobs.length === 0) && (
                                <tr><td colSpan={6} className="p-10 text-center text-gray-500">{isHindi ? 'कोई काम नहीं मिला। नया जोड़ें!' : 'No jobs found. Add a new one!'}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-bold text-gray-600 text-sm">Applicant</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Job Title</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Location</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Status</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Aadhaar</th>
                                <th className="p-4 font-bold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(applications || []).map((app: any) => (
                                <tr key={app._id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900">{app.fullName}</p>
                                        <p className="text-xs text-gray-500">{app.mobileNumber} • Age: {app.age}</p>
                                    </td>
                                    <td className="p-4 text-sm font-medium">{app.workOpportunityId?.title || 'N/A'}</td>
                                    <td className="p-4 text-sm text-gray-600">{app.village}, {app.district}, {app.state}</td>
                                    <td className="p-4">
                                        <select 
                                            value={app.status} 
                                            onChange={(e) => handleApplicationAction(app._id, e.target.value)}
                                            className={`text-xs font-bold py-1.5 px-2 rounded-lg border outline-none cursor-pointer ${
                                                app.status === 'Pending' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                                app.status === 'Approved' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                                app.status === 'Rejected' ? 'bg-red-50 border-red-200 text-red-700' :
                                                app.status === 'Payment Released' ? 'bg-green-50 border-green-200 text-green-700' :
                                                'bg-gray-50 border-gray-200 text-gray-700'
                                            }`}
                                        >
                                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-4">
                                        {app.aadhaarUrl ? (
                                            <button onClick={() => setShowDetailModal(app)} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors flex items-center gap-1 text-xs font-bold" title="View Aadhaar">
                                                <Eye className="w-4 h-4" /> View
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Not uploaded</span>
                                        )}
                                    </td>
                                    <td className="p-4 flex gap-1 justify-end">
                                        {app.status === 'Pending' && (
                                            <>
                                                <button onClick={() => handleApplicationAction(app._id, 'Approved')} className="text-green-600 hover:bg-green-50 p-2 rounded transition-colors" title="Approve"><CheckCircle2 className="w-5 h-5" /></button>
                                                <button onClick={() => handleApplicationAction(app._id, 'Rejected')} className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors" title="Reject"><XCircle className="w-5 h-5" /></button>
                                            </>
                                        )}
                                        <button onClick={() => setShowDetailModal(app)} className="text-gray-600 hover:bg-gray-50 p-2 rounded transition-colors" title="Details"><Eye className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Application Detail Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">Application Details</h2>
                            <button onClick={() => setShowDetailModal(null)} className="text-gray-400 hover:text-gray-600"><X /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-gray-500 font-medium">Name</p><p className="font-bold">{showDetailModal.fullName}</p></div>
                                <div><p className="text-xs text-gray-500 font-medium">Mobile</p><p className="font-bold">{showDetailModal.mobileNumber}</p></div>
                                <div><p className="text-xs text-gray-500 font-medium">Age</p><p className="font-bold">{showDetailModal.age}</p></div>
                                <div><p className="text-xs text-gray-500 font-medium">Village</p><p className="font-bold">{showDetailModal.village}</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Job Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">{formData._id ? 'Edit Job' : 'Add New Job'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
                        </div>
                        <form onSubmit={handleCreateJob} className="p-6 space-y-6">
                            
                            {/* Section 1: Basic Info */}
                            <div>
                                <h3 className="font-bold text-lg border-b pb-2 mb-4">1. Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Job Image (Leave empty to keep existing)</label>
                                        <input type="file" accept="image/*" className="w-full p-2 border border-gray-200 rounded-xl" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Title (English) *</label>
                                        <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Title (Hindi) *</label>
                                        <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.titleHindi} onChange={e => setFormData({...formData, titleHindi: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Company / Org Name *</label>
                                        <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                                        <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                            {ALL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Description *</label>
                                        <textarea required rows={3} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Assignment & Filters */}
                            <div>
                                <h3 className="font-bold text-lg border-b pb-2 mb-4">2. Assignment & Filters</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Assign to Hub</label>
                                        <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.assignedHub} onChange={e => setFormData({...formData, assignedHub: e.target.value})}>
                                            <option value="">No Hub (Global)</option>
                                            {hubs.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Admin Phone</label>
                                            <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.adminContactPhone} onChange={e => setFormData({...formData, adminContactPhone: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Admin WhatsApp</label>
                                            <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.adminContactWhatsApp} onChange={e => setFormData({...formData, adminContactWhatsApp: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={formData.womenFriendly} onChange={e => setFormData({...formData, womenFriendly: e.target.checked})} className="w-4 h-4 accent-green-600" /> Women Friendly</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={formData.studentFriendly} onChange={e => setFormData({...formData, studentFriendly: e.target.checked})} className="w-4 h-4 accent-green-600" /> Student Friendly</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={formData.seniorCitizenFriendly} onChange={e => setFormData({...formData, seniorCitizenFriendly: e.target.checked})} className="w-4 h-4 accent-green-600" /> Senior Citizen Friendly</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={formData.noExperienceRequired} onChange={e => setFormData({...formData, noExperienceRequired: e.target.checked})} className="w-4 h-4 accent-green-600" /> No Exp. Required</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isSeasonal} onChange={e => setFormData({...formData, isSeasonal: e.target.checked})} className="w-4 h-4 accent-green-600" /> Is Seasonal</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isVerified} onChange={e => setFormData({...formData, isVerified: e.target.checked})} className="w-4 h-4 accent-green-600" /> Verified</label>
                                </div>
                            </div>

                            {/* Section 3: Payment & Logistics */}
                            <div>
                                <h3 className="font-bold text-lg border-b pb-2 mb-4">3. Payment & Structure</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Pay (₹) *</label>
                                        <input required type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.paymentPerPiece} onChange={e => setFormData({...formData, paymentPerPiece: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Unit</label>
                                        <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.paymentUnit} onChange={e => setFormData({...formData, paymentUnit: e.target.value})}>
                                            <option value="piece">Piece</option><option value="kg">Kg</option><option value="box">Box</option><option value="dozen">Dozen</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Min. Quantity</label>
                                        <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.minimumQuantity} onChange={e => setFormData({...formData, minimumQuantity: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Est. Daily Income (₹)</label>
                                        <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.estimatedDailyIncome} onChange={e => setFormData({...formData, estimatedDailyIncome: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Est. Monthly Income (₹)</label>
                                        <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.estimatedMonthlyIncome} onChange={e => setFormData({...formData, estimatedMonthlyIncome: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Work Availability</label>
                                        <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.workAvailability} onChange={e => setFormData({...formData, workAvailability: e.target.value})}>
                                            <option>High Demand</option><option>Limited</option><option>Full</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Details */}
                            <div>
                                <h3 className="font-bold text-lg border-b pb-2 mb-4">4. Additional Details & Process</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Required Skills</label><input className="w-full p-3 bg-gray-50 border rounded-xl" value={formData.requiredSkills} onChange={e => setFormData({...formData, requiredSkills: e.target.value})} placeholder="Comma separated" /></div>
                                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Required Tools</label><input className="w-full p-3 bg-gray-50 border rounded-xl" value={formData.requiredTools} onChange={e => setFormData({...formData, requiredTools: e.target.value})} placeholder="Comma separated" /></div>
                                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Step-by-Step Process</label><textarea rows={3} className="w-full p-3 bg-gray-50 border rounded-xl" value={formData.stepByStepProcess} onChange={e => setFormData({...formData, stepByStepProcess: e.target.value})} placeholder="One step per line"></textarea></div>
                                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Common Mistakes</label><textarea rows={3} className="w-full p-3 bg-gray-50 border rounded-xl" value={formData.commonMistakes} onChange={e => setFormData({...formData, commonMistakes: e.target.value})} placeholder="One per line"></textarea></div>
                                </div>
                            </div>

                            {/* FAQs Builder */}
                            <div>
                                <div className="flex justify-between items-center border-b pb-2 mb-4">
                                    <h3 className="font-bold text-lg">5. FAQs</h3>
                                    <button type="button" onClick={addFaq} className="text-sm bg-gray-100 px-3 py-1 rounded font-bold flex items-center gap-1 hover:bg-gray-200"><PlusCircle className="w-4 h-4"/> Add FAQ</button>
                                </div>
                                <div className="space-y-3">
                                    {formData.faqs.map((faq, i) => (
                                        <div key={i} className="flex gap-2 items-start">
                                            <div className="flex-1 space-y-2">
                                                <input placeholder="Question" className="w-full p-2 text-sm border rounded bg-gray-50" value={faq.question} onChange={e => updateFaq(i, 'question', e.target.value)} />
                                                <input placeholder="Answer" className="w-full p-2 text-sm border rounded bg-gray-50" value={faq.answer} onChange={e => updateFaq(i, 'answer', e.target.value)} />
                                            </div>
                                            <button type="button" onClick={() => removeFaq(i)} className="p-2 text-red-500 hover:bg-red-50 rounded mt-1"><MinusCircle className="w-5 h-5"/></button>
                                        </div>
                                    ))}
                                    {formData.faqs.length === 0 && <p className="text-sm text-gray-500">No FAQs added.</p>}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-3 font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">Save Job</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
