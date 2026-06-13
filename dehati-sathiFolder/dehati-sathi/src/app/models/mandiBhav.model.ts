import mongoose, { Schema } from "mongoose";

export interface IMandiBhav {
  hubId: mongoose.Types.ObjectId;
  masterProductId: mongoose.Types.ObjectId;
  retailPrice: number;       // current retail price
  retailMinPrice: number;    // admin-defined min retail price
  retailMaxPrice: number;    // admin-defined max retail price
  wholesalePrice: number;    // current wholesale price
  wholesaleMinPrice: number; // admin-defined min wholesale price
  wholesaleMaxPrice: number; // admin-defined max wholesale price
  updatedBy: mongoose.Types.ObjectId;
  updatedAt?: Date;
}

const mandiBhavSchema = new Schema<IMandiBhav>(
  {
    hubId: { type: Schema.Types.ObjectId, ref: "Hub", required: true, index: true },
    masterProductId: { type: Schema.Types.ObjectId, ref: "MasterProduct", required: true, index: true },
    retailPrice: { type: Number, required: true, default: 0 },
    retailMinPrice: { type: Number, default: 0 },
    retailMaxPrice: { type: Number, default: 0 },
    wholesalePrice: { type: Number, required: true, default: 0 },
    wholesaleMinPrice: { type: Number, default: 0 },
    wholesaleMaxPrice: { type: Number, default: 0 },
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
