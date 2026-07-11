import mongoose, { Schema, Model, Document } from "mongoose";

export interface ISettings extends Document {
  platformFeeTiers: {
    minAmount: number;
    maxAmount: number;
    fee: number;
  }[];
  platformFeeWholesale: number;
  platformFeeRetail: number;
  gstPercentage: number;
  baseDeliveryFee: number;
  deliveryFeePerKm: number;
  hubCoverageRadiusKm: number;
  autoApproveSellers: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    platformFeeTiers: [
      {
        minAmount: { type: Number, required: true },
        maxAmount: { type: Number, required: true },
        fee: { type: Number, required: true },
      },
    ],
    platformFeeWholesale: { type: Number, default: 5 },
    platformFeeRetail: { type: Number, default: 8 },
    gstPercentage: { type: Number, default: 0 },
    baseDeliveryFee: { type: Number, default: 0 },
    deliveryFeePerKm: { type: Number, default: 0 },
    hubCoverageRadiusKm: { type: Number, default: 3.5 },
    autoApproveSellers: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>("Settings", settingsSchema);
export default Settings;
