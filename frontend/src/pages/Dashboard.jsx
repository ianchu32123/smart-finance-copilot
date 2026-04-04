import { Send, LogOut } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard'; // 📍 引入我們寫好的大腦
import { TrendLineChart, ExpensePieChart } from '../components/DashboardCharts'; // 📍 引入圖表元件

export default function Dashboard() {
  // 🌟 從 Custom Hook 中解構出所有需要的變數與方法
  const {
    isGuest, transactions, status, inputText, setInputText,
    isSubmitting, handleSubmit, handleLogout,
    totalAmount, pieChartData, lineChartData
  } = useDashboard();

  return (
    <div className="max-w-7xl mx-auto p-6 relative">
      {/* 頂部導航列 */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">財務儀表板</h1>
        <div className="flex items-center gap-4">
          {isGuest && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold">訪客模式</span>}
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors">
            <LogOut size={20} /> 登出
          </button>
        </div>
      </div>

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

      {/* 中欄：每日花費趨勢折線圖 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">每日花費趨勢</h2>
        <div className="h-[300px] w-full">
          <TrendLineChart data={lineChartData} />
        </div>
      </div>

      {/* 左右雙欄設計：圓餅圖與交易紀錄 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-[400px] flex flex-col">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">花費比例分析</h2>
          <ExpensePieChart data={pieChartData} />
        </div>

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
                      {tx.is_ai_parsed && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">AI</span>}
                      <span className="font-bold text-slate-700 text-lg">$ {tx.amount}</span>
                      <div className="flex items-center gap-3">
                      {/* 📍 新增：如果是異常花費，顯示紅色閃爍警告標籤 */}
                      {tx.is_anomaly && (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-sm">
                          🚨 異常大筆花費
                        </span>
                      )}
                      
                      {/* 原本的 AI 標籤與金額 */}
                      {tx.is_ai_parsed && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">AI</span>}
                      <span className="font-bold text-slate-700 text-lg">$ {tx.amount}</span>
                    </div>
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