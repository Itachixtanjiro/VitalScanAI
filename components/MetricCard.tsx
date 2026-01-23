
import React from 'react';
import { HealthMetric } from '../types';
import { getA1CStyles } from '../constants';
import { HelpCircle } from 'lucide-react';

export const MetricCard: React.FC<{ metric: HealthMetric }> = ({ metric }) => {
  const isA1C = metric.name.toLowerCase().includes('a1c');
  
  let styles;
  if (isA1C) {
    const a1cStyles = getA1CStyles(metric.value);
    styles = {
      cardBorder: a1cStyles.border,
      badge: a1cStyles.bg + ' ' + a1cStyles.text,
      lightBg: a1cStyles.lightBg,
      lightText: a1cStyles.lightText
    };
  } else {
    const isHighRisk = metric.riskLevel === 'High' || metric.riskLevel === 'Critical' || metric.status === 'critical';
    const isModerateRisk = metric.riskLevel === 'Moderate' || metric.status === 'warning';
    styles = {
      cardBorder: isHighRisk ? 'border-rose-200 shadow-rose-50' : isModerateRisk ? 'border-amber-200 shadow-amber-50' : 'border-emerald-200 shadow-emerald-50',
      badge: isHighRisk ? 'bg-rose-600 text-white' : isModerateRisk ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white',
      lightBg: isHighRisk ? 'bg-rose-50' : isModerateRisk ? 'bg-amber-50' : 'bg-emerald-50',
      lightText: isHighRisk ? 'text-rose-700' : isModerateRisk ? 'text-amber-700' : 'text-emerald-700'
    };
  }

  return (
    <div className={`p-8 rounded-[2.5rem] border bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden ${styles.cardBorder}`}>
      {/* Visual Indicator Line */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${styles.badge.split(' ')[0]}`} />
      
      <div className="flex justify-between items-start mb-6 pt-2">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">{metric.name}</p>
          <div className="flex items-baseline gap-1.5">
            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{metric.value}</h4>
            <span className="text-sm font-bold text-slate-400">{metric.unit}</span>
          </div>
        </div>
        <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-tighter shadow-sm ${styles.badge}`}>
          {isA1C ? 'GLYCATION' : metric.riskLevel}
        </div>
      </div>
      
      <div className="space-y-5">
          <p className="text-xs leading-relaxed font-bold text-slate-500">
            {metric.description}
          </p>
          
          {metric.justification && (
            <div className="pt-4 border-t border-slate-100 mt-4 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <HelpCircle size={10} /> REVIEW CONTEXT
                </p>
                <p className="text-[10px] text-slate-500 italic font-medium leading-relaxed">
                    {metric.justification}
                </p>
            </div>
          )}

          {metric.normalRange && (
            <div className={`px-3 py-1.5 ${styles.lightBg} ${styles.lightText} rounded-xl text-[9px] font-black uppercase w-fit tracking-[0.15em] border border-current opacity-70`}>
              REF: {metric.normalRange}
            </div>
          )}
      </div>
    </div>
  );
};
