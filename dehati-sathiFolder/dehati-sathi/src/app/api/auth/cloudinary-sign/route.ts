import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/auth";

// 1. Configure Cloudinary with Server-Side Keys
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    try {
        // 2. Security Check: Only logged-in sellers can upload
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { paramsToSign } = body;

        // 3. Generate Signature
        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET as string
        );

        // 4. Return Signature AND Keys (So frontend can use them)
        return NextResponse.json({ 
            signature,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME
        });

    } catch (error: any) {
        console.error("Signing Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}