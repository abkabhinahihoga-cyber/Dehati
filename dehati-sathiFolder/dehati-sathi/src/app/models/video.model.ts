import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Grocery", required: true }, 
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  description: { type: String, maxlength: 200 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  // 👇 NEW: Cache comment count for performance
  buzzCount: { type: Number, default: 0 }, 
  
  views: { type: Number, default: 0 },
  tags: [String]
}, { timestamps: true });

export default mongoose.models.Video || mongoose.model("Video", videoSchema);