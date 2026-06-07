import mongoose, { Schema } from "mongoose";

const buzzSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // The commenter
    video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    content: { type: String, required: true, trim: true },
}, { timestamps: true });

export default mongoose.models.Buzz || mongoose.model("Buzz", buzzSchema);