
import React from 'react';
import { GenomicMarker, RiskAssessment } from '../types';
import { Dna, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';

interface GenomicsRiskCardProps {
  markers?: GenomicMarker[];
  risk?: RiskAssessment;
}

export const GenomicsRiskCard: React.FC<GenomicsRiskCardProps> = ({ markers, risk }) => {
  const getRiskStyles = (level?: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-500 text-white border-red-600 shadow-red-100';
      case 'High': return 'bg-rose-100 text-rose-700 border-rose-200 shadow-rose-50';
      case 'Elevated': return 'bg-amber-100 text-amber-700 border-amber-200 shadow-amber-50';
      default: return 'bg-teal-50 text-teal-700 border-teal-100 shadow-teal-50';
    }
  };

  const getSigStyles = (sig: string) => {
    switch (sig) {
      case 'Pathogenic': return 'text-rose-600 bg-rose-50';
      case 'VUS': return 'text-amber-600 bg-amber-50';
      default: return 'text-slate-400 bg-slate-50';
    }
  };

  if (!markers?.length && !risk) {
    return (
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center opacity-50">
        <Dna size={40} className="text-slate-300 mb-4" />
        <p className="text-sm font-bold text-slate-400">No Genomic Markers Detected</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
            <Dna size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Genomic Markers</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precision Medicine Review</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-indigo-600">
          <Sparkles size={16} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase">Sequencing v2.1</span>
        </div>
      </div>

      <div className="p-8 flex-1 space-y-8">
        {/* Malignancy Prediction Banner */}
        {risk && (
          <div className={`p-6 rounded-3xl border shadow-sm flex items-start gap-4 transition-all hover:scale-[1.01] ${getRiskStyles(risk.malignancy_risk)}`}>
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldAlert size={20} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Cancer Prediction Status</p>
                <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                  {risk.malignancy_risk} Risk
                </div>
              </div>
              <p className="text-sm font-bold leading-relaxed">
                {risk.summary}
              </p>
            </div>
          </div>
        )}

        {/* Marker List */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detected Pathogenic Variants</h4>
          <div className="grid grid-cols-1 gap-3">
            {markers?.map((marker, i) => (
              <div key={i} className="group p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-white hover:border-indigo-200 transition-all hover:shadow-md cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                    {marker.gene}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{marker.variant}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{marker.interpretation}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${getSigStyles(marker.significance)}`}>
                  {marker.significance}
                </div>
              </div>
            ))}
            {!markers?.length && (
              <p className="text-xs text-slate-400 italic px-2">No specific high-priority variants identified.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-slate-50 border-t border-slate-100">
        <button className="w-full flex items-center justify-between px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group">
          <span className="text-xs font-black uppercase tracking-widest">View Full Sequencing Report</span>
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
