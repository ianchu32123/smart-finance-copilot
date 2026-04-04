import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loginSuccess, guestLogin } from '../store/authSlice';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 處理正式會員登入
const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // 🌟 使用 toast.promise 來處理非同步的載入動畫！
    const loginPromise = axios.post('http://127.0.0.1:8000/api/users/login', { email, password });

    toast.promise(loginPromise, {
      loading: '登入中...',
      success: '登入成功！歡迎回來 👋',
      error: '登入失敗：信箱或密碼錯誤 ❌',
    });

    try {
      const response = await loginPromise;
      dispatch(loginSuccess(response.data));
      navigate('/');
    } catch (err) {
      // 錯誤已經由 toast 處理，這裡只需捕捉避免 crash
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    dispatch(guestLogin());
    toast.success('已進入訪客模式 👻'); // 📍 訪客通知
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-slate-800 mb-8">AI 智能記帳</h1>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">電子郵件</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="輸入您的 Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密碼</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="輸入密碼"
            />
          </div>
          
          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLoading ? '登入中...' : '會員登入'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <button 
            onClick={handleGuestLogin}
            className="w-full bg-slate-100 text-slate-700 font-medium py-3 rounded-lg hover:bg-slate-200 transition-colors"
          >
            以訪客身分繼續 (資料不存檔)
          </button>
        </div>
      </div>
    </div>
  );
}