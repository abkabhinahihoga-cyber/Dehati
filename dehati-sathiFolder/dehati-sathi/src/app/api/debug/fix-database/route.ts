import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Grocery from "@/app/models/grocery.model";

export const dynamic = 'force-dynamic'; // Defaults to auto, force dynamic to ensure it runs

export async function GET() {
  try {
    await dbConnect();

    // 1. Create the Geospatial Index (Crucial for $geoNear queries)
    // This allows MongoDB to search by distance
    await Grocery.collection.createIndex({ location: "2dsphere" });

    // 2. Fix existing products that are missing the 'location' field
    // We set a default location (New Delhi) so they don't break the app
    const result = await Grocery.updateMany(
      { location: { $exists: false } },
      { 
        $set: { 
          location: { 
            type: "Point", 
            coordinates: [77.2090, 28.6139] // [Longitude, Latitude]
          } 
        } 
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: "Database successfully patched!",
      details: `Updated ${result.modifiedCount} products with default location.`
    });

  } catch (error: any) {
    console.error("Database Fix Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}