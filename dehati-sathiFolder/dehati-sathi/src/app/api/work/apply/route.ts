import { NextResponse } from 'next/server';
import connectDb from '@/lib/db';
import WorkApplication from '@/app/models/workApplication.model';
import { auth } from '@/auth';
import User from '@/app/models/user.model';

export async function POST(request: Request) {
    try {
        const session = await auth() as any;
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDb();
        const data = await request.json();
        
        // Check if already applied
        const existing = await WorkApplication.findOne({ 
            userId: session.user.id, 
            workOpportunityId: data.workOpportunityId 
        });
        
        if (existing) {
            return NextResponse.json({ success: false, error: 'Already applied' }, { status: 400 });
        }

        const application = new WorkApplication({
            ...data,
            userId: session.user.id
        });
        await application.save();
        
        // Update user to be a worker if they aren't already
        await User.findByIdAndUpdate(session.user.id, {
            'workerProfile.isWorker': true,
            $addToSet: {
                'workerProfile.skills': data.occupation || 'General Work'
            }
        });

        return NextResponse.json({ success: true, message: 'Applied successfully' });
    } catch (error: any) {
        console.error('Work Apply Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
