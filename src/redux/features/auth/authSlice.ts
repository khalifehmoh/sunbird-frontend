import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState } from './authTypes';

const initialState: AuthState = {
  accessToken: '',
  refreshToken: '',
  tokenType: '',
  accessTokenExpiresIn: 0,
  refreshTokenExpiresIn: 0,
  username: '',
  email: '',
  role: ''
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<AuthState>) => {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.tokenType = action.payload.tokenType;
            state.accessTokenExpiresIn = action.payload.accessTokenExpiresIn;
            state.refreshTokenExpiresIn = action.payload.refreshTokenExpiresIn;
            state.username = action.payload.username;
            state.email = action.payload.email;
            state.role = action.payload.role;
        }
    }
});

export default authSlice.reducer;

export const { setUser } = authSlice.actions;