
import React from 'react';
import { HeartPulse, LayoutDashboard, History, Settings, Info, LogOut, User, Server, Shield, BrainCircuit } from 'lucide-react';

type PageView = 'dashboard' | 'llm-admin';

interface SidebarProps {
  onReset: () => void;
  onOpenConfig: () => void;
  isActive: boolean;
  isAdmin?: boolean;
  userEmail?: string;
  activePage?: PageView;
  onNavigate?: (page: PageView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onReset, onOpenConfig, isActive, isAdmin, userEmail, activePage = 'dashboard', onNavigate }) => {

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
        <button
          onClick={() => { onNavigate?.('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activePage === 'dashboard' ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-50' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <LayoutDashboard size={22} /> Dashboard
        </button>
        <button className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl font-bold"><History size={22} /> History</button>
        <button className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl font-bold"><Info size={22} /> Lab Reference</button>

        {isAdmin && (
          <>
            <div className="my-4 border-t border-slate-100" />
            <p className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] px-4 mb-3">Admin</p>
            <button
              onClick={() => onNavigate?.('llm-admin')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activePage === 'llm-admin' ? 'bg-amber-50 text-amber-700 shadow-sm shadow-amber-50' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <BrainCircuit size={22} /> LLM Analytics
            </button>
          </>
        )}
      </nav>

      <div className="px-8 mb-6">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Orchestrator</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-500">CLINICAL-CORE v1</span>
            <Shield size={14} className="text-indigo-500" />
          </div>
        </div>
      </div>

      <div className="p-8 border-t border-slate-100 space-y-4">
        <button onClick={onOpenConfig} className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-all">
          <Settings size={14} /> System Configuration
        </button>
        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200"><User size={20} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-800">{isAdmin ? 'Admin' : 'Clinical User'}</p>
            {userEmail && <p className="text-[10px] font-bold text-slate-400 truncate">{userEmail}</p>}
          </div>
          <button onClick={onReset} className="p-2 text-slate-300 hover:text-rose-500 transition-colors" title="Sign Out / Clear">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};
