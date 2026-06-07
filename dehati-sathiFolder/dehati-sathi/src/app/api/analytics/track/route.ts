import connectDb from "@/lib/db";
import Interaction from "@/app/models/interaction.model";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ success: true }); // Ignore guests

        const { productId, category, type } = await req.json();
        await connectDb();

        const weights: any = { view: 1, click: 2, cart: 5, purchase: 10 };

        // Fire and forget (don't await if performance is critical, but safer to await in serverless)
        await Interaction.create({
            user: session.user.id,
            product: productId,
            category,
            type,
            score: weights[type] || 1
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}