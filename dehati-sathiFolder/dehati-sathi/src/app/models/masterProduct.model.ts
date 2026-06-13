import mongoose, { Schema } from "mongoose";

export interface IMasterProduct {
  name: string;
  nameHindi?: string;
  category: string;
  unit: string;
  image?: string;
  description?: string;
  isActive: boolean;
  isHubProduct: boolean;
  retailPrice?: number;
  wholesalePrice?: number;
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
    isHubProduct: { type: Boolean, default: false, index: true },
    retailPrice: { type: Number },
    wholesalePrice: { type: Number },
  },
  { timestamps: true }
);

masterProductSchema.index({ category: 1 });
masterProductSchema.index({ name: 1 });

const MasterProduct =
  mongoose.models.MasterProduct ||
  mongoose.model<IMasterProduct>("MasterProduct", masterProductSchema);

export default MasterProduct;
