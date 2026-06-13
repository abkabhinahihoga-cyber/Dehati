import mongoose from "mongoose";

const hubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
      address: { type: String },
    },
    h3Index: { type: String }, // Hexagonal index for fast spatial queries
    coverageRadius: { type: Number, default: 3.5 }, // 3.5 km default radius
    // 👇 THIS FIELD IS REQUIRED FOR SETTINGS TO WORK
    autoAssignTime: { type: String, default: "" }, 
    isActive: { type: Boolean, default: true },
    // Products hub manager has enabled from master catalog
    enabledProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "MasterProduct" }],
  },
  { timestamps: true }
);

// Indexes for scaling
hubSchema.index({ location: "2dsphere" });
hubSchema.index({ h3Index: 1 });

// Prevent overwriting model if it exists
const Hub = mongoose.models.Hub || mongoose.model("Hub", hubSchema);
export default Hub;