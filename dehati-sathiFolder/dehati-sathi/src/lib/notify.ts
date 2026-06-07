import dbConnect from "@/lib/db";
import Notification from "@/app/models/notification.model";

interface NotifyProps {
    recipientId: string;
    senderId?: string;
    type: "follow" | "order" | "like" | "comment" | "system";
    message: string;
    relatedId?: string;
}

export async function createNotification({ recipientId, senderId, type, message, relatedId }: NotifyProps) {
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
    } catch (error) {
        console.error("Notification Error:", error);
    }
}