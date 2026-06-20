import React from 'react'
import connectDb from "@/lib/db";
import Grocery from "@/app/models/grocery.model";
import User from "@/app/models/user.model"; 
import Hub from "@/app/models/hub.model";
import ProductView from '@/components/ProductView'; 
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
    params: Promise<{ id: string, locale: string }>
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
    
    if (!productRaw) return <div className="p-10 text-center">{isHindi ? 'उत्पाद नहीं मिला' : 'Product Not Found'}</div>;

    const product = JSON.parse(JSON.stringify(productRaw));

    // 3. Look up hub manager contact for WhatsApp/Call order
    let hubManager: { name: string; mobile: string } | null = null;
    try {
        // Find hub from seller's connectedHub
        const sellerUser = await User.findById(product.seller?._id || product.seller).select('connectedHub').lean();
        if (sellerUser?.connectedHub) {
            const hub = await Hub.findById(sellerUser.connectedHub).populate({ path: 'managerId', model: User, select: 'name mobile' }).lean();
            if (hub?.managerId && typeof hub.managerId === 'object') {
                const mgr = hub.managerId as any;
                hubManager = { name: mgr.name || 'Hub Manager', mobile: mgr.mobile || '' };
            }
        }
        // Fallback: if seller IS a hub manager (role = hub), use them directly
        if (!hubManager && product.seller?.role === 'hub' && product.seller?.mobile) {
            hubManager = { name: product.seller.name || 'Hub Manager', mobile: product.seller.mobile };
        }
    } catch (e) {
        console.error('Hub manager lookup failed:', e);
    }

    // 4. Fetch Similar Products
    const similarRaw = await Grocery.find({
        category: product.category,
        _id: { $ne: product._id }
    })
    .limit(4)
    .populate({ 
        path: "seller", 
        model: User,
        select: "name role mobile" 
    })
    .lean();

    const similarProducts = JSON.parse(JSON.stringify(similarRaw));

    const isHindi = params.locale === 'hi';
    const t = {
        backToShop: isHindi ? 'दुकान पर वापस जाएं' : 'Back to Shop'
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white shadow-sm p-4 sticky top-0 z-50">
                <Link href={isHindi ? "/hi" : "/en"} className="flex items-center gap-2 text-gray-600 font-medium max-w-6xl mx-auto">
                    <ArrowLeft size={20} /> {t.backToShop}
                </Link>
            </div>

            <div className="max-w-6xl mx-auto px-4 mt-6">
                <ProductView product={product} similarProducts={similarProducts} hubManager={hubManager} />
            </div>
        </div>
    )
}

export default ProductDetails;