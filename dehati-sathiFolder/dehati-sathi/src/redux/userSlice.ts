import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// 1. Remove mongoose import. Use simple string for ID.
interface IUser {
    _id: string;
    name: string;
    email: string;
    mobile?: string;
    role: "user" | "deliveryBoy" | "seller" | "admin" | "hub";
    image?: string;
    walletBalance?: number;
}

interface IUserSlice {
    userData: IUser | null;
}

const initialState: IUserSlice = {
    userData: null
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        // 2. Added Type safety for action
        setUserData: (state, action: PayloadAction<IUser | null>) => {
            state.userData = action.payload;
        }
    }
});

export const { setUserData } = userSlice.actions;
export default userSlice.reducer;
