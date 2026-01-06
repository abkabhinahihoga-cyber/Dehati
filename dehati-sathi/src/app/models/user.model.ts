import mongoose from "mongoose";

export interface IUser {
    _id?: string; // Use string for the interface to be compatible with frontend/backend
    name: string;
    email: string;
    password?: string;
    mobile?: string;
    role: "user" | "deliveryBoy" | "seller" | "admin";
    image?: string;
}

const userSchema = new mongoose.Schema<IUser>({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: false
    },
    mobile: {
        type: String,
        required: false
    },
    role: {
        type: String,
        enum: ["user", "deliveryBoy", "seller", "admin"],
        trim: true,
        default: "user"
    },
    image: {
        type: String
    }
}, { timestamps: true });

// Check if model exists to prevent re-compilation in development
const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default User;