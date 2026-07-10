import { NextResponse } from 'next/server';
import connectDb from '@/lib/db';
import WorkApplication from '@/app/models/workApplication.model';
import User from '@/app/models/user.model';
import { auth } from '@/auth';

export async function PATCH(request: Request) {
    try {
        const session = await auth() as any;
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDb();
        const { id, status } = await request.json();
        
        if (!id || !status) {
            return NextResponse.json({ success: false, error: 'Missing ID or status' }, { status: 400 });
        }

        const application = await WorkApplication.findByIdAndUpdate(id, { status }, { new: true });
        
        if (!application) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }

        // If approved, update user's worker profile
        if (status === 'Approved') {
            await User.findByIdAndUpdate(application.userId, {
                'workerProfile.isWorker': true
            });
        }

        return NextResponse.json({ success: true, data: application });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
