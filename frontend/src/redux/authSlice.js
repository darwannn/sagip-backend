import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  newContactNumber: null,
  newEmail: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    login(state, action) {
      /* 
            console.log('Payload:', action.payload); */
      localStorage.clear();
      state.user = action.payload.user;
      state.token = action.payload.token;
      /*   console.log('User:', state.user);
  console.log('Token:', state.token); */
    },
    register(state, action) {
      localStorage.clear();
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    contactVerification(state, action) {
      localStorage.clear();
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    forgotPassword(state, action) {
      localStorage.clear();
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    newPassword(state, action) {
      localStorage.clear();
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.clear();
    },

    newContactNumber(state, action) {
      state.newContactNumber = action.payload;
    },
    newEmail(state, action) {
      state.newEmail = action.payload;
    },
  },
});

export const {
  register,
  login,
  logout,
  contactVerification,
  forgotPassword,
  newPassword,
  newContactNumber,
  newEmail,
} = authSlice.actions;

export default authSlice.reducer;
