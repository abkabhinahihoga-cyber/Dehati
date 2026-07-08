import { NextResponse } from 'next/server';
import connectDb from '@/lib/db';
import WorkOpportunity from '@/app/models/workOpportunity.model';

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

        const opportunities = await WorkOpportunity.find(query)
            .sort({ createdAt: -1 })
            .lean();
            
        return NextResponse.json({ success: true, data: opportunities });
    } catch (error: any) {
        console.error('Fetch Work Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
