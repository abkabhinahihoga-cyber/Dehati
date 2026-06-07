import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Hub from "@/app/models/hub.model";

export async function POST(req: Request) {
    try {
        await connectDb();
        const body = await req.json();

        // FIXED: Changed '-' to '='
        const newHub = await Hub.create({
            name: body.name,
            location: {
                type: 'Point',
                coordinates: [body.lng, body.lat],
                address: body.address
            }
        });

        return NextResponse.json({ success: true, hub: newHub });
    } catch (error: any) { // FIXED: added ': any' to handle type error
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}