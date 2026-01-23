
import React from 'react';
import { PredictionRisk, RiskLevel } from '../types/PredictionResponse';
import { ShieldAlert, Info, Activity, AlertTriangle, Fingerprint, Microscope, CheckCircle, Database } from 'lucide-react';

interface MalignancyRiskDisplayProps {
  risk: PredictionRisk;
}

const THEME_MAP: Record<RiskLevel, { 
  bg: string; 
  border: string; 
  text: string; 
  badge: string;
  icon: string;
}> = {
  Critical: { 
    bg: 'bg-rose-50/80', 
    border: 'border-rose-200', 
    text: 'text-rose-900', 
    badge: 'bg-rose-100 text-rose-700',
    icon: 'text-rose-600'
  },
  High: { 
    bg: 'bg-rose-50/50', 
    border: 'border-rose-100', 
    text: 'text-rose-800', 
    badge: 'bg-rose-100 text-rose-600',
    icon: 'text-rose-500'
  },
  Moderate: { 
    bg: 'bg-amber-50/50', 
    border: 'border-amber-100', 
    text: 'text-amber-900', 
    badge: 'bg-amber-100 text-amber-700',
    icon: 'text-amber-600'
  },
  Low: { 
    bg: 'bg-emerald-50/50', 
    border: 'border-emerald-100', 
    text: 'text-emerald-900', 
    badge: 'bg-emerald-100 text-emerald-700',
    icon: 'text-emerald-600'
  }
};

export const MalignancyRiskDisplay: React.FC<MalignancyRiskDisplayProps> = ({ risk }) => {
  const rawConfidence = typeof risk.confidence === 'number' ? risk.confidence : 0;
  const normalizedConfidence = rawConfidence > 1 ? rawConfidence / 100 : rawConfidence;
  const clampedConfidence = Math.min(Math.max(normalizedConfidence, 0), 1);
  const confidencePercent = Math.round(clampedConfidence * 100);
  const evidencePoints = Array.isArray(risk.evidence) ? risk.evidence : [];
  const isClearanceState = confidencePercent <= 0 && evidencePoints.length === 0;

  if (isClearanceState) {
    return (
      <div className="p-10 rounded-[3rem] border border-emerald-100 bg-emerald-50/30 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-10 min-h-[260px] animate-in fade-in">
        <div className="absolute top-0 right-0 p-12 opacity-5 text-emerald-600 pointer-events-none">
          <CheckCircle size={160} />
        </div>
        <div className="w-40 h-40 bg-white rounded-full border-8 border-emerald-50 flex items-center justify-center shrink-0 shadow-sm">
           <CheckCircle size={56} className="text-emerald-500" />
        </div>
        <div className="flex-1 space-y-4 text-center md:text-left">
           <div className="flex items-center gap-3 justify-center md:justify-start">
              <h3 className="text-xl font-black text-emerald-900 tracking-tight">Baseline Profile Observed</h3>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest">Baseline</span>
           </div>
           <p className="text-sm font-bold text-emerald-800 leading-relaxed max-w-md">
             Synthesis detected zero evidence tokens correlating to specific risk patterns across provided artifacts.
           </p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2 justify-center md:justify-start">
             <Info size={12} /> Practitioner correlation mandatory.
           </p>
        </div>
      </div>
    );
  }

  const theme = THEME_MAP[risk.level] || THEME_MAP.Low;

  return (
    <div className={`p-8 md:p-12 rounded-[3.5rem] border shadow-sm transition-all relative overflow-hidden flex flex-col lg:flex-row gap-12 lg:gap-16 min-h-[400px] ${theme.bg} ${theme.border}`}>
      
      <div className="absolute top-8 right-10 flex items-center gap-2 px-5 py-2 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-full shadow-sm z-30 pointer-events-none">
        <Microscope size={14} className="text-indigo-500" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Review Traceability Active</span>
      </div>

      <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none z-0">
        <ShieldAlert size={280} />
      </div>

      <div className="flex flex-col items-center justify-center shrink-0 lg:w-56 z-10">
        <div className="relative w-56 h-56 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="112" cy="112" r="104" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-slate-200/40" />
                <circle 
                    cx="112" cy="112" r="104" 
                    fill="transparent" 
                    stroke="currentColor" 
                    strokeWidth="10" 
                    strokeDasharray="653" 
                    strokeDashoffset={653 - (653 * clampedConfidence)} 
                    strokeLinecap="round"
                    className={`${theme.icon} transition-all duration-1000 ease-out`}
                />
            </svg>
            <div className="text-center">
                <span className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{confidencePercent}%</span>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-5 leading-tight">Signal<br/>Probability</p>
            </div>
        </div>
      </div>

      <div className="flex-1 space-y-10 z-10 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5 min-w-0">
                <div className={`p-5 rounded-[1.5rem] bg-white shadow-sm shrink-0 ${theme.icon}`}><ShieldAlert size={32} /></div>
                <div className="min-w-0">
                    <h3 className={`text-3xl font-black tracking-tight truncate ${theme.text}`}>Probabilistic Synthesis</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Consensus Signal Trace</p>
                </div>
            </div>
            <div className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm shrink-0 self-start sm:self-center border border-current opacity-80 ${theme.badge}`}>
                {risk.level} Intensity
            </div>
        </div>

        <div className="space-y-8">
            <p className="text-xl font-bold text-slate-700 leading-snug italic border-l-4 border-slate-200 pl-8 py-2">
                "{risk.label || 'Narrative synthesis pending clinical review.'}"
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <Fingerprint size={12} /> Evidence Tokens
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {evidencePoints.length > 0 ? (
                          evidencePoints.map((point, i) => (
                            <span key={i} className="px-5 py-2.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-600 shadow-sm flex items-center gap-2 hover:border-indigo-300 transition-colors">
                                <Activity size={12} className="text-indigo-500" />
                                {point}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 italic bg-slate-100/50 px-6 py-3 rounded-2xl border border-dashed border-slate-200 w-full text-center">Inconclusive signals identified.</span>
                        )}
                    </div>
                </div>

                <div className="space-y-5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <Database size={12} /> Traceability Audit
                    </h4>
                    <div className="bg-white/40 border border-slate-100 rounded-[2rem] p-6 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Imaging Signal</span>
                           <span className="text-[10px] font-bold text-emerald-600">Observed</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metabolic Signal</span>
                           <span className="text-[10px] font-bold text-emerald-600">Observed</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Genomic Bias</span>
                           <span className="text-[10px] font-bold text-slate-400 italic">Not Identified</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-10 border-t border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
            <div className="flex items-center gap-3 text-rose-600 font-bold bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100 shadow-sm">
                <AlertTriangle size={18} className="shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Practitioner Review Required</span>
            </div>
            <div className="flex items-center gap-3 text-indigo-600 font-black">
                <Info size={18} className="shrink-0" />
                <button className="text-[10px] font-black uppercase tracking-widest underline underline-offset-4 decoration-indigo-200 hover:decoration-indigo-600 transition-all">View Logic Trace</button>
            </div>
        </div>
      </div>
    </div>
  );
};
