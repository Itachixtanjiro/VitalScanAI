
import React, { useState } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, BarChart, Bar, Cell, Legend
} from 'recharts';
import { AnalysisResult, HealthMetric, ImagingReport } from '../types';
import { 
  Activity, ShieldCheck, ExternalLink, Microscope, 
  CheckCircle2, Zap, User, Brain, Heart, Droplets,
  FileText, AlertTriangle, ChevronRight, X, Scan, Info
} from 'lucide-react';
import { GenomicsRiskCard } from './GenomicsRiskCard';

interface DashboardProps {
  data: AnalysisResult;
}

/**
 * Utility to get clinical status color based on A1C value
 * Normal: < 5.7 (Green)
 * Pre-Diabetic: 5.7 - 7.0 (Yellow)
 * Diabetic: > 7.0 (Red)
 */
const getA1CStatusStyles = (value: number | string) => {
  const val = typeof value === 'string' ? parseFloat(value) : value;
  if (val > 7.0) return { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', lightBg: 'bg-red-50', lightText: 'text-red-600' };
  if (val >= 5.7) return { bg: 'bg-yellow-500', text: 'text-white', border: 'border-yellow-600', lightBg: 'bg-yellow-50', lightText: 'text-yellow-600' };
  return { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600', lightBg: 'bg-green-50', lightText: 'text-green-600' };
};

const CancerRiskModal: React.FC<{ report: ImagingReport, onClose: () => void }> = ({ report, onClose }) => {
  const isHighRisk = report.riskScore > 65;
  const isModerateRisk = report.riskScore > 35 && report.riskScore <= 65;
  
  const riskColor = isHighRisk ? 'text-rose-600' : isModerateRisk ? 'text-amber-500' : 'text-teal-600';
  const riskBg = isHighRisk ? 'bg-rose-50' : isModerateRisk ? 'bg-amber-50' : 'bg-teal-50';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
        <div className={`p-8 ${riskBg} border-b border-slate-100 flex justify-between items-start`}>
          <div className="flex gap-4">
            <div className={`p-4 rounded-2xl ${isHighRisk ? 'bg-rose-100 text-rose-600' : 'bg-white shadow-sm text-indigo-600'}`}>
              <Scan size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">Cancer Risk Analysis</h2>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{report.modality} Interpretative Findings</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto">
          {/* Risk Indicator */}
          <div className="flex flex-col items-center">
            <div className="flex justify-between w-full mb-3 px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Normal Finding</span>
              <span className={`text-sm font-black ${riskColor}`}>Probability Score: {report.riskScore}%</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Abnormal/Priority</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ease-out rounded-full ${isHighRisk ? 'bg-rose-500' : isModerateRisk ? 'bg-amber-500' : 'bg-teal-500'}`} 
                 style={{ width: `${report.riskScore}%` }} 
               />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Brain size={18} className="text-indigo-500" />
                Simplified Interpretation
              </h3>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-700 leading-relaxed italic">
                  "{report.interpretation}"
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-teal-600" />
                Clinical Next Steps
              </h3>
              <ul className="space-y-3">
                {report.nextSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 items-start group">
                    <div className="mt-1 w-5 h-5 bg-white border border-slate-200 rounded flex items-center justify-center shrink-0">
                      <div className={`w-2 h-2 rounded-full ${isHighRisk ? 'bg-rose-400' : 'bg-teal-400'}`} />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
            <AlertTriangle className="text-amber-600 shrink-0" size={24} />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-900">Physician Review Required</p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                This AI-generated interpretation is based on radiological artifacts. It is not a final diagnosis. Please share this analysis with your oncology specialist.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-8 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">Close</button>
          <button className="px-8 py-3 rounded-2xl font-bold bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
            Share with Doctor <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ metric: HealthMetric }> = ({ metric }) => {
  const isA1C = metric.name.toLowerCase().includes('a1c');
  
  let styles;
  if (isA1C) {
    const a1cStyles = getA1CStatusStyles(metric.value);
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

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [selectedReport, setSelectedReport] = useState<ImagingReport | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {selectedReport && <CancerRiskModal report={selectedReport} onClose={() => setSelectedReport(null)} />}

      {/* Main Health Summary Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Metric Cards - Primary Vitals */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.metrics.slice(0, 3).map((m, i) => (
            <MetricCard key={i} metric={m} />
          ))}
        </div>

        {/* Clinical Narrative Summary */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Brain size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">AI Multimodal Narrative</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MedGemma 1.5 Synthesis</p>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-lg text-slate-700 leading-relaxed font-medium italic">
                "{data.summary}"
              </p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.bodySystems.map((sys, i) => (
              <div key={i} className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{sys.system}</p>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${sys.score > 80 ? 'bg-teal-500' : sys.score > 50 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${sys.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vitality Score & Bio Age Panel */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 flex flex-col items-center justify-center text-center">
           <div className="relative mb-6">
             <div className="w-32 h-32 rounded-full border-4 border-white/20 flex items-center justify-center">
                <div className="text-4xl font-black">{data.vitalityScore}%</div>
             </div>
             <div className="absolute -bottom-2 right-0 bg-white text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Vitality</div>
           </div>
           <h4 className="text-xl font-bold mb-2">Age Longevity Score</h4>
           <p className="text-sm text-indigo-100 mb-6">Your body is performing at a level consistent with a {data.biologicalAge} year old.</p>
           <button className="w-full bg-white text-indigo-600 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-50 transition-colors">Improve Score</button>
        </div>
      </div>

      {/* Genomics & Risk Analysis Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GenomicsRiskCard markers={data.genomicMarkers} risk={data.riskAssessment} />
        
        {/* Imaging Artifacts List */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
              <Microscope size={22} className="text-blue-500" />
              Synchronized Scans
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Radiology Sync Active</p>
          </div>
          <div className="flex-1 space-y-4">
            {data.imagingReports && data.imagingReports.length > 0 ? data.imagingReports.map((report) => (
              <button 
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="group w-full flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-indigo-300 hover:bg-white transition-all hover:shadow-lg text-left"
              >
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl ${report.riskScore > 60 ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    <Scan size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-md group-hover:text-indigo-600 transition-colors">{report.title}</h4>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{report.modality}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">• {report.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {report.riskScore > 60 && (
                    <div className="bg-rose-50 text-rose-600 text-[9px] font-black uppercase px-2 py-1 rounded-lg">Indeterminate</div>
                  )}
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            )) : (
              <div className="p-16 text-center border-2 border-dashed rounded-[2.5rem] border-slate-100 text-slate-300 italic">
                No imaging artifacts detected.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Blood Pressure Trend - Dynamic Line Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
              <Heart size={20} className="text-rose-500" />
              Blood Pressure Profile
            </h3>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-400">
               <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /> Sys</span>
               <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Dia</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.historicalTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                <YAxis domain={[60, 160]} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                />
                <Line type="monotone" dataKey="blood_pressure_sys" stroke="#f43f5e" strokeWidth={4} dot={{ r: 6, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} name="Systolic" />
                <Line type="monotone" dataKey="blood_pressure_dia" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} name="Diastolic" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* A1C History - Dynamic Line Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
              <Activity size={20} className="text-indigo-500" />
              A1C Hemoglobin History
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.historicalTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                <YAxis domain={[4, 8]} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Line 
                  type="monotone" 
                  dataKey="a1c" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const styles = getA1CStatusStyles(payload.a1c);
                    const color = styles.bg.replace('bg-', '');
                    return (
                      <circle key={cx} cx={cx} cy={cy} r={6} fill={color} stroke="#fff" strokeWidth={2} />
                    );
                  }}
                  name="A1C %" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
