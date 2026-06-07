import mongoose, { Schema, Model } from "mongoose";

// 1. Define Payout Schema
const payoutSchema = new Schema({
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String },
    adminId: { type: Schema.Types.ObjectId, ref: "User" }
});

// 2. Interface (Must match Schema)
export interface IUser {
    _id?: mongoose.Types.ObjectId;
    name: string;
    email?: string;
    password?: string;
    mobile?: string;
    role: "user" | "deliveryBoy" | "seller" | "admin" | "hub";
    image?: string;
    isNewUser: boolean;
    language: "en" | "hi";
    
    // Hub Link
    connectedHub?: mongoose.Types.ObjectId;
    
    // Social Graph
    connections: mongoose.Types.ObjectId[];
    followersCount: number;

    location: {
        type: "Point";
        coordinates: number[]; // [lng, lat]
        address?: string;
    };
    h3Index?: string;

    // Seller Fields
    sellerStatus: 'none' | 'pending' | 'approved' | 'rejected';
    sellerDetails?: { shopName: string; shopAddress: string; gstin?: string };
    
    isBlocked: boolean;
    walletBalance: number;
    totalEarnings: number;
    payoutHistory: any[];
    
    // Refer & Earn Fields
    referralCode?: string;
    referredBy?: mongoose.Types.ObjectId;
    referralRewardGiven: boolean;
    
    socketId?: string | null;
    isOnline?: boolean;
    
    deliveryStatus: "none" | "pending_hub" | "pending_admin" | "approved" | "rejected";
    deliveryDetails?: {
        name: string;
        fatherName: string;
        mobile: string;
        vehicleType: string;
        vehicleNumber?: string;
        drivingLicense?: string;
        address: string;
    };

    createdAt?: Date;
    updatedAt?: Date;
}

// 3. Schema
const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
        mobile: { type: String, unique: true, sparse: true },
        password: { type: String, required: false },
        role: { 
            type: String, 
            enum: ["user", "deliveryBoy", "seller", "admin", "hub"], 
            default: "user" 
        },
        image: { type: String },
        isNewUser: { type: Boolean, default: true },
        language: { type: String, enum: ["en", "hi"], default: "en" },
        
        connectedHub: { type: Schema.Types.ObjectId, ref: "Hub", default: null },
        
        // 👇 GEOJSON LOCATION
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }, // [Longitude, Latitude]
            address: { type: String }
        },
        h3Index: { type: String }, // Hexagonal grid index

        // 👇 NEW: Social Graph (Placed correctly outside location)
        connections: [{ type: Schema.Types.ObjectId, ref: "User" }], 
        followersCount: { type: Number, default: 0 },

        sellerStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
        sellerDetails: { shopName: String, shopAddress: String, gstin: String },

        isBlocked: { type: Boolean, default: false },
        walletBalance: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 },
        payoutHistory: [payoutSchema],

        // Refer & Earn Fields
        referralCode: { type: String, unique: true, sparse: true, index: true },
        referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        referralRewardGiven: { type: Boolean, default: false },

        socketId: { type: String, default: null },
        isOnline: { type: Boolean, default: false },

        // Delivery Fields
        deliveryStatus: {
            type: String,
            enum: ["none", "pending_hub", "pending_admin", "approved", "rejected"],
            default: "none"
        },
        deliveryDetails: {
            name: String,
            fatherName: String,
            mobile: String,
            vehicleType: String,
            vehicleNumber: String,
            drivingLicense: String,
            address: String
        }
    },
    { timestamps: true }
);

// Create geospatial index
userSchema.index({ location: "2dsphere" });
userSchema.index({ h3Index: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default User;