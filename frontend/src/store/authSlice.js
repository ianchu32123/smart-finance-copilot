import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,       // JWT 通行證
    userId: null,      // 使用者 ID
    isGuest: false,    // 是否為訪客模式
    isAuthenticated: false, // 是否已登入
  },
  reducers: {
    // 正式會員登入成功
    loginSuccess: (state, action) => {
      state.token = action.payload.access_token;
      state.userId = action.payload.user_id;
      state.isGuest = false;
      state.isAuthenticated = true;
    },
    // 訪客登入
    guestLogin: (state) => {
      state.token = null;
      state.userId = 'guest-user';
      state.isGuest = true;
      state.isAuthenticated = true;
    },
    // 登出
    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.isGuest = false;
      state.isAuthenticated = false;
    },
  },
});

export const { loginSuccess, guestLogin, logout } = authSlice.actions;
export default authSlice.reducer;