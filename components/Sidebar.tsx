
import React from 'react';
import { HeartPulse, LayoutDashboard, History, Settings, Info, LogOut, User, Server, Sparkles } from 'lucide-react';
import { getServiceMode } from '../geminiService';

interface SidebarProps {
  onReset: () => void;
  onOpenConfig: () => void;
  isActive: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onReset, onOpenConfig, isActive }) => {
  const mode = getServiceMode();

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex-col hidden xl:flex h-screen sticky top-0 shadow-sm z-50">
      <div className="p-10 border-b border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
          <HeartPulse size={28} />
        </div>
        <span className="text-2xl font-black text-slate-800 tracking-tighter">VitalScan<span className="text-indigo-600">AI</span></span>
      </div>
      <nav className="flex-1 p-8 space-y-3">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-6">Medical Portal</p>
        <button className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-50' : 'text-slate-400 hover:bg-slate-50'}`}>
          <LayoutDashboard size={22} /> Dashboard
        </button>
        <button onClick={onOpenConfig} className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl font-bold transition-all">
          <Settings size={22} /> Backend Config
        </button>
        <button className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl font-bold"><Info size={22} /> Library</button>
      </nav>
      
      <div className="px-8 mb-6">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Engine</span>
           {mode === 'backend' ? <Server size={14} className="text-emerald-500" /> : <Sparkles size={14} className="text-indigo-500" />}
        </div>
      </div>

      <div className="p-8 border-t border-slate-100">
         <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200"><User size={20} /></div>
            <div className="flex-1"><p className="text-sm font-black text-slate-800">Patient Profile</p></div>
            <button onClick={onReset} className="p-2 text-slate-300 hover:text-rose-500 transition-colors" title="Clear All Data">
              <LogOut size={18} />
            </button>
         </div>
      </div>
    </aside>
  );
};
