
import React from 'react';
import { Search, Server, ShieldCheck, Microscope } from 'lucide-react';

export const Header: React.FC = () => {

  return (
    <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40 px-12 flex items-center justify-between">
      <div className="flex-1 max-w-xl relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input type="text" placeholder="Search clinical markers..." className="w-full bg-slate-100/50 border-none rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="h-10 px-4 bg-slate-900 text-white rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-slate-800 shadow-sm">
            <Microscope size={14} className="text-indigo-400" /> Research Mode
          </div>
          <div className="h-10 px-4 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
            <ShieldCheck size={14} /> Synthesis Active
          </div>
        </div>
        <div className="w-px h-8 bg-slate-200 mx-2" />
        <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
          <Server size={20} />
        </button>
      </div>
    </header>
  );
};
