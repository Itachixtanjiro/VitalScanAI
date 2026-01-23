
import React, { useState } from 'react';
import { Scan, Info, Eye, EyeOff, Layers, ZoomIn, X, Activity, AlertCircle, FileWarning, ShieldAlert } from 'lucide-react';

interface GradCamViewerProps {
  originalImage?: string | null;
  gradCamOverlay?: string | null;
  roi: { x: number; y: number; w: number; h: number }[];
  confidence: number;
  title: string;
}

export const GradCamViewer: React.FC<GradCamViewerProps> = ({ 
  originalImage, 
  gradCamOverlay, 
  roi, 
  confidence,
  title 
}) => {
  const [opacity, setOpacity] = useState(0.7);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  /**
   * Explainability Guardrail:
   * ROI and overlays are meaningless without anatomical ground truth.
   */
  const renderImageContent = (isModal: boolean = false) => {
    const containerClasses = isModal 
      ? "flex-1 relative bg-black flex items-center justify-center p-8 min-h-[400px]" 
      : "relative aspect-square flex items-center justify-center bg-slate-900 overflow-hidden rounded-[2rem] border border-slate-800 shadow-inner";
    
    if (!originalImage) {
      return (
        <div className={containerClasses}>
          <div className="flex flex-col items-center gap-4 text-slate-600 z-10 max-w-[280px] text-center p-6">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 mb-2">
              <FileWarning size={32} className="text-slate-500" />
            </div>
            <div className="space-y-3">
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Primary Data Missing</h5>
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                Radiographic source data not detected in artifact bundle. Feature mapping and ROI overlays are suppressed to maintain clinical safety.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={containerClasses}>
        <img 
          src={originalImage} 
          alt="Raw Artifact" 
          className="absolute inset-0 w-full h-full object-contain select-none z-0" 
          loading="eager"
        />

        {showOverlay && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {gradCamOverlay ? (
              <img 
                src={gradCamOverlay} 
                alt="Attention Map" 
                className="w-full h-full object-contain transition-opacity duration-300" 
                style={{ opacity }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-400" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Heatmap Data Suppressed</span>
                 </div>
              </div>
            )}

            {roi && roi.length > 0 && roi.map((area, i) => (
              <div 
                key={i}
                className="absolute border-2 border-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all duration-700 ease-out"
                style={{ 
                  left: `${area.x}%`, 
                  top: `${area.y}%`, 
                  width: `${area.w}%`, 
                  height: `${area.h}%` 
                }}
              >
                <div className="absolute -top-6 left-0 flex items-center gap-1.5 pointer-events-auto">
                  <span className="text-[8px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter">
                    ROI-{i+1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl text-white shadow-lg ${originalImage ? 'bg-indigo-600 shadow-indigo-900/20' : 'bg-slate-700 opacity-50'}`}>
            <Layers size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white tracking-tight">Explainability Logic</h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{originalImage ? `Signal: ${title}` : 'Input Data Required'}</span>
              <button 
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-slate-500 hover:text-indigo-400 relative focus:outline-none"
              >
                <Info size={14} />
                {showTooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 p-5 bg-slate-800 text-white text-[11px] leading-relaxed rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
                    <p className="font-black mb-2 uppercase tracking-wider text-indigo-400">Clinical Safeguards</p>
                    Explainability layers are dynamically mapped from model attention scores. If anatomical ground truth is missing, overlays are programmatically blocked.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            disabled={!originalImage || (!gradCamOverlay && roi.length === 0)}
            onClick={() => setShowOverlay(!showOverlay)}
            className={`p-2 rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed ${showOverlay ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}
          >
            {showOverlay ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button 
            disabled={!originalImage}
            onClick={() => setIsFullscreen(true)}
            className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all disabled:opacity-20"
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      <div className="relative group">
        {renderImageContent()}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`p-5 bg-slate-900/50 rounded-3xl border border-white/5 space-y-3 transition-opacity ${!originalImage || !gradCamOverlay ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Heatmap Intensity</span>
            <span className="text-xs font-black text-white">{Math.round(opacity * 100)}%</span>
          </div>
          <input 
            type="range" min="0" max="1" step="0.01" value={opacity} 
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        <div className={`p-5 bg-slate-900/50 rounded-3xl border border-white/5 flex flex-col justify-center transition-opacity ${!originalImage ? 'opacity-20' : 'opacity-100'}`}>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-white/40 uppercase">Consensus Confidence</span>
            <span className="text-xs font-black text-white">{confidence}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ease-out ${confidence > 60 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${confidence}%` }} />
          </div>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in fade-in duration-500">
          <div className="p-8 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-4 text-white">
              <Activity className="text-indigo-500" />
              <h3 className="text-xl font-black uppercase tracking-tight">Artifact Trace Verification</h3>
            </div>
            <button onClick={() => setIsFullscreen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all"><X size={24} /></button>
          </div>
          <div className="flex-1 flex flex-col lg:flex-row p-8 gap-8 overflow-hidden">
             <div className="flex-1 bg-black rounded-[3rem] border border-white/10 relative overflow-hidden flex items-center justify-center">
                {renderImageContent(true)}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
