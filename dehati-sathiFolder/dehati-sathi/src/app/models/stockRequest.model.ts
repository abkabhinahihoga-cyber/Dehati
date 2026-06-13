import mongoose, { Schema } from "mongoose";

export interface IStockRequest {
  hubId: mongoose.Types.ObjectId;
  masterProductId: mongoose.Types.ObjectId;
  quantity: number;
  status: 'pending' | 'approved' | 'shipped' | 'received';
  createdAt?: Date;
  updatedAt?: Date;
}

const stockRequestSchema = new Schema<IStockRequest>(
  {
    hubId: { type: Schema.Types.ObjectId, ref: "Hub", required: true, index: true },
    masterProductId: { type: Schema.Types.ObjectId, ref: "MasterProduct", required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'shipped', 'received'], 
        default: 'pending',
        index: true
    },
  },
  { timestamps: true }
);

const StockRequest =
  mongoose.models.StockRequest ||
  mongoose.model<IStockRequest>("StockRequest", stockRequestSchema);

export default StockRequest;
