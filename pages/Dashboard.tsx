
import React from 'react';
import { ClinicalAnalysisResult } from '../types/ClinicalSynthesis';
import { SummaryPanel } from '../components/SummaryPanel';
import { RiskCard } from '../components/RiskCard';
import { GradCamViewer } from '../components/GradCamViewer';
import { TrendCharts } from '../components/TrendCharts';
import { SignalIntensityDisplay } from '../components/SignalIntensityDisplay';
import { Activity, Scan, LayoutTemplate, Database, AlertCircle, ShieldCheck, Scale, Info, ShieldAlert } from 'lucide-react';

interface DashboardPageProps {
  data: ClinicalAnalysisResult;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ data }) => {
  const { imaging_artifact, biomarkers, longitudinal_trends, patient_context, consensus_state, intensity_level, overall_status, signal_intensity_probability, clinical_reasoning } = data;

  const getConsensusStyles = (state: string) => {
    switch(state) {
      case 'Unified': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Mixed Signal': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Variance Detected': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* 1. Clinical Advisory Banner */}
      <section className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 border border-slate-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-400"><ShieldAlert size={160} /></div>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
             <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/50"><Info size={32} /></div>
             <div className="space-y-3 flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3">
                    <h2 className="text-xl font-black tracking-tight uppercase">Clinical Decision Support Advisory</h2>
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5">Research Protocol</span>
                </div>
                <p className="text-sm font-medium text-slate-300 leading-relaxed max-w-4xl">
                    The synthesis presented below is a probabilistic aggregation of de-identified tokens extracted from clinical artifacts. 
                    <span className="text-indigo-400 font-bold ml-1">It does not constitute a medical diagnosis.</span> All outputs must be correlated with original patient records by a qualified practitioner.
                </p>
             </div>
          </div>
      </section>

      {/* 2. Consensus State */}
      <section className="bg-white rounded-[3rem] border border-slate-200 p-8 md:p-10 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Scale size={240} /></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className={`p-5 rounded-[2rem] border shadow-sm ${getConsensusStyles(consensus_state)}`}><ShieldCheck size={32} /></div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Synthesis Consensus</h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getConsensusStyles(consensus_state)}`}>{consensus_state}</span>
              </div>
              <p className="text-sm font-bold text-slate-500 max-w-lg">
                The synthesis engine has weighted {biomarkers.length + (imaging_artifact ? 1 : 0)} clinical data points for practitioner review.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
             <div className="text-right px-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AGE</p>
                <p className="text-xl font-black text-slate-800">{patient_context?.age || 45}</p>
             </div>
             <div className="w-px h-10 bg-slate-200 mx-2" />
             <div className="text-right px-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">BLOOD</p>
                <p className="text-xl font-black text-slate-800">{patient_context?.blood_type || 'A+'}</p>
             </div>
          </div>
        </div>
      </section>
      
      {/* 3. Narrative Synthesis */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 flex items-center gap-2"><Database size={12} /> Narrative Synthesis Review</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
              <SummaryPanel summary={data.narrative_summary} reasoning={clinical_reasoning || "Reasoning engine active for reviewer trace."} />
          </div>
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><ShieldCheck size={120} /></div>
              <div className="relative mb-6">
                  <div className="text-6xl font-black tracking-tighter">{intensity_level}</div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-3">Intensity Profile</p>
              </div>
              <div className="w-full h-px bg-white/10 mb-8" />
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Baseline: {overall_status}</p>
          </div>
        </div>
      </section>

      {/* 4. Probability & Evidence */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 flex items-center gap-2"><Activity size={12} className="text-rose-500" /> Statistical Probability Gauge</h2>
        <SignalIntensityDisplay observation={{
          label: overall_status,
          level: intensity_level,
          confidence: signal_intensity_probability,
          evidence: imaging_artifact?.findings ? [imaging_artifact.findings] : ["Artifact metadata verification", "Metabolic signal alignment"]
        }} />
      </section>

      {/* 5. Biomarkers */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 flex items-center gap-2"><LayoutTemplate size={12} /> Biomarker Intensity Matrix</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {biomarkers.length > 0 ? (
              biomarkers.map((b, i) => (
                <RiskCard key={i} metric={{
                  name: b.name,
                  value: b.value,
                  unit: b.unit,
                  status: b.status,
                  riskLevel: intensity_level,
                  description: b.description || "Synthesized marker observation.",
                  normalRange: b.reference_range,
                  trend: 'stable'
                }} />
              ))
            ) : (
              <div className="lg:col-span-3 p-20 bg-white border border-dashed border-slate-200 rounded-[3rem] text-center opacity-50">
                <Database size={40} className="mx-auto mb-4 text-slate-300" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Biomarker Artifacts Processed</p>
              </div>
            )}
        </div>
      </section>

      {/* 6. Trends */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 flex items-center gap-2"><Activity size={12} className="text-indigo-500" /> Longitudinal Trajectory</h2>
        <TrendCharts data={longitudinal_trends} />
      </section>

      {/* 7. Imaging */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 flex items-center gap-2"><Scan size={12} className="text-indigo-500" /> Radiographic Verification Trace</h2>
        {imaging_artifact ? (
          <div className="bg-white rounded-[3rem] border border-slate-200 p-8 md:p-10 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                      <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] shadow-inner">
                        <div className="flex items-center gap-3 mb-5">
                          <Scan className="text-indigo-600" />
                          <h4 className="text-lg font-black text-slate-800">{imaging_artifact.modality} Trace Artifact</h4>
                        </div>
                        <p className="text-sm text-slate-600 font-bold leading-relaxed italic border-l-2 border-slate-200 pl-4">
                          "{imaging_artifact.findings}"
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-amber-600 bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Artifact must be correlated with original DICOM files.</span>
                      </div>
                  </div>
                  <div className="space-y-4">
                      <GradCamViewer 
                        roi={imaging_artifact.roi_coordinates || []} 
                        confidence={signal_intensity_probability} 
                        title={`${imaging_artifact.modality} Alignment`}
                        originalImage={imaging_artifact.source_data}
                        gradCamOverlay={null}
                      />
                  </div>
              </div>
          </div>
        ) : (
            <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center opacity-60 shadow-sm">
                <Scan size={48} className="text-slate-300 mb-6" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Radiographic Trace Suppressed</p>
                <p className="text-xs text-slate-400 mt-2">No imaging pixel data identified in current artifact bundle.</p>
            </div>
        )}
      </section>
    </div>
  );
};
