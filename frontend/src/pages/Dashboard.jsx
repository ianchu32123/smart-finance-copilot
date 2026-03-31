import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions, addTransactionViaAI } from '../store/transactionSlice';
import { Send } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// 定義圓餅圖的顏色票（清爽的現代色系）
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard() {
  const dispatch = useDispatch();
  const { data: transactions, status } = useSelector((state) => state.transactions);
  
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const USER_ID = "7d9db4a4-ba9a-490c-8f0c-0ebf875d445e"; // ⚠️ 記得換回你的 UUID！

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchTransactions(USER_ID));
    }
  }, [status, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSubmitting(true);
    try {
      await dispatch(addTransactionViaAI({ user_id: USER_ID, text: inputText })).unwrap();
      setInputText('');
    } catch (error) {
      console.error("AI 記帳失敗", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  // 📊 資料處理：將交易紀錄依照「項目 (description)」進行分組加總，餵給圓餅圖
  const chartData = Object.values(
    transactions.reduce((acc, tx) => {
      const name = tx.description || '其他';
      if (!acc[name]) {
        acc[name] = { name, value: 0 };
      }
      acc[name].value += tx.amount;
      return acc;
    }, {})
  ).sort((a, b) => b.value - a.value); // 依金額由大到小排序

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">財務儀表板</h1>

      {/* AI 智能記帳輸入區塊 */}
      <form onSubmit={handleSubmit} className="mb-8 relative max-w-3xl">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="告訴 AI 你今天花了什麼？ (例如：去大潤發買日常用品花了 850)"
          className="w-full pl-6 pr-16 py-4 rounded-full border-2 border-slate-200 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-lg"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !inputText.trim()}
          className="absolute right-3 top-3 bottom-3 aspect-square bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-colors"
        >
          {isSubmitting ? <span className="animate-spin text-xl">⏳</span> : <Send size={20} />}
        </button>
      </form>
      
      {/* 頂部數據卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm font-medium">總花費</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">$ {totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm font-medium">記帳筆數</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">{transactions.length} 筆</p>
        </div>
      </div>

      {/* 🌟 版面升級：左右雙欄設計 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 左欄：花費比例圓餅圖 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-[400px] flex flex-col">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">花費比例分析</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$ ${value}`} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">尚未有足夠的資料繪製圖表</div>
          )}
        </div>

        {/* 右欄：交易紀錄列表區塊 (加上捲動軸限制高度) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-[400px] flex flex-col">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">最近交易紀錄</h2>
          <div className="overflow-y-auto pr-2 flex-1">
            {status === 'loading' && transactions.length === 0 ? (
              <div className="text-slate-400 text-center py-12">資料載入中...</div>
            ) : transactions.length === 0 ? (
              <div className="text-slate-400 text-center py-12 border-2 border-dashed border-slate-100 rounded-lg">
                目前還沒有任何記帳紀錄喔！
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-4 flex justify-between items-center hover:bg-slate-50 px-2 rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{tx.description}</span>
                      <span className="text-sm text-slate-400">{tx.transaction_date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {tx.is_ai_parsed && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                          AI
                        </span>
                      )}
                      <span className="font-bold text-slate-700 text-lg">$ {tx.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}