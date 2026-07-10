'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Plus, CheckCircle2, XCircle, Trash2, X, ImagePlus, Eye, ChevronRight, Users, Briefcase, DollarSign, FileText } from 'lucide-react';
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

export default function AdminWorkManagement() {
    const locale = useLocale();
    const isHindi = locale === 'hi';
    const [jobs, setJobs] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'jobs' | 'applications'>('jobs');
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: '', titleHindi: '', companyName: '', category: 'Tailoring', 
        description: '', paymentPerPiece: '', paymentUnit: 'piece', estimatedDailyIncome: '', 
        minimumQuantity: '', difficulty: 'Easy', timePerPiece: '', trainingVideoUrl: '',
        skillLevel: 'Beginner', workType: 'Home Based', rawMaterialProvided: false, trainingAvailable: false,
        isVerified: true, trustScore: '80', availablePositions: '', whoCanApply: '',
        qualityGuidelines: '', pickupProcess: '', nearestPickupCenter: '',
        requiredSkills: '', requiredTools: '', stepByStepProcess: '', commonMistakes: ''
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

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

    const handleCreateJob = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            // Simple string fields
            const simpleFields = ['title', 'titleHindi', 'companyName', 'category', 'description', 
                'paymentPerPiece', 'paymentUnit', 'estimatedDailyIncome', 'minimumQuantity', 'difficulty', 
                'timePerPiece', 'trainingVideoUrl', 'skillLevel', 'workType', 'trustScore', 
                'availablePositions', 'whoCanApply', 'qualityGuidelines', 'pickupProcess', 'nearestPickupCenter'];
            simpleFields.forEach(key => {
                data.append(key, (formData as any)[key]);
            });
            data.append('rawMaterialProvided', String(formData.rawMaterialProvided));
            data.append('trainingAvailable', String(formData.trainingAvailable));
            data.append('isVerified', String(formData.isVerified));
            // Comma-separated fields
            if (formData.requiredSkills) data.append('requiredSkills', formData.requiredSkills);
            if (formData.requiredTools) data.append('requiredTools', formData.requiredTools);
            if (formData.stepByStepProcess) data.append('stepByStepProcess', formData.stepByStepProcess);
            if (formData.commonMistakes) data.append('commonMistakes', formData.commonMistakes);
            
            if (selectedImage) {
                data.append('image', selectedImage);
            }

            const res = await axios.post('/api/admin/work', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (res.data.success) {
                toast.success(isHindi ? 'काम सफलतापूर्वक बनाया!' : 'Job created successfully!');
                setShowModal(false);
                setFormData({
                    title: '', titleHindi: '', companyName: '', category: 'Tailoring', 
                    description: '', paymentPerPiece: '', paymentUnit: 'piece', estimatedDailyIncome: '', 
                    minimumQuantity: '', difficulty: 'Easy', timePerPiece: '', trainingVideoUrl: '',
                    skillLevel: 'Beginner', workType: 'Home Based', rawMaterialProvided: false, trainingAvailable: false,
                    isVerified: true, trustScore: '80', availablePositions: '', whoCanApply: '',
                    qualityGuidelines: '', pickupProcess: '', nearestPickupCenter: '',
                    requiredSkills: '', requiredTools: '', stepByStepProcess: '', commonMistakes: ''
                });
                setSelectedImage(null);
                fetchData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create job');
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

    const pendingCount = applications.filter((a: any) => a.status === 'Pending').length;

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
                        <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-lg font-bold bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700 transition-all">
                            <Plus size={18} /> {isHindi ? 'नया काम जोड़ें' : 'Add Job'}
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-green-600 w-8 h-8" /></div>
            ) : view === 'jobs' ? (
                /* --- JOB LISTINGS TABLE --- */
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-bold text-gray-600 text-sm">Title</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Company</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Category</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Payment</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Status</th>
                                <th className="p-4 font-bold text-gray-600 text-sm text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job: any) => (
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
                                    <td className="p-4 text-sm"><span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium text-xs">{job.category}</span></td>
                                    <td className="p-4 text-green-600 font-bold">₹{job.paymentPerPiece}/{job.paymentUnit || 'pc'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${job.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {job.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex gap-2 justify-end">
                                        <button onClick={() => handleDeleteJob(job._id)} className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                            {jobs.length === 0 && (
                                <tr><td colSpan={6} className="p-10 text-center text-gray-500">{isHindi ? 'कोई काम नहीं मिला। नया जोड़ें!' : 'No jobs found. Add a new one!'}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* --- APPLICATIONS TABLE --- */
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
                            {applications.map((app: any) => (
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
                            {applications.length === 0 && (
                                <tr><td colSpan={6} className="p-10 text-center text-gray-500">{isHindi ? 'कोई आवेदन नहीं' : 'No applications yet'}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Application Detail Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">{isHindi ? 'आवेदन विवरण' : 'Application Details'}</h2>
                            <button onClick={() => setShowDetailModal(null)} className="text-gray-400 hover:text-gray-600"><X /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-gray-500 font-medium">Name</p><p className="font-bold">{showDetailModal.fullName}</p></div>
                                <div><p className="text-xs text-gray-500 font-medium">Mobile</p><p className="font-bold">{showDetailModal.mobileNumber}</p></div>
                                <div><p className="text-xs text-gray-500 font-medium">Age</p><p className="font-bold">{showDetailModal.age}</p></div>
                                <div><p className="text-xs text-gray-500 font-medium">Occupation</p><p className="font-bold">{showDetailModal.occupation || 'N/A'}</p></div>
                                <div><p className="text-xs text-gray-500 font-medium">Village</p><p className="font-bold">{showDetailModal.village}</p></div>
                                <div><p className="text-xs text-gray-500 font-medium">District</p><p className="font-bold">{showDetailModal.district}</p></div>
                                <div><p className="text-xs text-gray-500 font-medium">State</p><p className="font-bold">{showDetailModal.state}</p></div>
                                <div><p className="text-xs text-gray-500 font-medium">Hours/Day</p><p className="font-bold">{showDetailModal.workingHoursPerDay} hrs</p></div>
                            </div>
                            
                            {showDetailModal.aadhaarUrl && (
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs text-gray-500 font-medium mb-2">Aadhaar Card Photo</p>
                                    <div className="relative w-full h-48 bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                                        <Image src={showDetailModal.aadhaarUrl} alt="Aadhaar" fill className="object-contain p-2" />
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-xs text-gray-500 font-medium mb-2">Update Status</p>
                                <select 
                                    value={showDetailModal.status}
                                    onChange={e => {
                                        handleApplicationAction(showDetailModal._id, e.target.value);
                                        setShowDetailModal({...showDetailModal, status: e.target.value});
                                    }}
                                    className="w-full p-3 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-green-500"
                                >
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Job Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">{isHindi ? 'नया काम जोड़ें' : 'Add New Job'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
                        </div>
                        <form onSubmit={handleCreateJob} className="p-6 space-y-4">
                            
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Job Image</label>
                                <input type="file" accept="image/*" className="w-full p-2 border border-gray-200 rounded-xl" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Title (English) *</label>
                                    <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Agarbatti Making" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Title (Hindi) *</label>
                                    <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.titleHindi} onChange={e => setFormData({...formData, titleHindi: e.target.value})} placeholder="e.g. अगरबत्ती बनाना" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Company Name *</label>
                                    <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                        {ALL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Payment (₹) *</label>
                                        <input required type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.paymentPerPiece} onChange={e => setFormData({...formData, paymentPerPiece: e.target.value})} />
                                    </div>
                                    <div className="w-1/3">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Unit</label>
                                        <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.paymentUnit} onChange={e => setFormData({...formData, paymentUnit: e.target.value})}>
                                            <option value="piece">Piece</option><option value="kg">Kg</option><option value="box">Box</option><option value="dozen">Dozen</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Est. Daily Income (₹)</label>
                                    <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.estimatedDailyIncome} onChange={e => setFormData({...formData, estimatedDailyIncome: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Difficulty</label>
                                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                                        <option>Easy</option><option>Medium</option><option>Hard</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Skill Level</label>
                                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.skillLevel} onChange={e => setFormData({...formData, skillLevel: e.target.value})}>
                                        <option>Beginner</option><option>Intermediate</option><option>Expert</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Work Type</label>
                                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.workType} onChange={e => setFormData({...formData, workType: e.target.value})}>
                                        <option>Home Based</option><option>Field Work</option><option>Factory</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Trust Score (0-100)</label>
                                    <input type="number" min="0" max="100" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.trustScore} onChange={e => setFormData({...formData, trustScore: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Available Positions</label>
                                    <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.availablePositions} onChange={e => setFormData({...formData, availablePositions: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Time Per Unit</label>
                                    <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.timePerPiece} onChange={e => setFormData({...formData, timePerPiece: e.target.value})} placeholder="e.g. 5 mins" />
                                </div>
                            </div>
                            
                            {/* Checkboxes */}
                            <div className="flex flex-wrap gap-4 py-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.rawMaterialProvided} onChange={e => setFormData({...formData, rawMaterialProvided: e.target.checked})} className="w-4 h-4 accent-green-600" />
                                    <span className="text-sm font-medium text-gray-700">Raw Material Provided</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.trainingAvailable} onChange={e => setFormData({...formData, trainingAvailable: e.target.checked})} className="w-4 h-4 accent-green-600" />
                                    <span className="text-sm font-medium text-gray-700">Training Available</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.isVerified} onChange={e => setFormData({...formData, isVerified: e.target.checked})} className="w-4 h-4 accent-green-600" />
                                    <span className="text-sm font-medium text-gray-700">Verified</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Training Video URL</label>
                                <input type="url" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.trainingVideoUrl} onChange={e => setFormData({...formData, trainingVideoUrl: e.target.value})} placeholder="https://youtube.com/..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Who Can Apply</label>
                                <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.whoCanApply} onChange={e => setFormData({...formData, whoCanApply: e.target.value})} placeholder="e.g. Women, Students, Senior Citizens" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description *</label>
                                <textarea required rows={3} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Step-by-Step Process (one per line)</label>
                                <textarea rows={3} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 resize-none" value={formData.stepByStepProcess} onChange={e => setFormData({...formData, stepByStepProcess: e.target.value})} placeholder="Step 1&#10;Step 2&#10;Step 3"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Quality Guidelines</label>
                                <textarea rows={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 resize-none" value={formData.qualityGuidelines} onChange={e => setFormData({...formData, qualityGuidelines: e.target.value})}></textarea>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Required Skills (comma separated)</label>
                                    <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.requiredSkills} onChange={e => setFormData({...formData, requiredSkills: e.target.value})} placeholder="e.g. Stitching, Cutting" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Required Tools (comma separated)</label>
                                    <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.requiredTools} onChange={e => setFormData({...formData, requiredTools: e.target.value})} placeholder="e.g. Scissors, Thread" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Pickup Process</label>
                                    <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.pickupProcess} onChange={e => setFormData({...formData, pickupProcess: e.target.value})} placeholder="Describe pickup/delivery process" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nearest Pickup Center</label>
                                    <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500" value={formData.nearestPickupCenter} onChange={e => setFormData({...formData, nearestPickupCenter: e.target.value})} placeholder="e.g. Dehati Hub Varanasi" />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-3 font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">Publish Job</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
