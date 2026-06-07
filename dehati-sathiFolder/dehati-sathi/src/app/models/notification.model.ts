import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    },
    type: { 
        type: String, 
        enum: ["follow", "order", "like", "comment", "system"], 
        required: true 
    },
    message: { type: String, required: true },
    relatedId: { type: String }, // ID of the Order, Reel, or Product
    read: { type: Boolean, default: false },
}, { timestamps: true });

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;