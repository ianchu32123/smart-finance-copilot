import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loginSuccess, guestLogin } from '../store/authSlice';
import toast from 'react-hot-toast';

export default function Login() {
  // 🌟 新增：控制目前是「登入」還是「註冊」模式
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [username, setUsername] = useState(''); // 註冊需要的欄位
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (isLoginMode) {
      // 🟢 處理登入邏輯
      // 🟢 處理登入邏輯 (改回 FastAPI 預期的 JSON 格式！)
      const loginPromise = axios.post('http://127.0.0.1:8000/api/users/login', { 
        email, 
        password 
      });

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
        console.error(err);
      } finally {
        setIsLoading(false);
      }

    } else {
      // 🔵 處理註冊邏輯
      const registerPromise = axios.post('http://127.0.0.1:8000/api/users/register', { 
        username, 
        email, 
        password 
      });

      toast.promise(registerPromise, {
        loading: '建立帳號中...',
        success: '註冊成功！已為您自動登入 🎉',
        // 抓取後端 HTTPException 丟出來的詳細錯誤 (例如 Email 已被註冊)
        error: (err) => `註冊失敗：${err.response?.data?.detail || '請檢查輸入資料'} ❌`,
      });

      try {
        const response = await registerPromise;
        // 註冊 API 成功也會回傳 token，所以我們直接當作登入成功
        dispatch(loginSuccess(response.data));
        navigate('/');
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGuestLogin = () => {
    dispatch(guestLogin());
    toast.success('已進入訪客模式 👻');
    navigate('/');
  };

  // 🌟 切換模式時，順便把輸入框清空
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">AI 智能記帳</h1>
        <p className="text-center text-slate-500 mb-8">
          {isLoginMode ? '歡迎回來，請登入您的帳號' : '建立新帳號，開始智能理財'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 只有在「註冊模式」才會出現使用者名稱輸入框 */}
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">使用者名稱</label>
              <input 
                type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="您想怎麼被稱呼？"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">電子郵件</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              placeholder="輸入您的 Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密碼</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              placeholder={isLoginMode ? "輸入密碼" : "設定至少 6 碼密碼"}
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 mt-2"
          >
            {isLoading ? '處理中...' : (isLoginMode ? '登入' : '註冊帳號')}
          </button>
        </form>

        {/* 🌟 切換登入/註冊模式的按鈕 */}
        <div className="mt-6 text-center text-sm text-slate-600">
          {isLoginMode ? "還沒有帳號嗎？ " : "已經有帳號了？ "}
          <button onClick={toggleMode} className="text-blue-600 font-semibold hover:underline">
            {isLoginMode ? "立即註冊" : "返回登入"}
          </button>
        </div>

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