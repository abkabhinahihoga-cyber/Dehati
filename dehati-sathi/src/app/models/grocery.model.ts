import mongoose from "mongoose";

interface IGrocery {
    _id?: mongoose.Types.ObjectId;
    name: string;
    category: string;
    price: number; // Changed to number for easier math
    minPrice: number;
    maxPrice: number;
    unit: string;
    images: string[]; // Array for multiple images
    stock: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const grocerySchema = new mongoose.Schema<IGrocery>({
    name: { type: String, required: true },
    category: {
        type: String,
        enum: ["Fruits & Vegetables", "Dairy Products", "Old Books", "Rice,Atta & Grains", "HandCrafted Products", "Household Essentials", "Others"],
        required: true
    },
    price: { type: Number, required: true }, // The "nearest min price" value
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    unit: {
        type: String,
        required: true,
        enum: ["kg", "g", "liter", "ml", "piece", "pack"]
    },
    images: [{ type: String, required: true }] // Array of URLs
}, { timestamps: true });

const Grocery = mongoose.models.Grocery || mongoose.model("Grocery", grocerySchema);
export default Grocery;