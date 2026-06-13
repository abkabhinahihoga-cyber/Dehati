import mongoose, { Schema } from "mongoose";

export interface IMandiBhav {
  hubId: mongoose.Types.ObjectId;
  masterProductId: mongoose.Types.ObjectId;
  price: number;       // current mandi price (auto-fill for seller)
  minPrice: number;    // admin-defined min price (informational)
  maxPrice: number;    // admin-defined max price (informational)
  updatedBy: mongoose.Types.ObjectId;
  updatedAt?: Date;
}

const mandiBhavSchema = new Schema<IMandiBhav>(
  {
    hubId: { type: Schema.Types.ObjectId, ref: "Hub", required: true, index: true },
    masterProductId: { type: Schema.Types.ObjectId, ref: "MasterProduct", required: true, index: true },
    price: { type: Number, required: true, default: 0 },
    minPrice: { type: Number, default: 0 },
    maxPrice: { type: Number, default: 0 },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Unique per hub + product combination
mandiBhavSchema.index({ hubId: 1, masterProductId: 1 }, { unique: true });

const MandiBhav =
  mongoose.models.MandiBhav ||
  mongoose.model<IMandiBhav>("MandiBhav", mandiBhavSchema);

export default MandiBhav;
