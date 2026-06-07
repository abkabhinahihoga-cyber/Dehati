import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  mode: 'grocery', // 'grocery' or 'student'
}

const modeSlice = createSlice({
  name: 'mode',
  initialState,
  reducers: {
    toggleMode: (state) => {
      state.mode = state.mode === 'grocery' ? 'student' : 'grocery';
    },
  },
})

export const { toggleMode } = modeSlice.actions
export default modeSlice.reducer