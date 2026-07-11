import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata() {
    return { title: `Admin Analytics | Dehati Sathi` };
}

export default async function AdminAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const session = await auth();

    if (!session || session.user.role !== 'admin') {
        redirect(`/${locale}/login`);
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <Link href={`/${locale}/admin/dashboard`} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold bg-white px-4 py-2 rounded-xl shadow-sm border border-indigo-100 transition">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Admin Hub
                    </Link>
                </div>
                <AnalyticsDashboard />
            </div>
        </div>
    );
}
