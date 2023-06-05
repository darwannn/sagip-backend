import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  serverResponse: null,
};

export const serverResponseSlice = createSlice({
  name: "serverResponse",
  initialState: initialState,
  reducers: {
    setServerResponse(state, action) {
      state.serverResponse = action.payload;
    },
    getServerResponse(state, action) {
      state.serverResponse = "";
    },
  },
});

export const { setServerResponse, getServerResponse } =
  serverResponseSlice.actions;

export default serverResponseSlice.reducer;

// variables and function that change the variables, and they are both available in the all components
