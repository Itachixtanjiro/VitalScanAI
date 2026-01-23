
import React, { useState } from 'react';
import { X, Server, Check, Globe, Cpu, Terminal, Shield } from 'lucide-react';

export const BackendConfigModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [mode, setMode] = useState<'development' | 'production'>('development');

  const handleSave = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 border border-slate-200 overflow-y-auto max-h-[90vh]">
         <div className="flex justify-between items-center mb-10">
           <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">System Environment</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Orchestration Deployment Strategy</p>
           </div>
           <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
         </div>

         <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => setMode('development')}
                className={`p-8 rounded-[2.5rem] border-2 text-left transition-all relative overflow-hidden ${mode === 'development' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
              >
                <Terminal className={`mb-4 ${mode === 'development' ? 'text-indigo-600' : 'text-slate-400'}`} size={28} />
                <p className={`font-black text-lg ${mode === 'development' ? 'text-indigo-900' : 'text-slate-600'}`}>Development</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-tight">Mock Simulation Mode</p>
                {mode === 'development' && <div className="absolute top-6 right-6 bg-indigo-600 text-white p-1 rounded-full"><Check size={14} /></div>}
              </button>

              <button 
                onClick={() => setMode('production')}
                className={`p-8 rounded-[2.5rem] border-2 text-left transition-all relative overflow-hidden ${mode === 'production' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
              >
                <Shield className={`mb-4 ${mode === 'production' ? 'text-indigo-600' : 'text-slate-400'}`} size={28} />
                <p className={`font-black text-lg ${mode === 'production' ? 'text-indigo-900' : 'text-slate-600'}`}>Production</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-tight">Encrypted Remote API</p>
                {mode === 'production' && <div className="absolute top-6 right-6 bg-indigo-600 text-white p-1 rounded-full"><Check size={14} /></div>}
              </button>
           </div>

           <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-4 animate-in fade-in slide-in-from-top-2">
               <div className="flex items-center gap-3">
                 <Server size={20} className="text-indigo-400" />
                 <p className="font-black text-sm uppercase tracking-tight">Active Container Configuration</p>
               </div>
               <div className="space-y-2 opacity-80">
                 <p className="text-xs font-medium leading-relaxed">
                   {mode === 'development' 
                    ? "Operating in localized sandbox. Clinical tokenization is simulated using stable research heuristics. No data leaves the application memory."
                    : "Connecting to remote clinical inference cluster. Ensure MTLS certificates are provisioned in the application environment variables."}
                 </p>
               </div>
               {mode === 'production' && (
                 <div className="relative mt-4">
                   <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                   <input 
                     type="text" 
                     className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[10px] text-indigo-200"
                     placeholder="https://api.vitalscan.med/v1/synthesis"
                   />
                 </div>
               )}
           </div>

           <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
             Apply Environment Config
           </button>
         </div>
      </div>
    </div>
  );
};
