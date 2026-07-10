'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { BellRing, Send, Users, UserSquare, ShieldAlert, Image as ImageIcon, Link as LinkIcon, Smartphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function PushNotificationsAdminPage() {
    const locale = useLocale();
    const router = useRouter();
    const isHi = locale === 'hi';

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        image: '',
        url: `/${locale}`,
        audience: 'everyone', // everyone, individual, worker, farmer, seller
        targetUserId: ''
    });

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title || !formData.body) {
            toast.error(isHi ? 'शीर्षक और संदेश अनिवार्य हैं' : 'Title and Body are required');
            return;
        }

        if (formData.audience === 'individual' && !formData.targetUserId) {
            toast.error(isHi ? 'उपयोगकर्ता आईडी दर्ज करें' : 'User ID is required for Individual audience');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('/api/admin/notifications/send', formData);
            if (res.data.success) {
                toast.success(res.data.message);
                setFormData({
                    title: '',
                    body: '',
                    image: '',
                    url: `/${locale}`,
                    audience: 'everyone',
                    targetUserId: ''
                });
            } else {
                toast.error(res.data.message || 'Failed to send notification');
            }
        } catch (error: any) {
            console.error('Send error:', error);
            toast.error(error.response?.data?.error || 'Server error');
        }
        setLoading(false);
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-3">
                        <BellRing className="w-8 h-8 text-green-600" />
                        {isHi ? 'पुश नोटिफिकेशन्स' : 'Push Notifications'}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {isHi ? 'उपयोगकर्ताओं को सीधे उनके फ़ोन पर संदेश भेजें।' : 'Broadcast messages directly to users\' devices outside the app.'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <form onSubmit={handleSend} className="space-y-6">
                        
                        {/* Target Audience */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                {isHi ? 'किसे भेजें? (Target Audience)' : 'Target Audience'}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.audience === 'everyone' ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <input type="radio" name="audience" value="everyone" checked={formData.audience === 'everyone'} onChange={e => setFormData({...formData, audience: e.target.value})} className="hidden" />
                                    <Users className="w-5 h-5" /> {isHi ? 'सभी लोग' : 'Everyone'}
                                </label>
                                <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.audience === 'worker' ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <input type="radio" name="audience" value="worker" checked={formData.audience === 'worker'} onChange={e => setFormData({...formData, audience: e.target.value})} className="hidden" />
                                    <UserSquare className="w-5 h-5" /> {isHi ? 'श्रमिक' : 'Workers'}
                                </label>
                                <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.audience === 'farmer' ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <input type="radio" name="audience" value="farmer" checked={formData.audience === 'farmer'} onChange={e => setFormData({...formData, audience: e.target.value})} className="hidden" />
                                    <UserSquare className="w-5 h-5" /> {isHi ? 'किसान' : 'Farmers'}
                                </label>
                                <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.audience === 'individual' ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <input type="radio" name="audience" value="individual" checked={formData.audience === 'individual'} onChange={e => setFormData({...formData, audience: e.target.value})} className="hidden" />
                                    <ShieldAlert className="w-5 h-5" /> {isHi ? 'व्यक्तिगत' : 'Individual'}
                                </label>
                            </div>

                            {formData.audience === 'individual' && (
                                <div className="mt-3">
                                    <input 
                                        type="text" 
                                        placeholder={isHi ? 'उपयोगकर्ता आईडी (User ID) दर्ज करें' : 'Enter User ID'} 
                                        value={formData.targetUserId} 
                                        onChange={e => setFormData({...formData, targetUserId: e.target.value})}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                {isHi ? 'शीर्षक (Title)' : 'Notification Title'}
                            </label>
                            <input 
                                type="text" 
                                required
                                maxLength={50}
                                placeholder="e.g. New Job Available! Earn ₹500 today."
                                value={formData.title} 
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-900"
                            />
                        </div>

                        {/* Body */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                {isHi ? 'संदेश (Message Body)' : 'Message Body'}
                            </label>
                            <textarea 
                                required
                                rows={3}
                                maxLength={150}
                                placeholder="Details about the notification..."
                                value={formData.body} 
                                onChange={e => setFormData({...formData, body: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 resize-none"
                            />
                        </div>

                        {/* Optional Fields */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <ImageIcon className="w-4 h-4 text-blue-500" />
                                    {isHi ? 'इमेज यूआरएल (Optional Image URL)' : 'Banner Image URL (Optional)'}
                                </label>
                                <input 
                                    type="url" 
                                    placeholder="https://example.com/banner.jpg"
                                    value={formData.image} 
                                    onChange={e => setFormData({...formData, image: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <LinkIcon className="w-4 h-4 text-purple-500" />
                                    {isHi ? 'लिंक (Click Action URL)' : 'Target Link (Where clicking takes them)'}
                                </label>
                                <input 
                                    type="text" 
                                    placeholder={`/${locale}/work`}
                                    value={formData.url} 
                                    onChange={e => setFormData({...formData, url: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading || !formData.title || !formData.body || (formData.audience === 'individual' && !formData.targetUserId)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            {isHi ? 'नोटिफिकेशन भेजें' : 'Send Push Notification'}
                        </button>
                    </form>
                </div>

                {/* Preview Section */}
                <div>
                    <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        {isHi ? 'मोबाइल प्रीव्यू' : 'Mobile Device Preview'}
                    </h3>

                    <div className="bg-gray-100 rounded-[3rem] p-4 w-full max-w-[320px] mx-auto border-[8px] border-gray-800 h-[600px] relative shadow-2xl overflow-hidden flex flex-col">
                        {/* Status bar mock */}
                        <div className="flex justify-between items-center px-4 pt-1 pb-4">
                            <span className="text-[10px] font-medium">9:41</span>
                            <div className="flex gap-1 items-center">
                                <div className="w-3 h-3 bg-black rounded-full" />
                                <div className="w-3 h-3 bg-black rounded-full" />
                            </div>
                        </div>

                        {/* Wallpaper */}
                        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ background: 'linear-gradient(45deg, #f3f4f6, #e5e7eb)' }} />

                        {/* Notification Mock */}
                        {(formData.title || formData.body) && (
                            <div className="relative z-10 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden animate-slide-up mx-2 mt-4">
                                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100/50">
                                    <img src="/icon.png" className="w-4 h-4 rounded" alt="App Icon" />
                                    <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Dehati Sathi</span>
                                    <span className="text-[10px] text-gray-400 ml-auto">now</span>
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1">{formData.title || 'Notification Title'}</h4>
                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{formData.body || 'This is how the body text will appear to the user.'}</p>
                                </div>
                                {formData.image && (
                                    <div className="w-full h-32 bg-gray-100 relative">
                                        <img src={formData.image} alt="Notification Banner" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
