
import React, { useState } from 'react';
import { AnalysisResult, ImagingReport } from '../types';
import { Microscope, Scan, UserCircle, ClipboardList, Activity, Info, ShieldCheck } from 'lucide-react';
import { GenomicsRiskCard } from './GenomicsRiskCard';
import { MetricCard } from './MetricCard';
import { TrendCharts } from './TrendCharts';
import { CancerRiskModal } from './CancerRiskModal';

interface DashboardProps {
  data: AnalysisResult;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [selectedReport, setSelectedReport] = useState<ImagingReport | null>(null);
  
  if (!data || !data.activeModules) return null;
  const { activeModules } = data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 w-full overflow-hidden">
      {selectedReport && (
        <CancerRiskModal 
            report={selectedReport} 
            onClose={() => setSelectedReport(null)} 
            evidence={data.riskAssessment.observed_signal_intensity.evidence_points}
        />
      )}

      {/* Summary & Review Context Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldCheck size={120} />
            </div>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Info size={24} /></div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Synthesis for Clinical Review</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Multi-Modal Artifact Review</p>
                </div>
            </div>
            <div className="space-y-6 flex-1">
                <p className="text-lg font-bold text-slate-700 leading-snug">
                    {data.summary}
                </p>
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem]">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Activity size={12} /> Review Context
                    </h4>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                        {data.riskAssessment.review_context}
                    </p>
                </div>
            </div>
        </div>

        {/* Vitality Observation (Synthesized Result) */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full border-4 border-white/20 flex items-center justify-center relative">
               <div className="text-4xl font-black">{data.vitalityObservation}%</div>
               <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle 
                    cx="64" cy="64" r="60" 
                    fill="transparent" 
                    stroke="white" 
                    strokeWidth="4" 
                    strokeDasharray="377" 
                    strokeDashoffset={377 - (377 * data.vitalityObservation / 100)} 
                    strokeLinecap="round"
                    className="opacity-50"
                  />
               </svg>
            </div>
            <div className="absolute -bottom-2 right-0 bg-white text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg">Observation</div>
          </div>
          <h4 className="text-xl font-bold mb-2">Vitality Profile</h4>
          <p className="text-sm text-indigo-100 mb-6">Age Profile: {data.biologicalAge} yrs • {data.patientBio?.bloodType}</p>
          <div className="flex gap-2">
             <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase">For Clinical Review</span>
          </div>
        </div>
      </div>

      {/* Module: History */}
      {activeModules.history && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><UserCircle size={24} /></div>
                <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Reported History Context</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historical Context Review</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Clinical Background</h4>
                    <div className="flex flex-wrap gap-2">
                    {data.patientBio?.medicalHistory?.map((item, i) => (
                        <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600">{item}</span>
                    ))}
                    </div>
                </div>
                <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Reported Context</h4>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50">
                    {data.patientBio?.socialHistory}
                    </p>
                </div>
                <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Reported Predispositions</h4>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50">
                    {data.patientBio?.familyHistory}
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* Module: Metrics */}
      {activeModules.metrics && data.metrics?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
            {data.metrics.map((m, i) => <MetricCard key={i} metric={m as any} />)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeModules.genomics && data.genomicMarkers && data.genomicMarkers.length > 0 && (
          <GenomicsRiskCard markers={data.genomicMarkers as any} />
        )}
        
        {activeModules.actions && data.considerationPlan?.length > 0 && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg"><ClipboardList size={22} className="text-indigo-500" /> Clinical Considerations</h3>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase">Research Protocol Only</span>
            </div>
            <div className="flex-1 space-y-4">
              {data.considerationPlan.map((action, i) => (
                <div key={i} className="flex gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl items-center group hover:bg-white hover:border-indigo-200 transition-all cursor-default">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    action.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {action.priority === 'High' ? '!!' : '>'}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{action.category}</p>
                    <p className="text-sm font-bold text-slate-700 leading-tight">{action.task}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8 w-full">
        {activeModules.imaging && data.imagingReports && data.imagingReports.length > 0 && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col w-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg"><Microscope size={22} className="text-blue-500" /> Imaging Artifact Review</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Observations in Region of Interest</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.imagingReports.map((report) => (
                <button 
                    key={report.id} 
                    onClick={() => setSelectedReport(report)} 
                    className="group w-full flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:border-indigo-400 transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Scan size={28} /></div>
                    <div className="text-left">
                      <h4 className="font-black text-slate-800 text-md">{report.title}</h4>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{report.modality} • {report.date}</span>
                    </div>
                  </div>
                  <div className="p-2 bg-indigo-50 text-indigo-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Info size={20} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {activeModules.trends && data.historicalTrends?.length > 0 && (
          <TrendCharts data={data.historicalTrends} />
        )}
      </div>

      {/* Module: Observation Log */}
      {data.observationsDetected?.length > 0 && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1 flex items-center gap-2"><Activity size={12} /> Extracted Clinical Observations</h4>
          <div className="flex flex-wrap gap-2">
            {data.observationsDetected.map((obs, i) => (
              <span key={i} className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 shadow-sm">
                {obs}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
