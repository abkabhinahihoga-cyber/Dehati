import { NextResponse } from 'next/server';
import connectDb from '@/lib/db';
import mongoose from 'mongoose';
import { auth } from '@/auth';

// Define the Report schema
const reportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workOpportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOpportunity', required: true },
    reason: { type: String, required: true },
    details: { type: String },
    status: { type: String, enum: ['Pending', 'Reviewed', 'Resolved'], default: 'Pending' }
}, { timestamps: true });

// Create the model if it doesn't exist
const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

export async function POST(request: Request) {
    try {
        const session = await auth() as any;
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDb();
        const body = await request.json();
        
        if (!body.workOpportunityId || !body.reason) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const newReport = new Report({
            userId: session.user.id,
            workOpportunityId: body.workOpportunityId,
            reason: body.reason,
            details: body.details
        });

        await newReport.save();

        return NextResponse.json({ success: true, message: 'Report submitted successfully' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
