import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Grocery", required: true },
  type: { type: String, enum: ["view", "click", "cart", "purchase", "wishlist"], required: true },
  category: { type: String },
  score: { type: Number, default: 1 },
}, { timestamps: true });

// Auto-delete logs after 30 days to save database space
interactionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export default mongoose.models.Interaction || mongoose.model("Interaction", interactionSchema);