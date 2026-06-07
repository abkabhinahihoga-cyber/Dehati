import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: {
    product: mongoose.Types.ObjectId;
    name: string;
    price: number;
    unit: string;
    images: string[];
    seller: mongoose.Types.ObjectId;
    quantity: number;
  }[];
  isPaid: boolean;
  totalAmount: number;
  paymentMethod: "cod"; // "online" is temporarily removed
  
  // Flexible address to handle both Shipping Address and Pickup Location objects
  address: {
    fullName: string;
    mobile: string;
    village?: string;
    district?: string;
    state?: string;
    pincode?: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
    [key: string]: any; 
  };
  
  // New Tracking Fields
  rejectedBy: mongoose.Types.ObjectId[];
  deliveryType: 'home-delivery' | 'hub-pickup' | 'farm-pickup';

  assignment?: mongoose.Types.ObjectId;
  assignedDeliveryBoy?: mongoose.Types.ObjectId;
  connectedHub?: mongoose.Types.ObjectId; 
  isOpenForDelivery: boolean;
  deliveryBoyStatus: 'pending' | 'accepted' | 'rejected';
  
  status: "pending" | "processing" | "out_for_delivery" | "delivered" | "cancelled" | "driver_unavailable";
  
  createdAt?: Date;
  updatedAt?: Date;
}

const orderSchema = new mongoose.Schema<IOrder>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Grocery",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        unit: String,
        images: [String],
        quantity: { type: Number, required: true },
        seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    paymentMethod: {
      type: String,
      enum: ["cod"], // Online payments on hold for now
      default: "cod",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    totalAmount: { type: Number, required: true },
    
    // Use Mixed type to store whatever address object comes from frontend
    address: { type: Schema.Types.Mixed, required: true }, 
    
    rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // 👇 SAVED: This field was missing before
    deliveryType: { 
        type: String, 
        enum: ['home-delivery', 'hub-pickup', 'farm-pickup'], 
        default: 'home-delivery' 
    },

    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAssignment",
      default: null,
    },
    assignedDeliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    connectedHub: { type: mongoose.Schema.Types.ObjectId, ref: "Hub" }, 

    isOpenForDelivery: { type: Boolean, default: false }, 

    deliveryBoyStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending' 
    },
    status: {
      type: String,
      enum: ["pending", "processing", "out_for_delivery", "delivered", "cancelled", "driver_unavailable"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;