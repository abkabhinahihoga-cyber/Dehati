import { NextResponse } from 'next/server';
import connectDb from '@/lib/db';
import WorkOpportunity from '@/app/models/workOpportunity.model';
import Hub from '@/app/models/hub.model';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDb();
        const { id } = await params;
        
        const opportunity = await WorkOpportunity.findById(id).populate('assignedHub', 'name managerPhone').lean();
        
        if (!opportunity) {
            return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        }
            
        return NextResponse.json({ success: true, data: opportunity });
    } catch (error: any) {
        console.error('Fetch Work Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
