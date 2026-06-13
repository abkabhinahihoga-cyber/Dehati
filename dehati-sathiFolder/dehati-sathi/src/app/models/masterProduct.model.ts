import mongoose, { Schema } from "mongoose";

export interface IMasterProduct {
  name: string;
  nameHindi?: string;
  category: string;
  unit: string;
  image?: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
}

const masterProductSchema = new Schema<IMasterProduct>(
  {
    name: { type: String, required: true },
    nameHindi: { type: String, default: "" },
    category: { type: String, required: true },
    unit: { type: String, required: true },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

masterProductSchema.index({ category: 1 });
masterProductSchema.index({ name: 1 });

const MasterProduct =
  mongoose.models.MasterProduct ||
  mongoose.model<IMasterProduct>("MasterProduct", masterProductSchema);

export default MasterProduct;
