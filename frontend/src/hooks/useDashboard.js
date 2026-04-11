import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions, addTransactionViaAI, addLocalTransaction, deleteTransaction, removeLocalTransaction } from '../store/transactionSlice';
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
        transaction_type: 'expense' // 確保訪客假資料也有 type
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

  // 4. 資料運算 (收支結算)
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach(tx => {
    if (!tx.transaction_type || tx.transaction_type === 'expense') {
      totalExpense += tx.amount;
    } else {
      totalIncome += tx.amount;
    }
  });
  const balance = totalIncome - totalExpense;

  // 5. 刪除功能
  const handleDelete = async (id) => {
    if (window.confirm("確定要刪除這筆交易嗎？")) {
      if (isGuest) {
        dispatch(removeLocalTransaction(id));
        toast.success("已刪除暫存紀錄");
        return;
      }
      try {
        await dispatch(deleteTransaction(id)).unwrap();
        toast.success("刪除成功！");
      } catch (err) {
        toast.error("刪除失敗");
      }
    }
  };
  // 🌟 1. 新增：預算狀態 (從 localStorage 讀取，預設 10000)
  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem(`budget_${userId}`);
    return saved ? Number(saved) : 10000;
  });

  // 🌟 2. 新增：修改預算的函數
  const handleEditBudget = () => {
    const newBudget = window.prompt("請輸入本月總預算：", budget);
    if (newBudget && !isNaN(newBudget) && Number(newBudget) > 0) {
      setBudget(Number(newBudget));
      localStorage.setItem(`budget_${userId}`, newBudget);
      toast.success("預算更新成功！");
    }
  };
  // 🌟 3. 新增：計算預算進度百分比與顏色
  const budgetPercent = budget > 0 ? Math.min((totalExpense / budget) * 100, 100) : 0;
  let progressColor = 'bg-emerald-500';
  if (totalExpense >= budget) progressColor = 'bg-rose-500'; // 超過 100% 變紅
  else if (totalExpense >= budget * 0.8) progressColor = 'bg-amber-500'; // 超過 80% 變橘

  // 6. 圖表資料 (優化：只統計支出)
  // 🌟 4. 修改：圓餅圖改成用 category 分類，而不是 description！
  const pieChartData = Object.values(
    transactions
      .filter(tx => !tx.transaction_type || tx.transaction_type === 'expense')
      .reduce((acc, tx) => {
        const categoryName = tx.category_name || '其他'; // 📍 改用 tx.category
        if (!acc[categoryName]) acc[categoryName] = { name: categoryName, value: 0 };
        acc[categoryName].value += tx.amount;
        return acc;
      }, {})
  ).sort((a, b) => b.value - a.value);

  const lineChartData = Object.values(
    transactions.reduce((acc, tx) => {
      const date = tx.transaction_date || '未知日期';
      if (!acc[date]) acc[date] = { date, amount: 0 };
      
      // 折線圖也只計算每日「支出」趨勢
      if (!tx.transaction_type || tx.transaction_type === 'expense') {
        acc[date].amount += tx.amount;
      }
      return acc;
    }, {})
  ).sort((a, b) => new Date(a.date) - new Date(b.date));

  // 把 UI 需要用到的「狀態與方法」通通打包回傳
  return {
    isGuest, transactions, status, inputText, setInputText,
    isSubmitting, handleSubmit, handleLogout,
    totalIncome, totalExpense, balance, handleDelete,
    pieChartData, lineChartData,budget, handleEditBudget, budgetPercent, progressColor
  };
} // 📍 剛剛就是遺漏了這個至關重要的大括號！