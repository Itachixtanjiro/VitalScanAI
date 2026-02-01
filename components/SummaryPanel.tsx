
import React, { useState } from 'react';
import { Info, Activity, ShieldCheck, Copy, Check, AlertCircle, Loader2, Database } from 'lucide-react';

interface SummaryPanelProps {
  summary: string;
  reasoning: string;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ summary, reasoning }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `Review Summary: ${summary}\n\nClinical Logic Trace: ${reasoning}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightText = (text: string) => {
    if (!text) return null;
    
    const terms = [
      { regex: /high risk|critical|malignancy|elevated risk/gi, class: 'bg-rose-100 text-rose-700 px-2 py-0.5 rounded-xl font-bold' },
      { regex: /normal findings|negative|stable|low risk/gi, class: 'bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-xl font-bold' },
      { regex: /follow-up|attention required|moderate risk|further review|correlation advised/gi, class: 'bg-amber-100 text-amber-700 px-2 py-0.5 rounded-xl font-bold' },
      { regex: /AI-generated|automated inference|probabilistic|MedGemma|synthesis/gi, class: 'text-indigo-600 font-black underline decoration-indigo-300 decoration-2 underline-offset-4' }
    ];

    let parts: (string | React.ReactNode)[] = [text];

    terms.forEach(({ regex, class: className }) => {
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }

        let lastIndex = 0;
        let match;
        regex.lastIndex = 0; 
        
        while ((match = regex.exec(part)) !== null) {
          if (match.index > lastIndex) {
            newParts.push(part.substring(lastIndex, match.index));
          }
          newParts.push(
            <span key={`${match.index}-${match[0]}`} className={className}>
              {match[0]}
            </span>
          );
          lastIndex = regex.lastIndex;
        }
        
        if (lastIndex < part.length) {
          newParts.push(part.substring(lastIndex));
        }
      });
      parts = newParts;
    });

    return parts;
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col relative overflow-hidden h-full">
        <div className="p-8 md:p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-5">
                <div className="p-4 bg-white text-indigo-600 rounded-[1.5rem] shadow-sm border border-slate-100">
                    <ShieldCheck size={28} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Review Summary</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">PROBABILISTIC CLINICAL TRACE</p>
                </div>
            </div>
            
            <button 
                disabled={!summary}
                onClick={handleCopy}
                className="flex items-center gap-3 px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all shadow-sm group disabled:opacity-30"
            >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} className="text-slate-400 group-hover:text-indigo-600" />}
                <span className={`text-[10px] font-black uppercase tracking-widest ${copied ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {copied ? 'SUCCESS' : 'COPY LOG'}
                </span>
            </button>
        </div>

        <div className="p-8 md:p-10 space-y-10 flex-1 overflow-y-auto max-h-[500px] scrollbar-hide">
            {summary ? (
              <div className="space-y-10 animate-in fade-in">
                  <p className="text-lg font-bold text-slate-700 leading-[1.6] tracking-tight">
                      {highlightText(summary)}
                  </p>
                  
                  <div className="p-8 md:p-10 bg-slate-50 border border-slate-100 rounded-[3rem] border-l-4 border-l-indigo-500 shadow-inner">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                          <Database size={12} className="text-indigo-500" /> CLINICAL REASONING
                      </h4>
                      {reasoning ? (
                        <div className="text-sm font-bold text-slate-600 leading-relaxed space-y-3">
                            {reasoning.split('\n').filter(Boolean).map((line, idx) => (
                              <p key={idx}>{highlightText(line)}</p>
                            ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 text-slate-400 py-4">
                          <Loader2 size={18} className="animate-spin opacity-40" />
                          <p className="text-xs font-black uppercase tracking-widest italic">Clinical reasoning pending synthesis...</p>
                        </div>
                      )}
                  </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-3">Synthesis Pending</h4>
                  <p className="text-[10px] font-black text-slate-400 max-w-[240px] leading-relaxed uppercase tracking-[0.2em]">Synthesizing health markers for practitioner review...</p>
              </div>
            )}
        </div>

        <div className="p-6 md:p-8 bg-slate-950 text-white/50 border-t border-slate-800 flex items-start gap-5 shrink-0">
            <AlertCircle size={20} className="text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">REGULATORY NOTICE (RESEARCH MODE)</p>
                <p className="text-[10px] leading-relaxed font-bold max-w-2xl">
                    Probabilistic synthesis only. Results must be correlated with primary patient records by a qualified practitioner.
                    <span className="text-indigo-400 ml-1 uppercase font-black">Not for autonomous diagnostic use.</span>
                </p>
            </div>
        </div>
    </div>
  );
};
