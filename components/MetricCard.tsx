
import React from 'react';
import { HealthMetric } from '../types';
import { getA1CStyles } from '../constants';

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
    const isHighRisk = metric.riskLevel === 'High' || metric.status === 'critical';
    const isModerateRisk = metric.riskLevel === 'Moderate' || metric.status === 'warning';
    styles = {
      cardBorder: isHighRisk ? 'border-rose-200' : isModerateRisk ? 'border-amber-200' : 'border-teal-200',
      badge: isHighRisk ? 'bg-rose-500 text-white' : isModerateRisk ? 'bg-amber-500 text-white' : 'bg-teal-500 text-white',
      lightBg: isHighRisk ? 'bg-rose-50' : isModerateRisk ? 'bg-amber-50' : 'bg-teal-50',
      lightText: isHighRisk ? 'text-rose-600' : isModerateRisk ? 'text-amber-600' : 'text-teal-600'
    };
  }

  return (
    <div className={`p-6 rounded-[2rem] border bg-white shadow-sm transition-all hover:shadow-md ${styles.cardBorder}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70 text-slate-400">{metric.name}</p>
          <h4 className="text-3xl font-black text-slate-900">{metric.value}<span className="text-lg ml-1 font-bold text-slate-400">{metric.unit}</span></h4>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${styles.badge}`}>
          {isA1C ? `${metric.value}% Range` : `${metric.riskLevel} Risk`}
        </div>
      </div>
      <p className="text-[11px] leading-relaxed font-medium text-slate-500">
        {metric.description}
      </p>
      {metric.normalRange && (
        <p className="text-[9px] mt-2 font-bold opacity-40">Target Range: {metric.normalRange}</p>
      )}
    </div>
  );
};
