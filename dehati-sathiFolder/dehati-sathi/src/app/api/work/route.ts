import { NextResponse } from 'next/server';
import connectDb from '@/lib/db';
import WorkOpportunity from '@/app/models/workOpportunity.model';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        await connectDb();
        
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const workType = searchParams.get('workType');
        
        let query: any = { isActive: true };
        
        if (category && category !== 'All') {
            query.category = category;
        }
        
        if (workType) {
            query.workType = workType;
        }
        
        // Removed assignedHub filter so all users can see all jobs in the marketplace.
        // The apply restriction will be handled on the job details page.

        const opportunities = await WorkOpportunity.find(query)
            .sort({ createdAt: -1 })
            .lean();
            
        return NextResponse.json({ success: true, data: opportunities });
    } catch (error: any) {
        console.error('Fetch Work Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
