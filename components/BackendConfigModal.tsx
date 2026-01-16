
import React, { useState } from 'react';
import { X, Server, Sparkles, Check, Globe } from 'lucide-react';
import { getBackendUrl, setBackendUrl, getServiceMode, setServiceMode, ServiceMode } from '../geminiService';

export const BackendConfigModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [urlInput, setUrlInput] = useState(getBackendUrl());
  const [mode, setMode] = useState<ServiceMode>(getServiceMode());

  const handleSave = () => {
    setBackendUrl(urlInput);
    setServiceMode(mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl animate-in zoom-in-95 border border-slate-200">
         <div className="flex justify-between items-center mb-8">
           <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">System Infrastructure</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configure AI Processing Engine</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
         </div>

         <div className="space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setMode('backend')}
                className={`p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden ${mode === 'backend' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
              >
                <Server className={`mb-3 ${mode === 'backend' ? 'text-indigo-600' : 'text-slate-400'}`} size={24} />
                <p className={`font-black text-sm ${mode === 'backend' ? 'text-indigo-900' : 'text-slate-600'}`}>Custom Backend</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Colab / Ngrok / FastAPI</p>
                {mode === 'backend' && <div className="absolute top-4 right-4 bg-indigo-600 text-white p-1 rounded-full"><Check size={12} /></div>}
              </button>

              <button 
                onClick={() => setMode('aistudio')}
                className={`p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden ${mode === 'aistudio' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
              >
                <Sparkles className={`mb-3 ${mode === 'aistudio' ? 'text-indigo-600' : 'text-slate-400'}`} size={24} />
                <p className={`font-black text-sm ${mode === 'aistudio' ? 'text-indigo-900' : 'text-slate-600'}`}>Google AI Studio</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Direct Native Gemini</p>
                {mode === 'aistudio' && <div className="absolute top-4 right-4 bg-indigo-600 text-white p-1 rounded-full"><Check size={12} /></div>}
              </button>
           </div>

           {mode === 'backend' ? (
             <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
               <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-2">Endpoint Endpoint</label>
                 <div className="relative">
                   <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                     type="text" 
                     value={urlInput} 
                     onChange={(e) => setUrlInput(e.target.value)} 
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                     placeholder="https://your-tunnel.ngrok-free.app"
                   />
                 </div>
               </div>
             </div>
           ) : (
             <div className="p-6 bg-indigo-600 text-white rounded-3xl space-y-3 animate-in fade-in slide-in-from-top-2">
               <div className="flex items-center gap-3">
                 <Sparkles size={20} />
                 <p className="font-black text-sm">Direct Native Access Active</p>
               </div>
               <p className="text-xs font-medium opacity-80 leading-relaxed">
                 Using environment API key for direct communication with Gemini-3 Pro. No external backend required.
               </p>
             </div>
           )}

           <button onClick={handleSave} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-black transition-all">
             Apply Infrastructure Changes
           </button>
         </div>
      </div>
    </div>
  );
};
