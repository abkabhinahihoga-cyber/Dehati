import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface IGrocery {
  _id: string;
  name: string;
  category: string;
  price: number;          // Active price
  wholesalePrice: number;
  retailPrice: number;
  unit: string;
  quantity: number;
  images: string[];
  stock: number;
  sellerType: 'hub' | 'seller'; 
  
  // 👇 CRITICAL FIX: Add this line so TypeScript knows 'seller' exists
  seller: any; 
  
  // Optional location if you use it for distance calc
  location?: {
      type: string;
      coordinates: number[];
  };

  createdAt?: string;
  updatedAt?: string;
}

interface ICartSlice {
  cartData: IGrocery[];
  subTotal: number;
  deliveryFee: number;
  platformFee: number;
  finalTotal: number;
  deliveryType: 'hub-pickup' | 'farm-pickup' | 'home-delivery';
  distanceToHub: number; 
}

const initialState: ICartSlice = {
  cartData: [],
  subTotal: 0,
  deliveryFee: 0,
  platformFee: 0,
  finalTotal: 0,
  deliveryType: 'hub-pickup', 
  distanceToHub: 0, 
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<IGrocery>) => {
      const existingItem = state.cartData.find(i => i._id === action.payload._id);
      
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
        if (existingItem.quantity >= 3) {
            existingItem.price = existingItem.wholesalePrice;
        } else {
            existingItem.price = existingItem.retailPrice;
        }
      } else {
        const newItem = action.payload;
        if (newItem.quantity >= 3) {
            newItem.price = newItem.wholesalePrice;
        } else {
            newItem.price = newItem.retailPrice;
        }
        state.cartData.push(newItem);
      }
      cartSlice.caseReducers.calculateTotals(state);
    },

    increaseQuantity: (state, action: PayloadAction<string>) => {
      const item = state.cartData.find((i) => i._id === action.payload);
      if (item) {
        item.quantity += 1;
        if (item.quantity >= 3) {
            item.price = item.wholesalePrice;
        }
      }
      cartSlice.caseReducers.calculateTotals(state);
    },

    decreaseQuantity: (state, action: PayloadAction<string>) => {
      const item = state.cartData.find((i) => i._id === action.payload);
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
          if (item.quantity < 3) {
              item.price = item.retailPrice;
          }
        } else {
          state.cartData = state.cartData.filter((i) => i._id !== action.payload);
        }
      }
      cartSlice.caseReducers.calculateTotals(state);
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cartData = state.cartData.filter((i) => i._id !== action.payload);
      cartSlice.caseReducers.calculateTotals(state);
    },

    setDeliveryType: (state, action: PayloadAction<'hub-pickup' | 'farm-pickup' | 'home-delivery'>) => {
      state.deliveryType = action.payload;
      cartSlice.caseReducers.calculateTotals(state);
    },

    setDistance: (state, action: PayloadAction<number>) => {
        state.distanceToHub = action.payload; 
        cartSlice.caseReducers.calculateTotals(state);
    },

    calculateTotals: (state) => {
      // 1. Calculate Overall Subtotal
      state.subTotal = state.cartData.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

      // 2. Calculate Seller-Only Subtotal (For Platform Fee Logic)
      const sellerSubTotal = state.cartData
        .filter(item => item.sellerType === 'seller')
        .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

      // --- FEE CALCULATION LOGIC ---

      // A. FARM PICKUP: No Fees at all
      if (state.deliveryType === 'farm-pickup') {
        state.deliveryFee = 0;
        state.platformFee = 0;
      } 
      else {
        // B. PLATFORM FEE (Based STRICTLY on 'sellerSubTotal')
        if (sellerSubTotal === 0) {
            state.platformFee = 0;
        } else {
            if (sellerSubTotal < 50) {
                state.platformFee = 8;
            } else if (sellerSubTotal >= 50 && sellerSubTotal < 100) {
                state.platformFee = 6;
            } else if (sellerSubTotal >= 100 && sellerSubTotal < 300) {
                state.platformFee = 5;
            } else if (sellerSubTotal >= 300 && sellerSubTotal < 500) {
                state.platformFee = 8;
            } else {
                state.platformFee = 10;
            }
        }

        // C. DELIVERY FEE
        if (state.deliveryType === 'home-delivery') {
            const meters = state.distanceToHub;
            
            if (meters < 500) {
                state.deliveryFee = 5;
            } else if (meters >= 500 && meters < 1000) {
                state.deliveryFee = 6;
            } else if (meters >= 1000 && meters < 1600) {
                state.deliveryFee = 8;
            } else if (meters >= 1600 && meters < 2200) {
                state.deliveryFee = 9;
            } else if (meters >= 2200 && meters < 3000) {
                state.deliveryFee = 10;
            } else if (meters >= 3000 && meters < 3500) {
                state.deliveryFee = 11;
            } else {
                state.deliveryFee = 12;
            }
        } else {
            state.deliveryFee = 0;
        }
      }

      state.finalTotal = state.subTotal + state.deliveryFee + state.platformFee;
    },
  },
});

export const { addToCart, increaseQuantity, decreaseQuantity, removeFromCart, setDeliveryType, setDistance } = cartSlice.actions;
export default cartSlice.reducer;