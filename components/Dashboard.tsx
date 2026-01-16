
import React, { useState } from 'react';
import { AnalysisResult, ImagingReport } from '../types';
import { Brain, Microscope, Scan, ChevronRight, AlertCircle, CheckCircle, ClipboardList } from 'lucide-react';
import { GenomicsRiskCard } from './GenomicsRiskCard';
import { MetricCard } from './MetricCard';
import { TrendCharts } from './TrendCharts';
import { CancerRiskModal } from './CancerRiskModal';

interface DashboardProps {
  data: AnalysisResult;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [selectedReport, setSelectedReport] = useState<ImagingReport | null>(null);

  const getRiskColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
      case 'high':
      case 'significant progression':
        return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'moderate':
      case 'elevated':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      default:
        return 'text-teal-600 bg-teal-50 border-teal-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {selectedReport && <CancerRiskModal report={selectedReport} onClose={() => setSelectedReport(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.metrics.slice(0, 3).map((m, i) => <MetricCard key={i} metric={m} />)}
        </div>

        {/* Narrative & Symptoms */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Brain size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">AI Multimodal Narrative</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MedGemma 1.5 Synthesis</p>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-lg text-slate-700 leading-relaxed font-medium italic">"{data.summary}"</p>
              </div>
            </div>
            
            <div className="mt-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Detected Clinical Symptoms</h4>
              <div className="flex flex-wrap gap-2">
                {data.symptomsDetected.map((symptom, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vitality & Quick Risks */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 flex flex-col items-center justify-center text-center">
             <div className="relative mb-6">
               <div className="w-32 h-32 rounded-full border-4 border-white/20 flex items-center justify-center">
                  <div className="text-4xl font-black">{data.vitalityScore}%</div>
               </div>
               <div className="absolute -bottom-2 right-0 bg-white text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Vitality</div>
             </div>
             <h4 className="text-xl font-bold mb-2">Age Longevity Score</h4>
             <p className="text-sm text-indigo-100 mb-6">Bio Age: {data.biologicalAge} yrs</p>
             <button className="w-full bg-white text-indigo-600 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-50 transition-colors">Improve Score</button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Integrated Risk Profile</h4>
            <div className={`p-4 rounded-2xl border ${getRiskColor(data.riskAssessment.malignancy_risk.level)}`}>
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-black uppercase">Malignancy</span>
                 <span className="text-[10px] font-black">{data.riskAssessment.malignancy_risk.level}</span>
               </div>
               <div className="h-1 w-full bg-black/5 rounded-full mt-2">
                 <div className="h-full bg-current rounded-full" style={{ width: `${data.riskAssessment.malignancy_risk.confidence * 100}%` }} />
               </div>
            </div>
            <div className={`p-4 rounded-2xl border ${getRiskColor(data.riskAssessment.cognitive_progression_risk)}`}>
               <span className="text-[10px] font-black uppercase block mb-1">Cognitive Stage</span>
               <span className="text-xs font-bold">{data.riskAssessment.cognitive_progression_risk}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GenomicsRiskCard markers={data.genomicMarkers} risk={{ malignancy_risk: data.riskAssessment.malignancy_risk.level, summary: data.riskAssessment.summary }} />
        
        {/* Suggested Next Steps */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg"><ClipboardList size={22} className="text-indigo-500" /> Suggested Next Steps</h3>
          </div>
          <div className="flex-1 space-y-4">
            {data.suggestedNextSteps.map((step, i) => (
              <div key={i} className="flex gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl items-start">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 border border-slate-200 mt-0.5">
                  <CheckCircle size={14} className="text-teal-500" />
                </div>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg"><Microscope size={22} className="text-blue-500" /> Synchronized Scans</h3>
          </div>
          <div className="flex-1 space-y-4">
            {data.imagingReports?.map((report) => (
              <button key={report.id} onClick={() => setSelectedReport(report)} className="group w-full flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-indigo-300 hover:bg-white transition-all hover:shadow-lg text-left">
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl ${report.riskScore > 60 ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}><Scan size={28} /></div>
                  <div>
                    <h4 className="font-black text-slate-800 text-md">{report.title}</h4>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{report.modality} • {report.date}</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500" />
              </button>
            ))}
          </div>
        </div>
        <TrendCharts data={data.historicalTrends} />
      </div>
    </div>
  );
};
