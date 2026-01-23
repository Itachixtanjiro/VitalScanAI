
import React from 'react';
// Fixed: Imported GenomicMarker from the correct shared types file
import { GenomicMarker } from '../types';
import { Dna, Sparkles, ChevronRight } from 'lucide-react';

interface GenomicsRiskCardProps {
  markers?: GenomicMarker[];
}

export const GenomicsRiskCard: React.FC<GenomicsRiskCardProps> = ({ markers }) => {
  const getSigStyles = (sig: string) => {
    switch (sig) {
      case 'Pathogenic': return 'text-rose-600 bg-rose-50';
      case 'VUS': return 'text-amber-600 bg-amber-50';
      default: return 'text-slate-400 bg-slate-50';
    }
  };

  if (!markers?.length) {
    return (
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center opacity-50 min-h-[400px]">
        <Dna size={40} className="text-slate-300 mb-4" />
        <p className="text-sm font-bold text-slate-400">No Genomic Markers Detected</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
            <Dna size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Genomic Sequencing</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precision Medicine Review</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-indigo-600">
          <Sparkles size={16} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase">v2.1 Sequencing</span>
        </div>
      </div>

      <div className="p-8 flex-1 space-y-8">
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detected Variants</h4>
          <div className="grid grid-cols-1 gap-3">
            {markers.map((marker, i) => (
              <div key={i} className="group p-5 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-between hover:bg-white hover:border-indigo-200 transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm">
                    {marker.gene}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{marker.variant}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1 italic font-medium">{marker.interpretation}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase shadow-sm ${getSigStyles(marker.significance)}`}>
                  {marker.significance}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-slate-50 border-t border-slate-100">
        <button className="w-full flex items-center justify-between px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group">
          <span className="text-[10px] font-black uppercase tracking-widest">Full Bioinformatics Log</span>
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};