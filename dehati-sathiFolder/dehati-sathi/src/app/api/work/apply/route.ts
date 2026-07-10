import { NextResponse } from 'next/server';
import connectDb from '@/lib/db';
import WorkApplication from '@/app/models/workApplication.model';
import { auth } from '@/auth';
import User from '@/app/models/user.model';
import uploadOnCloudinary from "@/lib/cloudinary";

export async function POST(request: Request) {
    try {
        const session = await auth() as any;
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDb();
        const formData = await request.formData();
        
        const workOpportunityId = formData.get('workOpportunityId');
        
        // Check if already applied
        const existing = await WorkApplication.findOne({ 
            userId: session.user.id, 
            workOpportunityId: workOpportunityId 
        });
        
        if (existing) {
            return NextResponse.json({ success: false, error: 'Already applied' }, { status: 400 });
        }

        let aadhaarUrl = '';
        const aadhaarFile = formData.get('aadhaarCard') as File | null;
        if (aadhaarFile) {
            const uploadedUrl = await uploadOnCloudinary(aadhaarFile);
            if (uploadedUrl) aadhaarUrl = uploadedUrl;
        }

        const data = {
            workOpportunityId,
            fullName: formData.get('fullName'),
            mobileNumber: formData.get('mobileNumber'),
            village: formData.get('village'),
            district: formData.get('district'),
            state: formData.get('state'),
            age: Number(formData.get('age')),
            occupation: formData.get('occupation'),
            workingHoursPerDay: Number(formData.get('workingHoursPerDay')),
            aadhaarUrl
        };

        const application = new WorkApplication({
            ...data,
            userId: session.user.id
        });
        await application.save();
        
        // Update user to be a worker if they aren't already, and save aadhaar URL to profile
        await User.findByIdAndUpdate(session.user.id, {
            'workerProfile.isWorker': true,
            ...(aadhaarUrl && { 'workerProfile.aadhaarUrl': aadhaarUrl }),
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
