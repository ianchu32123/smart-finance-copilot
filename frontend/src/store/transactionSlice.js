import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 定義非同步的 API 請求
export const fetchTransactions = createAsyncThunk(
  'transactions/fetch',
  async (userId) => {
    const response = await axios.get(`http://127.0.0.1:8000/api/transactions/${userId}`);
    return response.data;
  }
);

// ... 原本的 fetchTransactions 保持不動 ...

// 新增：處理 AI 記帳的 POST 請求
export const addTransactionViaAI = createAsyncThunk(
  'transactions/addViaAI',
  async (payload, { dispatch }) => {
    // 1. 打 API 將文字送給後端
    const response = await axios.post('http://127.0.0.1:8000/api/transactions/ai', payload);
    
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
  reducers: {},
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
      });
  },
});

export default transactionSlice.reducer;