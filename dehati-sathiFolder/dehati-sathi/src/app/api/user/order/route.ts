import connectDb from "@/lib/db";
import Order from "@/app/models/order.model";
import Grocery from "@/app/models/grocery.model";
import User from "@/app/models/user.model";
import Hub from "@/app/models/hub.model";
import Settings from "@/app/models/settings.model";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

// Haversine distance formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);  
    const dLon = (lon2 - lon1) * (Math.PI / 180); 
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; // Distance in km
}

export async function POST(req: NextRequest) {
    try {
        await connectDb();

        // ✅ FIX 1: Use session for auth — never trust userId from body
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        const body = await req.json();
        const { items, paymentMethod, address, deliveryType, connectedHubId, walletDiscount } = body;

        // Basic Validation
        if (!items || items.length === 0 || !paymentMethod || !address) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Check User exists
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        if (user.isBlocked) {
            return NextResponse.json({ message: "Your account has been blocked." }, { status: 403 });
        }

        // --- AUTO ASSIGN HUB ---
        let finalHubId = connectedHubId || (session.user as any).connectedHub || null;
        let nearestHubObj = null;

        if (!finalHubId && address.latitude && address.longitude) {
            try {
                const nearestHub = await Hub.findOne({
                    location: {
                        $near: {
                            $geometry: { type: "Point", coordinates: [address.longitude, address.latitude] },
                            $maxDistance: 50000
                        }
                    }
                });
                if (nearestHub) {
                    finalHubId = nearestHub._id;
                    nearestHubObj = nearestHub;
                }
            } catch (err) {
                console.warn("Hub auto-assignment failed:", err);
            }
        } else if (finalHubId) {
            nearestHubObj = await Hub.findById(finalHubId);
        }

        // --- FETCH SETTINGS ---
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

        // --- CALCULATE FEES SECURELY ON BACKEND ---
        let backendSubTotal = 0;
        let sellerSubTotal = 0;

        // ✅ FIX: Stock validation, atomic deduction, and subtotal calculation
        for (const item of items) {
            const product = await Grocery.findById(item.product);
            if (!product) {
                return NextResponse.json({ message: `Product "${item.name}" not found.` }, { status: 404 });
            }
            if (product.stock < item.quantity) {
                return NextResponse.json({ message: `"${item.name}" has only ${product.stock} units in stock.` }, { status: 400 });
            }

            // Determine active price
            const activePrice = item.quantity >= (product.retailLimit || 3) ? product.wholesalePrice : product.retailPrice;
            const itemTotal = activePrice * item.quantity;
            backendSubTotal += itemTotal;

            const sellerObj = await User.findById(product.seller);
            const sellerType = sellerObj?.role === 'hub' ? 'hub' : 'seller';

            if (sellerType === 'seller') {
                sellerSubTotal += itemTotal;
            }
        }

        // Platform Fee logic
        let platformFee = 0;
        if (deliveryType !== 'farm-pickup' && sellerSubTotal > 0) {
            const tier = settings.platformFeeTiers.find(t => sellerSubTotal >= t.minAmount && sellerSubTotal <= t.maxAmount);
            if (tier) platformFee = tier.fee;
        }

        // Delivery Fee logic
        let deliveryFee = 0;
        if (deliveryType === 'home-delivery') {
            if (nearestHubObj && address.latitude && address.longitude) {
                const distanceKm = getDistanceFromLatLonInKm(
                    address.latitude, address.longitude, 
                    nearestHubObj.location.coordinates[1], nearestHubObj.location.coordinates[0]
                );
                
                if (distanceKm > settings.hubCoverageRadiusKm) {
                    return NextResponse.json({ message: `Address is outside our ${settings.hubCoverageRadiusKm}km delivery radius.` }, { status: 400 });
                }
                
                deliveryFee = settings.baseDeliveryFee + (Math.ceil(distanceKm) * settings.deliveryFeePerKm);
            } else {
                return NextResponse.json({ message: "Could not calculate distance to hub." }, { status: 400 });
            }
        }

        // GST Logic
        const gstAmount = deliveryType === 'farm-pickup' ? 0 : (backendSubTotal * settings.gstPercentage) / 100;
        
        let totalAmount = backendSubTotal + platformFee + deliveryFee + gstAmount;

        // Wallet coupon application (₹5 max per order)
        const MAX_WALLET_USE_PER_ORDER = 5;
        let appliedWalletDiscount = 0;

        if (walletDiscount && walletDiscount > 0) {
            if (user.walletBalance < walletDiscount) {
                return NextResponse.json({ message: "Insufficient wallet balance." }, { status: 400 });
            }
            if (walletDiscount > MAX_WALLET_USE_PER_ORDER) {
                return NextResponse.json({ message: `You can only use ₹${MAX_WALLET_USE_PER_ORDER} wallet balance per order.` }, { status: 400 });
            }
            appliedWalletDiscount = walletDiscount;
        }

        const finalAmount = Math.max(0, totalAmount - appliedWalletDiscount);

        // Atomically decrement stock for each item
        for (const item of items) {
            await Grocery.findByIdAndUpdate(
                item.product,
                { $inc: { stock: -item.quantity } }
            );
        }



        const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

        // Create Order
        const newOrder = await Order.create({
            user: userId,
            items,
            paymentMethod: "cod", // Online payments not yet enabled
            isPaid: false,
            totalAmount: finalAmount,
            walletDiscount: appliedWalletDiscount,
            platformFee,
            deliveryFee,
            gstAmount,
            pickupOtp,
            deliveryOtp,
            address,
            deliveryType: deliveryType || 'home-delivery',
            connectedHub: finalHubId,
            trackingLogs: [
                { status: "pending", timestamp: new Date(), user: userId }
            ]
        });

        // ✅ Deduct wallet balance atomically
        if (appliedWalletDiscount > 0) {
            await User.findByIdAndUpdate(userId, {
                $inc: { walletBalance: -appliedWalletDiscount }
            });
        }

        return NextResponse.json({ success: true, order: newOrder }, { status: 201 });

    } catch (error: any) {
        console.error("Order Placement Error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
