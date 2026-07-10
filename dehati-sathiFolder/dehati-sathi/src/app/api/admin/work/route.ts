import { NextResponse } from 'next/server';
import connectDb from '@/lib/db';
import WorkOpportunity from '@/app/models/workOpportunity.model';
import WorkApplication from '@/app/models/workApplication.model';
import { auth } from '@/auth';
import uploadOnCloudinary from "@/lib/cloudinary";

export async function GET(request: Request) {
    try {
        const session = await auth() as any;
        if (session?.user?.role !== 'admin') {
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
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDb();
        const formData = await request.formData();
        
        let imageUrl = '';
        const imageFile = formData.get('image') as File | null;
        if (imageFile) {
            const uploadedUrl = await uploadOnCloudinary(imageFile);
            if (uploadedUrl) imageUrl = uploadedUrl;
        }

        const data: any = {
            title: formData.get('title'),
            titleHindi: formData.get('titleHindi'),
            companyName: formData.get('companyName'),
            category: formData.get('category'),
            paymentPerPiece: Number(formData.get('paymentPerPiece')),
            paymentUnit: formData.get('paymentUnit') || 'piece',
            estimatedDailyIncome: Number(formData.get('estimatedDailyIncome')) || undefined,
            difficulty: formData.get('difficulty'),
            skillLevel: formData.get('skillLevel') || 'Beginner',
            workType: formData.get('workType') || 'Home Based',
            estimatedTimePerPieceMinutes: formData.get('timePerPiece') || undefined,
            description: formData.get('description'),
            trainingVideoUrl: formData.get('trainingVideoUrl') || undefined,
            rawMaterialProvided: formData.get('rawMaterialProvided') === 'true',
            trainingAvailable: formData.get('trainingAvailable') === 'true',
            isVerified: formData.get('isVerified') === 'true',
            trustScore: Number(formData.get('trustScore')) || 0,
            availablePositions: Number(formData.get('availablePositions')) || undefined,
            whoCanApply: formData.get('whoCanApply') || undefined,
            qualityGuidelines: formData.get('qualityGuidelines') || undefined,
            pickupProcess: formData.get('pickupProcess') || undefined,
            nearestPickupCenter: formData.get('nearestPickupCenter') || undefined,
            isActive: true,
            ...(imageUrl && { productImages: [imageUrl] })
        };

        // Handle comma-separated and newline-separated array fields
        const requiredSkills = formData.get('requiredSkills') as string;
        if (requiredSkills) data.requiredSkills = requiredSkills.split(',').map((s: string) => s.trim()).filter(Boolean);
        
        const requiredTools = formData.get('requiredTools') as string;
        if (requiredTools) data.requiredTools = requiredTools.split(',').map((s: string) => s.trim()).filter(Boolean);
        
        const stepByStepProcess = formData.get('stepByStepProcess') as string;
        if (stepByStepProcess) data.stepByStepProcess = stepByStepProcess.split('\n').map((s: string) => s.trim()).filter(Boolean);
        
        const commonMistakes = formData.get('commonMistakes') as string;
        if (commonMistakes) data.commonMistakes = commonMistakes.split('\n').map((s: string) => s.trim()).filter(Boolean);
        
        const id = formData.get('_id');
        if (id) {
            // Update
            const updated = await WorkOpportunity.findByIdAndUpdate(id, data, { new: true });
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

export async function DELETE(request: Request) {
    try {
        const session = await auth() as any;
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDb();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });
        }

        await WorkOpportunity.findByIdAndDelete(id);
        
        return NextResponse.json({ success: true, message: 'Job deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
