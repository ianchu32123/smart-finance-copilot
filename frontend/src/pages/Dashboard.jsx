import { Send, LogOut, Trash2,Target } from 'lucide-react'; // 📍 確保引入了垃圾桶圖示
import { useDashboard } from '../hooks/useDashboard';
import { TrendLineChart, ExpensePieChart } from '../components/DashboardCharts';

export default function Dashboard() {
  // 🌟 關鍵修復：確保把所有算好的財務變數都拿出來！
  const {
    isGuest, transactions, status, inputText, setInputText,
    isSubmitting, handleSubmit, handleLogout,
    totalIncome, totalExpense, balance, handleDelete, // 📍 就是這裡原本漏掉了 balance
    pieChartData, lineChartData,budget, handleEditBudget, budgetPercent, progressColor
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
          placeholder="告訴 AI 你今天花了什麼？或賺了多少？ (例如：接案賺了 5000)"
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
      {/* 🌟 全新升級：預算水位進度條 */}
   <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8 relative overflow-hidden">
     <div className="flex justify-between items-end mb-2">
       <div>
         <h3 className="text-slate-500 font-medium flex items-center gap-2">
           <Target size={18} className="text-blue-500"/> 本月預算水位
         </h3>
         <p className="text-2xl font-bold text-slate-800 mt-1">
           $ {totalExpense.toLocaleString()} <span className="text-sm text-slate-400 font-normal">/ {budget.toLocaleString()}</span>
         </p>
       </div>
       <button onClick={handleEditBudget} className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors">
         ✏️ 設定預算
       </button>
     </div>

     {/* 進度條外框 */}
     <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
       {/* 進度條本體 (加上動態寬度與動態顏色) */}
       <div 
         className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColor}`}
         style={{ width: `${budgetPercent}%` }}
       ></div>
     </div>

     {/* 警告提示文字 */}
     {totalExpense >= budget ? (
       <p className="text-rose-500 text-sm mt-2 font-medium animate-pulse">🚨 警告：已超出本月預算！</p>
     ) : totalExpense >= budget * 0.8 ? (
       <p className="text-amber-500 text-sm mt-2 font-medium">⚠️ 注意：花費已達預算 80%，請節制！</p>
     ) : null}
   </div>
      
      {/* 🌟 全新升級：三合一收支數據卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-xl shadow-md border border-slate-700">
          <h3 className="text-slate-400 text-sm font-medium">總結餘</h3>
          <p className="text-3xl font-bold text-white mt-2">$ {balance.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm font-medium">總收入</h3>
          <p className="text-3xl font-bold text-emerald-600 mt-2">+ $ {totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm font-medium">總支出</h3>
          <p className="text-3xl font-bold text-rose-600 mt-2">- $ {totalExpense.toLocaleString()}</p>
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
        
        {/* 左欄：花費比例圓餅圖 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-[400px] flex flex-col">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">花費比例分析</h2>
          <ExpensePieChart data={pieChartData} />
        </div>

        {/* 右欄：最近交易紀錄 */}
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
                  <div key={tx.id} className="py-4 flex justify-between items-center hover:bg-slate-50 px-2 rounded-lg group">
                    
                    {/* 項目與日期 */}
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{tx.description}</span>
                      <span className="text-sm text-slate-400">{tx.transaction_date}</span>
                    </div>
                    
                    {/* 標籤、金額與刪除按鈕 */}
                    <div className="flex items-center gap-3">
                      {tx.is_anomaly && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-sm whitespace-nowrap">🚨 異常大筆花費</span>}
                      {tx.is_ai_parsed && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">AI</span>}
                      
                      {/* 💰 金額：判斷是收入還支出，顯示不同顏色 */}
                      <span className={`font-bold text-lg min-w-[80px] text-right ${tx.transaction_type === 'income' ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {tx.transaction_type === 'income' ? '+' : '-'} $ {tx.amount.toLocaleString()}
                      </span>
                      
                      {/* 🗑️ 刪除按鈕：平常隱藏，滑鼠移過去 (group-hover) 才顯示 */}
                      <button 
                        onClick={() => handleDelete(tx.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="刪除紀錄"
                      >
                        <Trash2 size={18} />
                      </button>
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