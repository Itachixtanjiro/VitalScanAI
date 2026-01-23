
import React from 'react';
import { ImagingReport } from '../types';
import { X, Scan, Brain, CheckCircle2, AlertTriangle, ChevronRight, Info, ShieldAlert, FileWarning } from 'lucide-react';
import { CLINICAL_THRESHOLDS } from '../constants';

interface CancerRiskModalProps {
  report: ImagingReport;
  onClose: () => void;
  evidence?: string[];
}

export const CancerRiskModal: React.FC<CancerRiskModalProps> = ({ report, onClose, evidence }) => {
  const isHighRisk = report.riskScore > CLINICAL_THRESHOLDS.CANCER_RISK.HIGH;
  const isModerateRisk = report.riskScore > CLINICAL_THRESHOLDS.CANCER_RISK.MODERATE && report.riskScore <= CLINICAL_THRESHOLDS.CANCER_RISK.HIGH;
  
  const riskColor = isHighRisk ? 'text-rose-600' : isModerateRisk ? 'text-amber-500' : 'text-teal-600';
  const riskBg = isHighRisk ? 'bg-rose-50' : isModerateRisk ? 'bg-amber-50' : 'bg-teal-50';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[90vh]">
        
        {/* Left Side: Visual Traceability Audit */}
        <div className="w-full md:w-1/2 bg-slate-900 relative flex flex-col overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-white/80 uppercase tracking-widest border border-white/10">
                    Traceability Layer
                </div>
                <div className="flex items-center gap-2">
                   <ShieldAlert size={14} className="text-indigo-400" />
                   <span className="text-[10px] font-black text-white/40 uppercase">Research Active</span>
                </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center bg-black/40">
                <div className="relative group cursor-crosshair flex flex-col items-center gap-6 p-12 text-center">
                    <div className="w-48 h-48 border-2 border-indigo-500/20 rounded-full flex items-center justify-center">
                        <div className="w-32 h-32 border border-white/10 rounded-full animate-pulse flex items-center justify-center">
                            <FileWarning size={40} className="text-white/10" />
                        </div>
                    </div>
                    <div className="space-y-3 max-w-xs">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Radiographic Data Missing</h4>
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                           This synthesis was performed on a multi-modal metadata stream. Primary pixel data was suppressed or is unavailable. 
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-8 bg-slate-950 border-t border-white/5 shrink-0">
                <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Synthesis Confidence</p>
                       <span className="text-xs font-black text-indigo-400">{report.model_confidence || 85}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${report.model_confidence || 85}%` }} />
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side: Clinical Evidence Matrix */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className={`p-10 ${riskBg} border-b border-slate-100 flex justify-between items-start shrink-0`}>
                <div className="flex gap-5">
                    <div className={`p-4 rounded-[1.5rem] ${isHighRisk ? 'bg-rose-100 text-rose-600 shadow-sm' : 'bg-white shadow-sm text-indigo-600'}`}>
                      <Scan size={32} />
                    </div>
                    <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Synthesis Trace</h2>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{report.modality} Artifact • {report.date}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-3 hover:bg-white/50 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
            </div>
            
            <div className="p-10 space-y-10 overflow-y-auto flex-1 scrollbar-hide">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                           <Brain size={14} className="text-indigo-500" /> Evidence Review
                        </h3>
                        <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase shadow-sm ${isHighRisk ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'}`}>
                            {report.riskScore}% Signal Intensity
                        </div>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 text-md font-bold text-slate-700 leading-relaxed italic shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                           <Info size={40} />
                        </div>
                        "{report.interpretation}"
                    </div>
                </div>

                {evidence && evidence.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert size={12} className="text-indigo-500" /> Supporting Clinical Tokens
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {evidence.map((point, i) => (
                                <span key={i} className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-bold border border-indigo-100 flex items-center gap-2 shadow-sm">
                                    <CheckCircle2 size={12} />
                                    {point}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                       <CheckCircle2 size={14} className="text-teal-600" /> Clinical Considerations
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Fix: Property 'nextSteps' does not exist on type 'ImagingReport'. Using 'suggestedFollowUp' instead. */}
                        {report.suggestedFollowUp.map((step, i) => (
                            <div key={i} className="flex gap-4 p-5 bg-teal-50/30 rounded-[2rem] border border-teal-100/30 items-start group hover:bg-white hover:border-teal-200 transition-all">
                                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 text-xs font-black">
                                    {i + 1}
                                </div>
                                <p className="text-xs text-slate-600 font-bold leading-relaxed">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-5 items-center shadow-sm">
                    <AlertTriangle className="text-amber-600 shrink-0" size={24} />
                    <p className="text-[10px] font-black text-amber-700 leading-relaxed uppercase tracking-tight">
                        Explainability Audit: <span className="underline">Interpretive review only</span>. Narrative based on tokenized metadata. Correlation with primary records mandatory.
                    </p>
                </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
                <button onClick={onClose} className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Dismiss</button>
                <button className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:translate-y-0">
                    Export for MD <ChevronRight size={18} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
