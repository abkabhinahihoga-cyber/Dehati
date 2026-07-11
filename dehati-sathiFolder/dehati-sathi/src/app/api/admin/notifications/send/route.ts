import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDb from '@/lib/db';
import PushSubscription from '@/app/models/PushSubscription.model';
import User from '@/app/models/user.model';
import webpush from 'web-push';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
    try {
        // Configure Web Push inside handler so env vars are available at runtime
        webpush.setVapidDetails(
            'mailto:support@dehatisathi.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
            process.env.VAPID_PRIVATE_KEY!
        );

        await connectDb();
        const session = await auth();
        
        // Ensure admin
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { title, body, image, url, audience, targetUserId } = await req.json();
        
        if (!title || !body) {
            return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
        }

        let query: any = {};
        
        if (audience === 'individual' && targetUserId) {
            query.userId = new mongoose.Types.ObjectId(targetUserId);
        } else if (audience && audience !== 'everyone' && audience !== 'individual') {
            // Role based filtering (worker, farmer, seller)
            // First find all users with that role
            const users = await User.find({ role: audience }).select('_id');
            const userIds = users.map(u => u._id);
            query.userId = { $in: userIds };
        }

        const subscriptions = await PushSubscription.find(query);

        if (subscriptions.length === 0) {
            return NextResponse.json({ message: 'No subscriptions found for target audience', count: 0 });
        }

        const payload = JSON.stringify({
            title,
            body,
            image,
            url: url || '/',
            icon: '/icon.png'
        });

        let successCount = 0;
        let failCount = 0;

        // Send to all matched subscriptions in parallel chunks
        const promises = subscriptions.map(sub => {
            const pushSub = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.keys.p256dh,
                    auth: sub.keys.auth
                }
            };
            
            return webpush.sendNotification(pushSub, payload).then(() => {
                successCount++;
            }).catch(async (err) => {
                failCount++;
                // If it's a 410 (Gone) or 404, the subscription is no longer valid
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await PushSubscription.deleteOne({ _id: sub._id });
                }
            });
        });

        await Promise.all(promises);

        return NextResponse.json({ 
            success: true, 
            message: `Sent successfully to ${successCount} devices. ${failCount} failed/expired.` 
        });
    } catch (error: any) {
        console.error('Send push error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
