import dbConnect from "@/lib/db";
import Notification from "@/app/models/notification.model";
import PushSubscription from "@/app/models/PushSubscription.model";
import webpush from "web-push";

interface NotifyProps {
    recipientId: string;
    senderId?: string;
    type: "follow" | "order" | "like" | "comment" | "system";
    message: string;
    relatedId?: string;
    title?: string;
    url?: string;
}

export async function createNotification({ recipientId, senderId, type, message, relatedId, title, url }: NotifyProps) {
    try {
        await dbConnect();
        // Prevent duplicate spam (e.g., repeated likes)
        if (type === 'like' || type === 'follow') {
            const exists = await Notification.findOne({ recipient: recipientId, sender: senderId, type, relatedId });
            if (exists) return; 
        }

        await Notification.create({
            recipient: recipientId,
            sender: senderId,
            type,
            message,
            relatedId
        });

        // --- SEND WEB PUSH NOTIFICATION (OUTSIDE APP) ---
        if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
            webpush.setVapidDetails(
                'mailto:support@dehatisathi.com',
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
                process.env.VAPID_PRIVATE_KEY
            );

            const subscriptions = await PushSubscription.find({ userId: recipientId });
            
            if (subscriptions.length > 0) {
                const pushTitle = title || (
                    type === 'order' ? 'Order Update 📦' :
                    type === 'system' ? 'System Update ⚙️' :
                    'New Notification 🔔'
                );
                
                const pushUrl = url || (
                    type === 'order' ? '/seller/dashboard' : '/'
                );

                const payload = JSON.stringify({
                    title: pushTitle,
                    body: message,
                    icon: '/icon-192x192.png',
                    url: pushUrl,
                });

                // Send to all devices
                const sendPromises = subscriptions.map(sub => 
                    webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.keys.p256dh,
                                auth: sub.keys.auth
                            }
                        },
                        payload
                    ).catch(err => {
                        // If subscription is invalid/expired, remove it
                        if (err.statusCode === 404 || err.statusCode === 410) {
                            return PushSubscription.findByIdAndDelete(sub._id);
                        }
                    })
                );
                
                await Promise.all(sendPromises);
            }
        }
    } catch (error) {
        console.error("Notification Error:", error);
    }
}