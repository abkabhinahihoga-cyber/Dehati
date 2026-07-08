import { NextResponse } from 'next/server';
import connectDb from '@/lib/db';
import WorkApplication from '@/app/models/workApplication.model';
import User from '@/app/models/user.model';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth() as any;
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDb();
        
        const user = await User.findById(session.user.id).select('workerProfile').lean();
        const applications = await WorkApplication.find({ userId: session.user.id })
            .populate('workOpportunityId', 'title titleHindi companyName paymentPerPiece')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ 
            success: true, 
            data: {
                profile: user?.workerProfile || {},
                applications
            } 
        });
    } catch (error: any) {
        console.error('Work Dashboard Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
