import connectDb from "@/lib/db";
import Grocery from "@/app/models/grocery.model";
import Hub from "@/app/models/hub.model";
import Settings from "@/app/models/settings.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);  
    const dLon = (lon2 - lon1) * (Math.PI / 180); 
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; 
}

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const { items, address, deliveryType, connectedHubId } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ message: "Cart is empty" }, { status: 400 });
        }

        let nearestHubObj = null;
        if (connectedHubId) {
            nearestHubObj = await Hub.findById(connectedHubId);
        } else if (address?.latitude && address?.longitude) {
            nearestHubObj = await Hub.findOne({
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [address.longitude, address.latitude] },
                        $maxDistance: 50000
                    }
                }
            });
        }

        let settings = await Settings.findOne();
        if (!settings) {
            settings = {
                platformFeeTiers: [
                    { minAmount: 0, maxAmount: 50, fee: 8 },
                    { minAmount: 50, maxAmount: 100, fee: 6 },
                    { minAmount: 100, maxAmount: 300, fee: 5 },
                    { minAmount: 300, maxAmount: 500, fee: 8 },
                    { minAmount: 500, maxAmount: 999999, fee: 10 },
                ],
                gstPercentage: 5,
                baseDeliveryFee: 5,
                deliveryFeePerKm: 2,
                hubCoverageRadiusKm: 3.5
            };
        }

        let backendSubTotal = 0;
        let sellerSubTotal = 0;

        for (const item of items) {
            const product = await Grocery.findById(item.product);
            if (!product) continue;
            const activePrice = item.quantity >= (product.retailLimit || 3) ? product.wholesalePrice : product.retailPrice;
            const itemTotal = activePrice * item.quantity;
            backendSubTotal += itemTotal;

            const sellerObj = await User.findById(product.seller);
            if (sellerObj?.role !== 'hub') {
                sellerSubTotal += itemTotal;
            }
        }

        let platformFee = 0;
        if (deliveryType !== 'farm-pickup' && sellerSubTotal > 0) {
            const tier = settings.platformFeeTiers.find(t => sellerSubTotal >= t.minAmount && sellerSubTotal <= t.maxAmount);
            if (tier) platformFee = tier.fee;
        }

        let deliveryFee = 0;
        if (deliveryType === 'home-delivery') {
            if (nearestHubObj && address?.latitude && address?.longitude) {
                const distanceKm = getDistanceFromLatLonInKm(
                    address.latitude, address.longitude, 
                    nearestHubObj.location.coordinates[1], nearestHubObj.location.coordinates[0]
                );
                if (distanceKm > settings.hubCoverageRadiusKm) {
                    return NextResponse.json({ 
                        success: false, 
                        isOutOfRadius: true, 
                        message: `Outside delivery radius of ${settings.hubCoverageRadiusKm}km.` 
                    });
                }
                deliveryFee = settings.baseDeliveryFee + (Math.ceil(distanceKm) * settings.deliveryFeePerKm);
            }
        }

        const gstAmount = deliveryType === 'farm-pickup' ? 0 : (backendSubTotal * settings.gstPercentage) / 100;
        
        let finalTotal = backendSubTotal + platformFee + deliveryFee + gstAmount;

        return NextResponse.json({ 
            success: true, 
            preview: {
                subTotal: backendSubTotal,
                platformFee,
                deliveryFee,
                gstAmount,
                finalTotal
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
