import React from 'react'
import connectDb from "@/lib/db";
import Grocery from "@/app/models/grocery.model";
import User from "@/app/models/user.model"; 
import ProductView from '@/components/ProductView'; 
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
    params: Promise<{ id: string }>
}

async function ProductDetails(props: Props) {
    const params = await props.params;
    await connectDb();

    // 👇 CRITICAL FIX: Explicitly pass 'model: User' to bypass the MissingSchemaError
    const productRaw = await Grocery.findById(params.id)
        .populate({ 
            path: "seller", 
            model: User, // <--- THIS LINE STOPS THE CRASH
            select: "name role sellerDetails mobile" 
        })
        .lean();
    
    if (!productRaw) return <div className="p-10 text-center">Product Not Found</div>;

    const product = JSON.parse(JSON.stringify(productRaw));

    // 2. Fetch Similar Products
    const similarRaw = await Grocery.find({
        category: product.category,
        _id: { $ne: product._id }
    })
    .limit(4)
    .populate({ 
        path: "seller", 
        model: User, // <--- Apply fix here too
        select: "name role mobile" 
    })
    .lean();

    const similarProducts = JSON.parse(JSON.stringify(similarRaw));

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white shadow-sm p-4 sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2 text-gray-600 font-medium max-w-6xl mx-auto">
                    <ArrowLeft size={20} /> Back to Shop
                </Link>
            </div>

            <div className="max-w-6xl mx-auto px-4 mt-6">
                <ProductView product={product} similarProducts={similarProducts} />
            </div>
        </div>
    )
}

export default ProductDetails;