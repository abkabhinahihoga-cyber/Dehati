import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPushSubscription extends Document {
  userId?: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false // Optional to allow anonymous subscriptions, but we will mostly link to users
  },
  endpoint: {
    type: String,
    required: true,
    unique: true
  },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Avoid OverwriteModelError in Next.js development
const PushSubscription: Model<IPushSubscription> = 
  mongoose.models.PushSubscription || mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);

export default PushSubscription;
