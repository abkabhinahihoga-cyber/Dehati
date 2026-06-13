import mongoose, { Schema, Model } from "mongoose";
import algoliaClient from "@/lib/algolia"; // 👈 Updated Import for v5 Client
import { ALL_CATEGORIES } from "@/lib/constants"; // 👈 Import Shared List
// 1. Review Schema
const reviewSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    images: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

// 2. Interface
export interface IGrocery {
    name: string;
    description?: string;
    wholesalePrice: number;
    retailPrice: number;
    price: number;
    category: string;
    unit: string;
    stock: number;
    images: string[];
    seller: mongoose.Types.ObjectId;
    masterProductId?: mongoose.Types.ObjectId;
    qualityScale?: number; // 1-10 scale
    reviews: any[];
    numReviews: number;
    averageRating: number;
    createdAt?: Date;
    status?: string;
    
    productType: 'grocery' | 'book'; 
    bookDetails?: {
        type?: 'book' | 'notes';
        author?: string;
        publication?: string;
        year?: string;
        condition?: 'new' | 'like-new' | 'good' | 'fair';
        printedPrice?: string;
        class?: string;
    };

    location: {
        type: "Point";
        coordinates: number[]; // [Longitude, Latitude]
    };
}

// 3. Schema
const grocerySchema = new Schema<IGrocery>(
    {
        name: { type: String, required: true },
        description: { type: String },
        wholesalePrice: { type: Number, default: 0 },
        retailPrice: { type: Number, default: 0 },
        price: { type: Number, required: true },
        category: { type: String, 
            required: true,
            enum: ALL_CATEGORIES, // 👈 Strict Validation using Master List
            index: true
         },
        unit: { type: String, required: true },
        stock: { type: Number, default: 0 },
        images: [{ type: String }],
        seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
        masterProductId: { type: Schema.Types.ObjectId, ref: "MasterProduct" },
        qualityScale: { type: Number, min: 1, max: 10, default: 5 },
        
        status: { type: String, default: 'active', index: true }, 

        reviews: [reviewSchema],
        numReviews: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },

        productType: { 
            type: String, 
            enum: ['grocery', 'book'], 
            default: 'grocery',
            index: true 
        },
        
        bookDetails: {
            type: { type: String, enum: ['book', 'notes'], default: 'book' },
            author: String,
            publication: String,
            year: String,
            condition: { type: String, enum: ['new', 'like-new', 'good', 'fair'] },
            printedPrice: String,
            class: String
        },

        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], index: '2dsphere' } 
        },
    },
    { timestamps: true }
);

// --- 4. ALGOLIA SYNC HOOKS (v5 COMPATIBLE) ---

// A. Sync on Save/Update
grocerySchema.post('save', function(doc) {
    // Check if keys exist to prevent errors in dev without keys
    if (process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_ADMIN_KEY) {
        const record = {
            objectID: doc._id.toString(),
            name: doc.name,
            description: doc.description,
            price: doc.price,
            retailPrice: doc.retailPrice,
            category: doc.category,
            image: doc.images?.[0] || '',
            rating: doc.averageRating,
            numReviews: doc.numReviews,
            productType: doc.productType,
            qualityScale: doc.qualityScale,
            sellerId: doc.seller.toString(),
            _geoloc: { 
                lat: doc.location.coordinates[1],
                lng: doc.location.coordinates[0]
            }
        };
        
        // 👇 v5 Syntax: Pass indexName and body
        algoliaClient.saveObject({
            indexName: 'products',
            body: record
        }).catch((err: any) => console.error("Algolia Sync Error:", err));
    }
});

// B. Sync on Delete
grocerySchema.post('findOneAndDelete', function(doc) {
    if (doc && process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_ADMIN_KEY) {
        // 👇 v5 Syntax: Pass indexName and objectID
        algoliaClient.deleteObject({
            indexName: 'products',
            objectID: doc._id.toString()
        }).catch((err: any) => console.error("Algolia Delete Error:", err));
    }
});

// --- INDEXES ---
grocerySchema.index({ location: "2dsphere" }); 
grocerySchema.index({ seller: 1, status: 1 });
grocerySchema.index({ productType: 1, status: 1 });

const Grocery = mongoose.models.Grocery || mongoose.model<IGrocery>("Grocery", grocerySchema);
export default Grocery;