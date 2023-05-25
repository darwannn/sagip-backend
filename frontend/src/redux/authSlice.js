import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    user: null,
    token: null,
    contactVericiationUser: null,
}

export const authSlice = createSlice({
    name: 'auth',
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
            localStorage.clear()
            state.user = action.payload.user
            state.token = action.payload.token
        },
        contactVerification(state, action) {
            localStorage.clear()
            state.user = action.payload.user
            state.token = action.payload.token
        },
        forgotPassword(state, action) {
            localStorage.clear()
            state.user = action.payload.user
            state.token = action.payload.token
        },
        logout(state) {
            state.user = null
            state.token = null
            localStorage.clear()
        }
    }
})

export const { register, login, logout,contactVerification,forgotPassword } = authSlice.actions

export default authSlice.reducer


// variables and function that change the variables, and they are both available in the all components