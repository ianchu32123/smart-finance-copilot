import { Wallet, LayoutDashboard, Settings } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl tracking-wide">
          <Wallet className="text-blue-400" />
          <span>Smart Finance</span>
        </div>
        <div className="flex gap-6">
          <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
            <LayoutDashboard size={18} /> 總覽
          </button>
          <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
            <Settings size={18} /> 設定
          </button>
        </div>
      </div>
    </nav>
  );
}