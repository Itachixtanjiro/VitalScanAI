
import React from 'react';
import { ImagingReport } from '../types';
import { X, Scan, Brain, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import { CLINICAL_THRESHOLDS } from '../constants';

export const CancerRiskModal: React.FC<{ report: ImagingReport, onClose: () => void }> = ({ report, onClose }) => {
  const isHighRisk = report.riskScore > CLINICAL_THRESHOLDS.CANCER_RISK.HIGH;
  const isModerateRisk = report.riskScore > CLINICAL_THRESHOLDS.CANCER_RISK.MODERATE && report.riskScore <= CLINICAL_THRESHOLDS.CANCER_RISK.HIGH;
  
  const riskColor = isHighRisk ? 'text-rose-600' : isModerateRisk ? 'text-amber-500' : 'text-teal-600';
  const riskBg = isHighRisk ? 'bg-rose-50' : isModerateRisk ? 'bg-amber-50' : 'bg-teal-50';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
        <div className={`p-8 ${riskBg} border-b border-slate-100 flex justify-between items-start`}>
          <div className="flex gap-4">
            <div className={`p-4 rounded-2xl ${isHighRisk ? 'bg-rose-100 text-rose-600' : 'bg-white shadow-sm text-indigo-600'}`}><Scan size={32} /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">Cancer Risk Analysis</h2>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{report.modality} Findings</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
        </div>
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${isHighRisk ? 'bg-rose-500' : isModerateRisk ? 'bg-amber-500' : 'bg-teal-500'}`} style={{ width: `${report.riskScore}%` }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Brain size={18} className="text-indigo-500" /> Simplified Interpretation</h3>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm italic text-slate-700 leading-relaxed">"{report.interpretation}"</div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><CheckCircle2 size={18} className="text-teal-600" /> Clinical Next Steps</h3>
              <ul className="space-y-2">
                {report.nextSteps.map((step, i) => <li key={i} className="text-xs text-slate-600 flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />{step}</li>)}
              </ul>
            </div>
          </div>
          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
            <AlertTriangle className="text-amber-600 shrink-0" size={24} />
            <p className="text-[11px] text-amber-700">This AI-generated interpretation must be shared with your oncology specialist. It is not a final diagnosis.</p>
          </div>
        </div>
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Close</button>
          <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-xl flex items-center gap-2">Share with Doctor <ChevronRight size={18} /></button>
        </div>
      </div>
    </div>
  );
};
