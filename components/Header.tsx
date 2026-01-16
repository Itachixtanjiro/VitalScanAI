
import React from 'react';
import { Search, Link as LinkIcon, Sparkles, Server } from 'lucide-react';
import { getServiceMode } from '../geminiService';

export const Header: React.FC = () => {
  const mode = getServiceMode();

  return (
    <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40 px-12 flex items-center justify-between">
      <div className="flex-1 max-w-xl relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input type="text" placeholder="Search records..." className="w-full bg-slate-100/50 border-none rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
      </div>
      <div className="flex items-center gap-6">
         {mode === 'backend' ? (
           <div className="h-10 px-4 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
              <Server size={14} /> Custom Backend Active
           </div>
         ) : (
           <div className="h-10 px-4 bg-indigo-50 text-indigo-600 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
              <Sparkles size={14} /> AI Studio Native
           </div>
         )}
         <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all relative">
            <Sparkles size={20} />
         </button>
      </div>
    </header>
  );
};
