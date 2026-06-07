import { auth } from "@/auth";
import connectDb from "@/lib/db";
import HeroSlide from "@/app/models/heroSlide.model";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: Fetch sorted by Order
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get("mode") || "grocery";
        await connectDb();
        const slides = await HeroSlide.find({ mode }).sort({ order: 1 }); 
        return NextResponse.json({ success: true, slides });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST: Create new slide
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        await connectDb();

        // IMPROVED: Find the highest existing order number + 1
        // This prevents duplicates if gaps exist (e.g., if you have orders 0, 5, 7)
        const lastSlide = await HeroSlide.findOne({ mode: body.mode }).sort({ order: -1 });
        const newOrder = (lastSlide && lastSlide.order !== undefined) ? lastSlide.order + 1 : 0;

        const newSlide = await HeroSlide.create({ ...body, order: newOrder });
        
        return NextResponse.json({ success: true, slide: newSlide });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// PUT: Reorder Slides (Robust Self-Healing)
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { id, direction, mode } = await req.json(); 
        await connectDb();

        // 1. Fetch ALL slides for this mode, sorted by current order
        const slides = await HeroSlide.find({ mode }).sort({ order: 1 });

        // 2. Find array index of the slide to move
        const currentIndex = slides.findIndex((s: any) => s._id.toString() === id);
        if (currentIndex === -1) return NextResponse.json({ message: "Slide not found" }, { status: 404 });

        // 3. Calculate new index
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        // 4. Boundary check
        if (newIndex < 0 || newIndex >= slides.length) {
            return NextResponse.json({ success: false, message: "Cannot move further" });
        }

        // 5. Swap in memory
        const temp = slides[currentIndex];
        slides[currentIndex] = slides[newIndex];
        slides[newIndex] = temp;

        // 6. Bulk Write: Reset ALL orders to 0, 1, 2... based on new array order
        // This fixes any gaps or duplicates automatically (Self-Healing)
        const bulkOps = slides.map((slide: any, index: number) => ({
            updateOne: {
                filter: { _id: slide._id },
                update: { $set: { order: index } }
            }
        }));

        if (bulkOps.length > 0) {
            await HeroSlide.bulkWrite(bulkOps);
        }

        return NextResponse.json({ success: true, message: "Reordered successfully" });

    } catch (error: any) {
        console.error("Reorder Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE: Remove Slide
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        
        await connectDb();
        await HeroSlide.findByIdAndDelete(id);
        
        return NextResponse.json({ success: true, message: "Deleted" });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}