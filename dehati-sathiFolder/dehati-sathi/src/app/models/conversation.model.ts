import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    }],
    lastMessage: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Ensure unique conversation between two participants
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);
export default Conversation;