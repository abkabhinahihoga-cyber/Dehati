import mongoose from 'mongoose';
import { algoliasearch } from 'algoliasearch';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Algolia v5 Client
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);

async function sync() {
    try {
        if (!process.env.MONGODB_URL) {
            throw new Error("MONGODB_URL is missing in .env.local");
        }

        await mongoose.connect(process.env.MONGODB_URL);
        console.log("✅ Connected to MongoDB...");

        // Access the 'groceries' collection directly
        const collection = mongoose.connection.collection('groceries');
        const products = await collection.find({}).toArray();
        
        console.log(`📦 Found ${products.length} products. Syncing to Algolia...`);
        
        if (products.length === 0) {
            console.log("⚠️ No products to sync.");
            process.exit(0);
        }

        // Format data for Algolia
        const records = products.map(doc => ({
            objectID: doc._id.toString(),
            name: doc.name,
            description: doc.description,
            price: doc.price,
            category: doc.category,
            image: doc.images?.[0] || '',
            rating: doc.averageRating || 0,
            _geoloc: doc.location ? { 
                lat: doc.location.coordinates[1], 
                lng: doc.location.coordinates[0] 
            } : null
        }));

        // Send to Algolia (v5 Syntax)
        await client.saveObjects({ 
            indexName: 'products', 
            objects: records 
        });

        console.log("🎉 Success! All products synced. Refresh your Algolia Dashboard.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Sync Failed:", error);
        process.exit(1);
    }
}

sync();