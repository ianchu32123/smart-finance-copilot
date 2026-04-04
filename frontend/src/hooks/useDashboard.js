import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions, addTransactionViaAI, addLocalTransaction } from '../store/transactionSlice';
import { logout } from '../store/authSlice';
import toast from 'react-hot-toast';

export function useDashboard() {
  const dispatch = useDispatch();
  
  const { userId, isGuest } = useSelector((state) => state.auth);
  const { data: transactions, status } = useSelector((state) => state.transactions);
  
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. 取得資料
  useEffect(() => {
    if (status === 'idle' && !isGuest) {
      dispatch(fetchTransactions(userId));
    }
  }, [status, dispatch, userId, isGuest]);

  // 2. 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setIsSubmitting(true);
    
    if (isGuest) {
      // 💡 幫你修正了隨機日期沒有存進 mockTx 的小 Bug
      const randomDaysAgo = Math.floor(Math.random() * 5);
      const d = new Date();
      d.setDate(d.getDate() - randomDaysAgo);
      const mockDate = d.toISOString().split('T')[0];

      const mockTx = {
        id: crypto.randomUUID(),
        description: inputText || '訪客測試項目',
        amount: Math.floor(Math.random() * 500) + 50,
        transaction_date: mockDate, 
        is_ai_parsed: true,
      };
      
      dispatch(addLocalTransaction(mockTx));
      toast.success('訪客記帳成功！(暫存於本機不寫入資料庫)');
      setInputText('');
      setIsSubmitting(false);
      return;
    }

    try {
      const promise = dispatch(addTransactionViaAI({ user_id: userId, text: inputText })).unwrap();
      await toast.promise(promise, {
        loading: 'AI 腦力激盪中... 🤖',
        success: '記帳成功！已安全存入資料庫 🔒',
        error: '記帳失敗，請檢查網路連線 ❌',
      });
      setInputText('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. 處理登出
  const handleLogout = () => {
    dispatch(logout());
    toast('已登出，下次見！', { icon: '👋' });
  };

  // 4. 資料運算 (總額、圓餅圖、折線圖)
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  const pieChartData = Object.values(
    transactions.reduce((acc, tx) => {
      const name = tx.description || '其他';
      if (!acc[name]) acc[name] = { name, value: 0 };
      acc[name].value += tx.amount;
      return acc;
    }, {})
  ).sort((a, b) => b.value - a.value);

  const lineChartData = Object.values(
    transactions.reduce((acc, tx) => {
      const date = tx.transaction_date || '未知日期';
      if (!acc[date]) acc[date] = { date, amount: 0 };
      acc[date].amount += tx.amount;
      return acc;
    }, {})
  ).sort((a, b) => new Date(a.date) - new Date(b.date));

  // 把 UI 需要用到的「狀態與方法」通通打包回傳
  return {
    isGuest,
    transactions,
    status,
    inputText,
    setInputText,
    isSubmitting,
    handleSubmit,
    handleLogout,
    totalAmount,
    pieChartData,
    lineChartData
  };
}