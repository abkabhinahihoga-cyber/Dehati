import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Order from "@/app/models/order.model";
import Grocery from "@/app/models/grocery.model";
import Hub from "@/app/models/hub.model";
import User from "@/app/models/user.model";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    
    if (session?.user?.role !== "hub") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { customerId, items, paymentMethod, deliveryType, addressData } = await req.json();

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 });
    }

    // Verify Customer
    const customer = await User.findById(customerId);
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    // Verify Hub
    const hub = await Hub.findOne({ managerId: session.user.id });
    if (!hub) {
      return NextResponse.json({ success: false, error: "Hub not found" }, { status: 404 });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Verify Stock and Calculate Total
    for (const item of items) {
      let grocery = await Grocery.findById(item.groceryId);
      
      // If product is not found in Grocery collection, check if it's a Hub GST Master Product
      if (!grocery) {
        const MasterProduct = (await import("@/app/models/masterProduct.model")).default;
        const masterProduct = await MasterProduct.findOne({ _id: item.groceryId, isHubProduct: true });
        if (masterProduct) {
          // Resolve or create a Hub's local grocery tracking document for this master product if needed,
          // or construct a mock grocery item to let the order process.
          // Let's create an active grocery item for the hub to manage stock / tracking
          grocery = await Grocery.findOne({ masterProductId: masterProduct._id, seller: session.user.id });
          if (!grocery) {
            grocery = await Grocery.create({
              name: masterProduct.name,
              price: masterProduct.retailPrice || 0,
              retailPrice: masterProduct.retailPrice || 0,
              wholesalePrice: masterProduct.wholesalePrice || 0,
              category: masterProduct.category,
              unit: masterProduct.unit,
              stock: 9999, // global GST hub products default to high stock
              images: masterProduct.image ? [masterProduct.image] : [],
              seller: session.user.id,
              masterProductId: masterProduct._id,
              status: 'active',
              productType: 'grocery',
              location: {
                type: "Point",
                coordinates: hub.location.coordinates
              }
            });
          }
        }
      }

      if (!grocery) {
        return NextResponse.json({ success: false, error: `Product not found: ${item.groceryId}` }, { status: 404 });
      }

      // Check stock (except for GST products which have high stock)
      if (grocery.masterProductId) {
        // GST products have virtually infinite stock or are supplied as needed
        if (grocery.stock < item.quantity) {
          grocery.stock = 9999;
        }
      } else if (grocery.stock < item.quantity) {
        return NextResponse.json({ success: false, error: `Insufficient stock for ${grocery.name}` }, { status: 400 });
      }

      totalAmount += grocery.price * item.quantity;
      orderItems.push({
        product: grocery._id,
        name: grocery.name,
        price: grocery.price,
        unit: grocery.unit,
        images: grocery.images,
        quantity: item.quantity,
        seller: grocery.seller,
      });

      // Deduct stock (except for GST products that stay high)
      if (!grocery.masterProductId) {
        grocery.stock -= item.quantity;
        await grocery.save();
      }
    }

    // Create Order
    const order = await Order.create({
      user: customer._id,
      items: orderItems,
      totalAmount,
      paymentMethod: paymentMethod || "cod",
      isPaid: paymentMethod !== "cod",
      status: "delivered", // POS means it's already fulfilled
      deliveryType: deliveryType || "hub-pickup",
      connectedHub: hub._id,
      address: addressData || {
        fullName: customer.name,
        mobile: customer.mobile,
        fullAddress: "POS Offline Sale",
        latitude: hub.location.coordinates[1],
        longitude: hub.location.coordinates[0],
      },
    });

    return NextResponse.json({ success: true, message: "Order placed successfully", orderId: order._id });
  } catch (error: any) {
    console.error("POS API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
