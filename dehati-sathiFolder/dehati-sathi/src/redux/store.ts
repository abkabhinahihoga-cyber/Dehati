import { configureStore } from "@reduxjs/toolkit"
import userSlice from "./userSlice"
import cartSlice from "./cartSlice"
import modeReducer from "./modeSlice" 
import locationReducer from "./locationSlice" // <--- Import

export const store=configureStore({
    reducer:{
        user:userSlice,
        cart:cartSlice,
        mode:modeReducer,
        location: locationReducer // <--- Add here
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch