'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocale } from 'next-intl';
import { 
    Activity, Users, ShoppingBag, Briefcase, TrendingUp, 
    Clock, CheckCircle, Package, MapPin, Loader2, ArrowUpRight, ShieldCheck, User
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsDashboard() {
    const locale = useLocale();
    const isHi = locale === 'hi';
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    const fetchAnalytics = async () => {
        try {
            const res = await axios.get('/api/admin/dashboard-analytics');
            if (res.data.success) {
                setData(res.data.analytics);
            }
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        // Auto-refresh real-time stats every 30 seconds
        const interval = setInterval(fetchAnalytics, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-green-600" />
            </div>
        );
    }

    if (!data) return <div>Failed to load analytics</div>;

    const { users, segments, jobs, marketplace, realtime, trends } = data;

    const segmentData = [
        { name: isHi ? 'किसान' : 'Farmers', value: segments.totalSellers },
        { name: isHi ? 'ग्राहक' : 'Buyers', value: segments.totalBuyers },
        { name: isHi ? 'श्रमिक' : 'Workers', value: segments.totalWorkers },
    ];

    const StatCard = ({ title, value, sub, icon: Icon, color, isPulse = false }: any) => (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {isPulse && (
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-gray-500 text-sm font-semibold mb-1">{title}</h3>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-gray-900">{value}</span>
                    {sub && <span className="text-xs text-gray-500 font-medium pb-1">{sub}</span>}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <Activity className="w-8 h-8 text-indigo-600" />
                        {isHi ? 'एनालिटिक्स डैशबोर्ड' : 'Analytics Dashboard'}
                    </h1>
                    <p className="text-gray-500 mt-1">Real-time metrics and performance insights.</p>
                </div>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-bold border border-green-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live Updates Active
                </div>
            </div>

            {/* REAL-TIME & USER STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title={isHi ? 'अभी ऑनलाइन' : 'Online Right Now'} 
                    value={users.onlineUsersCount} 
                    sub="Users active" 
                    icon={Activity} 
                    color="bg-green-100 text-green-600"
                    isPulse={true}
                />
                <StatCard 
                    title="DAU" 
                    value={users.dau} 
                    sub={isHi ? 'दैनिक सक्रिय' : 'Daily Active'} 
                    icon={Users} 
                    color="bg-blue-100 text-blue-600" 
                />
                <StatCard 
                    title="MAU" 
                    value={users.mau} 
                    sub={isHi ? 'मासिक सक्रिय' : 'Monthly Active'} 
                    icon={Users} 
                    color="bg-purple-100 text-purple-600" 
                />
                <StatCard 
                    title={isHi ? 'रिटेंशन दर' : 'Retention Rate'} 
                    value={`${users.retentionRate}%`} 
                    sub={isHi ? 'वापस आने वाले' : 'Returning'} 
                    icon={ShieldCheck} 
                    color="bg-orange-100 text-orange-600" 
                />
            </div>

            {/* CHARTS ROW 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Growth Chart */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 text-lg">{isHi ? 'उपयोगकर्ता वृद्धि (7 दिन)' : 'User Growth (7 Days)'}</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trends.userGrowthTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Segments Pie Chart */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 text-lg">{isHi ? 'उपयोगकर्ता विभाजन' : 'User Segments'}</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={segmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {segmentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-500">Total Registered: <span className="font-bold text-gray-900">{users.totalUsers}</span></p>
                    </div>
                </div>
            </div>

            {/* DOMAIN STATS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Marketplace Analytics */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <ShoppingBag className="w-6 h-6 text-emerald-600" />
                        <h3 className="font-bold text-gray-800 text-lg">{isHi ? 'मार्केटप्लेस' : 'Marketplace Analytics'}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-gray-500 text-sm mb-1">{isHi ? 'कुल उत्पाद' : 'Total Products'}</p>
                            <p className="text-2xl font-black text-gray-900">{marketplace.totalProducts}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl">
                            <p className="text-emerald-700 text-sm mb-1">{isHi ? 'कुल लेनदेन' : 'Total Transaction Value'}</p>
                            <p className="text-2xl font-black text-emerald-700">₹{marketplace.totalTransactionValue.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-gray-500 text-sm mb-1">{isHi ? 'ऑर्डर आज' : 'Orders Today'}</p>
                            <p className="text-2xl font-black text-gray-900">{marketplace.ordersToday}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-gray-500 text-sm mb-1">{isHi ? 'वितरित ऑर्डर' : 'Delivered Orders'}</p>
                            <p className="text-2xl font-black text-gray-900">{marketplace.deliveredOrders}</p>
                        </div>
                    </div>
                </div>

                {/* Jobs Analytics */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                        <h3 className="font-bold text-gray-800 text-lg">{isHi ? 'रोज़गार' : 'Job Analytics'}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-gray-500 text-sm mb-1">{isHi ? 'कुल नौकरियां' : 'Total Jobs'}</p>
                            <p className="text-2xl font-black text-gray-900">{jobs.totalJobs}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl">
                            <p className="text-blue-700 text-sm mb-1">{isHi ? 'नौकरियों से आय' : 'Total Job Earnings'}</p>
                            <p className="text-2xl font-black text-blue-700">₹{jobs.totalEarningsFromJobs.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-gray-500 text-sm mb-1">{isHi ? 'सक्रिय नौकरियां' : 'Active Jobs'}</p>
                            <p className="text-2xl font-black text-gray-900">{jobs.activeJobs}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-gray-500 text-sm mb-1">{isHi ? 'पूरी हुई नौकरियां' : 'Completed Jobs'}</p>
                            <p className="text-2xl font-black text-gray-900">{jobs.completedJobs}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIVE ACTIVITY TABLES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">{isHi ? 'हाल ही में ऑनलाइन उपयोगकर्ता' : 'Recently Online Users'}</h3>
                    <div className="space-y-4">
                        {realtime.onlineUsersDetails.length === 0 ? (
                            <p className="text-gray-400 text-sm">No users online recently.</p>
                        ) : (
                            realtime.onlineUsersDetails.map((u: any) => (
                                <div key={u._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                                                {u.image ? <img src={u.image} alt="User" /> : <User className="w-full h-full p-2 text-gray-400" />}
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{u.name}</p>
                                            <p className="text-xs text-gray-500 uppercase">{u.role}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-bold">Online</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">{isHi ? 'हाल के ऑर्डर' : 'Recent Orders'}</h3>
                    <div className="space-y-4">
                        {realtime.recentOrders.length === 0 ? (
                            <p className="text-gray-400 text-sm">No recent orders.</p>
                        ) : (
                            realtime.recentOrders.map((o: any) => (
                                <div key={o._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 rounded-lg">
                                            <Package className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">₹{o.totalAmount}</p>
                                            <p className="text-xs text-gray-500">{o.user?.name || 'Guest'}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold capitalize ${
                                        o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                        o.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {o.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
