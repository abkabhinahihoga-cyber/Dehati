import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String }, 
    
    // 👇 Fixes broken images (Stores type and URL)
    type: { type: String, enum: ['text', 'image', 'video', 'audio', 'file'], default: 'text' },
    fileUrl: { type: String }, 
    
    status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
    
    // 👇 Fixes Delete Logic
    isDeleted: { type: Boolean, default: false },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

// 👇 Fixes Auto-Delete (Removes message 24 hours after creation)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);
export default Message;