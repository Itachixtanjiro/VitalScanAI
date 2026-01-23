
import React from 'react';
import { ShieldAlert, Lock, Microscope, Scale, Info } from 'lucide-react';

export const LegalFooter: React.FC = () => {
  return (
    <footer className="w-full bg-slate-900 text-slate-400 py-20 px-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-tighter">
              <Microscope size={18} className="text-indigo-400" />
              VitalScan AI Research
            </div>
            <p className="text-[10px] leading-relaxed font-bold opacity-80 uppercase tracking-tight">
              PROBABILISTIC SYNTHESIS PROTOCOL v2.5.0
            </p>
            <p className="text-[10px] leading-relaxed font-medium">
              VitalScan is an experimental clinical decision support platform. It is not intended for use in the diagnosis, cure, mitigation, treatment, or prevention of disease.
            </p>
          </div>
          
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-tighter">
              <Lock size={18} className="text-emerald-400" />
              Ethics & Privacy
            </div>
            <p className="text-[10px] leading-relaxed font-bold opacity-80 uppercase tracking-tight">
              DE-IDENTIFIED TOKENIZATION ACTIVE
            </p>
            <p className="text-[10px] leading-relaxed font-medium">
              Artifacts are processed via de-identified clinical tokenization. This portal maintains strict adherence to research-aligned anonymization protocols.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-tighter">
              <ShieldAlert size={18} className="text-rose-400" />
              Practitioner Sovereignty
            </div>
            <p className="text-[10px] leading-relaxed font-bold opacity-80 uppercase tracking-tight">
              HUMAN-IN-THE-LOOP MANDATORY
            </p>
            <p className="text-[10px] leading-relaxed font-medium">
              The board-certified practitioner remains the sole authority. AI outputs are probabilistic suggestions and must be correlated with primary artifacts.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-tighter">
              <Scale size={18} className="text-indigo-400" />
              Regulatory Notice
            </div>
            <p className="text-[10px] leading-relaxed font-bold opacity-80 uppercase tracking-tight">
              NON-DIAGNOSTIC RESEARCH DEVICE
            </p>
            <p className="text-[10px] leading-relaxed font-medium">
              Undergoing investigative review. Not for primary diagnostic use in non-research settings. Not an FDA-cleared diagnostic device.
            </p>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <Info size={16} className="text-indigo-400" />
             </div>
             <p className="text-[9px] font-black uppercase tracking-[0.3em]">
               © 2025 VitalScan Clinical Intelligence Lab • Academic Deployment
             </p>
          </div>
          <div className="flex flex-wrap gap-8">
            <button className="text-[9px] font-black uppercase hover:text-white transition-colors tracking-widest">Ethics Protocol</button>
            <button className="text-[9px] font-black uppercase hover:text-white transition-colors tracking-widest">Data processing addendum</button>
            <button className="text-[9px] font-black uppercase hover:text-white transition-colors tracking-widest">Explainability whitepaper</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
