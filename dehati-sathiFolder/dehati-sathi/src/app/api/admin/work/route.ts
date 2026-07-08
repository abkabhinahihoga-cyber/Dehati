import { NextResponse } from 'next/server';
import connectDb from '@/lib/db';
import WorkOpportunity from '@/app/models/workOpportunity.model';
import WorkApplication from '@/app/models/workApplication.model';
import { auth } from '@/auth';

export async function GET(request: Request) {
    try {
        const session = await auth() as any;
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDb();
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'applications') {
            const apps = await WorkApplication.find()
                .populate('userId', 'name mobile')
                .populate('workOpportunityId', 'title companyName')
                .sort({ createdAt: -1 })
                .lean();
            return NextResponse.json({ success: true, data: apps });
        }

        const opportunities = await WorkOpportunity.find().sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, data: opportunities });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth() as any;
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDb();
        const data = await request.json();
        
        if (data._id) {
            // Update
            const updated = await WorkOpportunity.findByIdAndUpdate(data._id, data, { new: true });
            return NextResponse.json({ success: true, data: updated });
        } else {
            // Create
            const newOpportunity = new WorkOpportunity({
                ...data,
                createdByAdmin: session.user.id
            });
            await newOpportunity.save();
            return NextResponse.json({ success: true, data: newOpportunity });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
