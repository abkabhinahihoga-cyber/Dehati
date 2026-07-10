import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import PushSubscription from '@/app/models/PushSubscription.model';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const session = await auth();
        
        const subscription = await req.json();
        
        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
        }

        // Upsert the subscription
        // We use the endpoint as the unique key because each browser installation gets a unique endpoint
        const updateData: any = {
            endpoint: subscription.endpoint,
            keys: subscription.keys
        };
        
        if (session?.user?.id) {
            updateData.userId = session.user.id;
        }

        await PushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            updateData,
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, message: 'Subscribed successfully' });
    } catch (error: any) {
        console.error('Subscription error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
