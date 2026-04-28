import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api';

// 定義非同步的 API 請求
export const fetchTransactions = createAsyncThunk(
  'transactions/fetch',
  async (userId) => {
    const response = await api.get(`/api/transactions/${userId}`);
    return response.data;
  }
);

export const deleteTransaction = createAsyncThunk(
  'transactions/delete',
  async (transactionId) => {
    await api.delete(`/api/transactions/${transactionId}`);
    return transactionId; // 回傳 ID 讓 reducer 知道要刪掉哪筆
  }
);

// ... 原本的 fetchTransactions 保持不動 ...

// 新增：處理 AI 記帳的 POST 請求
export const addTransactionViaAI = createAsyncThunk(
  'transactions/addViaAI',
  async (payload, { dispatch }) => {
    // 1. 打 API 將文字送給後端
    const response = await api.post('/api/transactions/ai', payload);
    
    // 2. 寫入成功後，立刻重新觸發 fetchTransactions 撈取最新資料！
    dispatch(fetchTransactions(payload.user_id));
    
    return response.data;
  }
);

// ... 下方的 createSlice 保持不動 ...

const transactionSlice = createSlice({
  name: 'transactions',
  initialState: {
    data: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  },
  reducers: {// 📍 新增：訪客專用，直接把資料推進前端狀態
    addLocalTransaction: (state, action) => {
      state.data.unshift(action.payload); // 加到列表最前面
    },
    removeLocalTransaction: (state, action) => { 
    state.data = state.data.filter(tx => tx.id !== action.payload); // 📍 新增這行
  },
    // 📍 新增：登出時用來清空畫面的資料
    clearTransactions: (state) => {
      state.data = [];
      state.status = 'idle';
    }},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload; // 把後端回傳的資料存進 state
      })
      .addCase(fetchTransactions.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
    state.data = state.data.filter(tx => tx.id !== action.payload);
  });
  },
});
export const { addLocalTransaction, clearTransactions,removeLocalTransaction} = transactionSlice.actions;
export default transactionSlice.reducer;