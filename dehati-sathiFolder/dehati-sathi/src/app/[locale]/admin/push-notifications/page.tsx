'use client';

import React, { useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import { BellRing, Send, Users, UserSquare, ShieldAlert, Image as ImageIcon, Link as LinkIcon, Smartphone, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function PushNotificationsAdminPage() {
    const locale = useLocale();
    const isHi = locale === 'hi';
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        image: '',
        url: `/${locale}`,
        audience: 'everyone',
        targetUserId: ''
    });

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show local preview immediately
        const localUrl = URL.createObjectURL(file);
        setImagePreview(localUrl);
        setImageUploading(true);

        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await axios.post('/api/admin/notifications/upload-image', fd);
            if (res.data.success) {
                setFormData(prev => ({ ...prev, image: res.data.url }));
                toast.success(isHi ? 'इमेज अपलोड हो गई!' : 'Image uploaded!');
            }
        } catch {
            toast.error(isHi ? 'इमेज अपलोड विफल' : 'Image upload failed');
            setImagePreview('');
            setFormData(prev => ({ ...prev, image: '' }));
        }
        setImageUploading(false);
    };

    const handleRemoveImage = () => {
        setImagePreview('');
        setFormData(prev => ({ ...prev, image: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

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
        if (imageUploading) {
            toast.error(isHi ? 'इमेज अपलोड होने की प्रतीक्षा करें' : 'Please wait for image to finish uploading');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('/api/admin/notifications/send', formData);
            if (res.data.success) {
                toast.success(res.data.message);
                setFormData({ title: '', body: '', image: '', url: `/${locale}`, audience: 'everyone', targetUserId: '' });
                setImagePreview('');
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                toast.error(res.data.message || 'Failed to send');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Server error');
        }
        setLoading(false);
    };

    const audienceOptions = [
        { value: 'everyone', label: isHi ? 'सभी लोग' : 'Everyone', icon: <Users className="w-5 h-5" /> },
        { value: 'worker', label: isHi ? 'श्रमिक' : 'Workers', icon: <UserSquare className="w-5 h-5" /> },
        { value: 'farmer', label: isHi ? 'किसान' : 'Farmers', icon: <UserSquare className="w-5 h-5" /> },
        { value: 'individual', label: isHi ? 'व्यक्तिगत' : 'Individual', icon: <ShieldAlert className="w-5 h-5" /> },
    ];

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-purple-100 rounded-2xl">
                    <BellRing className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900">
                        {isHi ? 'पुश नोटिफिकेशन्स' : 'Push Notifications'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        {isHi ? 'उपयोगकर्ताओं को सीधे उनके फ़ोन पर संदेश भेजें।' : 'Broadcast messages directly to users\' devices outside the app.'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                    <form onSubmit={handleSend} className="space-y-6">

                        {/* Audience */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                {isHi ? '📣 किसे भेजें?' : '📣 Target Audience'}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {audienceOptions.map(opt => (
                                    <label key={opt.value} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.audience === opt.value ? 'border-green-500 bg-green-50 text-green-700 font-bold' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                                        <input type="radio" name="audience" value={opt.value} checked={formData.audience === opt.value} onChange={e => setFormData({ ...formData, audience: e.target.value })} className="hidden" />
                                        {opt.icon}
                                        <span className="text-sm">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                            {formData.audience === 'individual' && (
                                <input
                                    type="text"
                                    placeholder={isHi ? 'User ID दर्ज करें' : 'Enter User ID'}
                                    value={formData.targetUserId}
                                    onChange={e => setFormData({ ...formData, targetUserId: e.target.value })}
                                    className="mt-3 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                />
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                {isHi ? '✏️ शीर्षक' : '✏️ Notification Title'}
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={50}
                                placeholder={isHi ? 'जैसे: नया काम उपलब्ध! आज ₹500 कमाएं।' : 'e.g. New Job Available! Earn ₹500 today.'}
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-900"
                            />
                            <p className="text-xs text-gray-400 mt-1 text-right">{formData.title.length}/50</p>
                        </div>

                        {/* Body */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                {isHi ? '💬 संदेश' : '💬 Message Body'}
                            </label>
                            <textarea
                                required
                                rows={3}
                                maxLength={150}
                                placeholder={isHi ? 'संदेश का विवरण...' : 'Details about the notification...'}
                                value={formData.body}
                                onChange={e => setFormData({ ...formData, body: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 resize-none"
                            />
                            <p className="text-xs text-gray-400 mt-1 text-right">{formData.body.length}/150</p>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                🖼️ {isHi ? 'बैनर इमेज / GIF (वैकल्पिक)' : 'Banner Image / GIF (Optional)'}
                            </label>

                            {imagePreview ? (
                                <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                                    <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover" />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    {imageUploading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-green-400 hover:text-green-500 hover:bg-green-50/50 transition-all"
                                >
                                    <Upload className="w-8 h-8" />
                                    <span className="font-semibold text-sm">
                                        {isHi ? 'गैलरी से इमेज/GIF चुनें' : 'Select Image / GIF from Gallery'}
                                    </span>
                                    <span className="text-xs text-gray-300">PNG, JPG, GIF, WEBP</span>
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </div>

                        {/* Link */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                <LinkIcon className="w-4 h-4 text-purple-500" />
                                {isHi ? 'क्लिक पर जाएं (वैकल्पिक)' : 'Target Link on Click (Optional)'}
                            </label>
                            <input
                                type="text"
                                placeholder={`/${locale}/work`}
                                value={formData.url}
                                onChange={e => setFormData({ ...formData, url: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || imageUploading || !formData.title || !formData.body || (formData.audience === 'individual' && !formData.targetUserId)}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            {isHi ? 'नोटिफिकेशन भेजें' : 'Send Push Notification'}
                        </button>
                    </form>
                </div>

                {/* Live Preview */}
                <div>
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm">
                        <Smartphone className="w-4 h-4" />
                        {isHi ? 'लाइव मोबाइल प्रीव्यू' : 'Live Mobile Preview'}
                    </h3>

                    <div className="relative bg-gray-900 rounded-[3rem] p-3 w-[280px] mx-auto border-[6px] border-gray-800 shadow-2xl overflow-hidden" style={{ height: '580px' }}>
                        {/* Phone notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-2xl z-10" />

                        {/* Screen */}
                        <div className="h-full w-full bg-gray-100 rounded-[2.5rem] overflow-hidden relative">
                            {/* Status bar */}
                            <div className="flex justify-between px-5 pt-6 pb-2 bg-gray-100">
                                <span className="text-[10px] font-bold text-gray-700">9:41</span>
                                <div className="flex gap-1 items-center">
                                    <div className="w-2.5 h-2.5 bg-gray-700 rounded-full" />
                                    <div className="w-2.5 h-2.5 bg-gray-700 rounded-full" />
                                </div>
                            </div>

                            {/* Notification card */}
                            {(formData.title || formData.body) && (
                                <div className="mx-2 mt-1 bg-white rounded-2xl shadow-lg overflow-hidden">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                                        <img src="/icon.png" className="w-4 h-4 rounded-md" alt="icon" />
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Dehati Sathi</span>
                                        <span className="text-[9px] text-gray-400 ml-auto">now</span>
                                    </div>
                                    <div className="p-3">
                                        <p className="font-black text-gray-900 text-[11px] leading-tight mb-1">{formData.title || 'Notification Title'}</p>
                                        <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{formData.body || 'Notification body text appears here.'}</p>
                                    </div>
                                    {imagePreview && (
                                        <img src={imagePreview} alt="Banner" className="w-full h-24 object-cover" />
                                    )}
                                </div>
                            )}

                            {/* Wallpaper effect */}
                            <div className="absolute inset-0 -z-10 opacity-10 bg-gradient-to-br from-green-200 to-emerald-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
