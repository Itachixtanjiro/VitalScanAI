
import React from 'react';
import { PredictionMetric, RiskLevel } from '../types/PredictionResponse';
import { HelpCircle, Info } from 'lucide-react';

const RISK_THEMES: Record<RiskLevel, { border: string; badge: string; text: string; bg: string }> = {
  Critical: { border: 'border-rose-200 shadow-rose-50', badge: 'bg-rose-600 text-white', text: 'text-rose-700', bg: 'bg-rose-50' },
  High: { border: 'border-rose-100 shadow-rose-50/50', badge: 'bg-rose-500 text-white', text: 'text-rose-600', bg: 'bg-rose-50/50' },
  Moderate: { border: 'border-amber-100 shadow-amber-50', badge: 'bg-amber-500 text-white', text: 'text-amber-700', bg: 'bg-amber-50' },
  Low: { border: 'border-emerald-100 shadow-emerald-50', badge: 'bg-emerald-600 text-white', text: 'text-emerald-700', bg: 'bg-emerald-50' },
};

export const RiskCard: React.FC<{ metric: PredictionMetric }> = ({ metric }) => {
  const theme = RISK_THEMES[metric.riskLevel] || RISK_THEMES.Low;
  const hasValue = metric.value !== undefined && metric.value !== null && metric.value !== '';

  return (
    <div className={`p-8 md:p-10 rounded-[3rem] border bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden flex flex-col ${theme.border}`}>
      <div className={`absolute top-0 left-0 w-full h-1.5 ${theme.badge.split(' ')[0]}`} />
      
      <div className="flex justify-between items-start mb-8 pt-2">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3 truncate max-w-[140px]">{metric.name}</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
              {hasValue ? metric.value : 'N/D'}
            </h4>
            {hasValue && <span className="text-sm font-bold text-slate-400">{metric.unit}</span>}
          </div>
        </div>
        <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${theme.badge}`}>
          {metric.riskLevel}
        </div>
      </div>
      
      <div className="space-y-6 flex-1 flex flex-col">
          <p className="text-xs leading-relaxed font-bold text-slate-500 line-clamp-3">
            {metric.description || 'Clinical context for this marker was not deciphered from source artifacts.'}
          </p>
          
          <div className="mt-auto space-y-5 pt-6 border-t border-slate-50">
            {metric.justification ? (
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 animate-in fade-in slide-in-from-top-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <HelpCircle size={12} className="text-indigo-400" /> CLINICAL JUSTIFICATION
                  </p>
                  <p className="text-[10px] text-slate-500 italic leading-relaxed font-medium">
                      {metric.justification}
                  </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 opacity-50">
                 <Info size={12} className="text-slate-400" />
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Inference Only</span>
              </div>
            )}

            {metric.normalRange && (
              <div className={`px-4 py-2 ${theme.bg} ${theme.text} rounded-2xl text-[10px] font-black uppercase w-fit tracking-widest border border-current opacity-70`}>
                REF: {metric.normalRange}
              </div>
            )}
          </div>
      </div>
    </div>
  );
};
