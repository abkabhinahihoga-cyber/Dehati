import connectDb from "@/lib/db";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const body = await req.json();
        
        // Destructure possible incoming fields
        const { userId, latitude, longitude, location } = body;

        let coords = [0, 0];

        // 1. Handle Direct Lat/Lng (sent by GeoUpdater Client)
        if (latitude !== undefined && longitude !== undefined) {
            coords = [longitude, latitude]; // GeoJSON is [Lng, Lat]
        } 
        // 2. Handle Location Object (sent by Socket Server)
        else if (location && location.coordinates) {
            coords = location.coordinates;
        } 
        else {
            return NextResponse.json({ message: "Missing coordinates" }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ message: "Missing userId" }, { status: 400 });
        }

        // Update the user's location
        const user = await User.findByIdAndUpdate(userId, {
            location: {
                type: "Point",
                coordinates: coords
            }
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Location updated", success: true });

    } catch (error: any) {
        console.error("Location API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}