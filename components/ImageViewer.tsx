
import React, { useState } from 'react';
import { Info, Eye, EyeOff, Layers, ZoomIn, X, Activity, FileWarning, ShieldAlert } from 'lucide-react';

interface BoundingBox {
  condition: string;
  confidence: number;
  label: string;
  box: { x: number; y: number; width: number; height: number };
  color: string;
}

interface ImageViewerProps {
  originalImage?: string | null;
  boundingBoxes?: BoundingBox[];
  gradcamOverlay?: string | null;  // base64 Grad-CAM heatmap overlay
  confidence?: number;
  title?: string;
  findings?: string[];
}

// Error boundary state wrapper
interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

// Using class fields that TypeScript recognizes
class ImageViewerErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare readonly props: ErrorBoundaryProps;
  declare state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ImageViewer Error:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-[2rem] bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
          <ShieldAlert className="text-rose-500 mb-4" size={48} />
          <h4 className="text-white font-black uppercase tracking-widest mb-2">Visualization Module Error</h4>
          <p className="text-slate-500 text-xs max-w-xs">The Explainability Engine encountered a render fault.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const ImageViewerContent: React.FC<ImageViewerProps> = ({
  originalImage,
  boundingBoxes = [],
  gradcamOverlay = null,
  confidence = 0,
  title = "Analysis",
  findings = []
}) => {
  const [showOverlay, setShowOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const hasGradcam = !!gradcamOverlay;

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
                Radiographic source data not detected in artifact bundle.
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

        {/* Grad-CAM Heatmap Overlay (real model explainability) */}
        {showOverlay && hasGradcam && (
          <img
            src={gradcamOverlay!}
            alt="Grad-CAM Heatmap"
            className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none transition-opacity duration-500"
            style={{ opacity: 0.7 }}
          />
        )}

        {/* Legacy Bounding Box Overlay (fallback when no Grad-CAM) */}
        {showOverlay && !hasGradcam && boundingBoxes.length > 0 && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {boundingBoxes.map((bbox, i) => (
              <div
                key={i}
                className="absolute border-2 transition-all duration-700 ease-out"
                style={{
                  left: `${bbox.box.x * 100}%`,
                  top: `${bbox.box.y * 100}%`,
                  width: `${bbox.box.width * 100}%`,
                  height: `${bbox.box.height * 100}%`,
                  borderColor: bbox.color,
                  backgroundColor: `${bbox.color}20`,
                  boxShadow: `0 0 20px ${bbox.color}40`
                }}
              >
                <div className="absolute -top-7 left-0 flex items-center gap-1.5 pointer-events-auto whitespace-nowrap">
                  <span
                    className="text-[9px] font-black text-white px-2 py-0.5 rounded shadow-sm uppercase tracking-tight"
                    style={{ backgroundColor: bbox.color }}
                  >
                    {bbox.label}
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
            <h4 className="text-sm font-black text-white tracking-tight">{hasGradcam ? 'Grad-CAM Analysis' : 'Region Analysis'}</h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {!originalImage ? 'Input Data Required' : hasGradcam ? 'Heatmap overlay active' : `${boundingBoxes.length} regions detected`}
              </span>
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-slate-500 hover:text-indigo-400 relative focus:outline-none"
              >
                <Info size={14} />
                {showTooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 p-5 bg-slate-800 text-white text-[11px] leading-relaxed rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
                    <p className="font-black mb-2 uppercase tracking-wider text-indigo-400">{hasGradcam ? 'Grad-CAM Visualization' : 'Region Detection'}</p>
                    {hasGradcam
                      ? 'Gradient-weighted Class Activation Map highlights the regions the neural network focused on for its top prediction.'
                      : 'Bounding boxes highlight anatomical regions associated with detected conditions based on model predictions.'
                    }
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={!originalImage || (!hasGradcam && boundingBoxes.length === 0)}
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

      <div className="p-5 bg-slate-900/50 rounded-3xl border border-white/5 flex flex-col justify-center">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold text-white/40 uppercase">Consensus Confidence</span>
          <span className="text-xs font-black text-white">{confidence}%</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-1000 ease-out ${confidence > 60 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${confidence}%` }} />
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in fade-in duration-500">
          <div className="p-8 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-4 text-white">
              <Activity className="text-indigo-500" />
              <h3 className="text-xl font-black uppercase tracking-tight">Region Analysis View</h3>
            </div>
            <button onClick={() => setIsFullscreen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all"><X size={24} /></button>
          </div>
          <div className="flex-1 flex flex-col lg:flex-row p-8 gap-8 overflow-hidden">
            <div className="flex-1 bg-black rounded-[3rem] border border-white/10 relative overflow-hidden flex items-center justify-center">
              {renderImageContent(true)}
            </div>
            {hasGradcam && (
              <div className="w-full lg:w-80 bg-slate-900/50 rounded-3xl border border-white/10 p-6 overflow-y-auto">
                <h4 className="text-sm font-black text-white mb-4 uppercase tracking-widest">Grad-CAM Explainability</h4>
                <div className="space-y-3">
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      The heatmap highlights regions the model focused on when making its prediction.
                      Warmer colors (red/yellow) indicate higher activation.
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-900/30 rounded-xl border border-indigo-500/20">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Layer: conv5_block16_concat</span>
                  </div>
                </div>
              </div>
            )}
            {!hasGradcam && boundingBoxes.length > 0 && (
              <div className="w-full lg:w-80 bg-slate-900/50 rounded-3xl border border-white/10 p-6 overflow-y-auto">
                <h4 className="text-sm font-black text-white mb-4 uppercase tracking-widest">Detected Regions</h4>
                <div className="space-y-3">
                  {boundingBoxes.map((bbox, i) => (
                    <div key={i} className="p-3 bg-slate-800/50 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bbox.color }} />
                        <span className="text-xs font-bold text-white">{bbox.condition}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{(bbox.confidence * 100).toFixed(1)}% confidence</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ImageViewer: React.FC<ImageViewerProps> = (props) => (
  <ImageViewerErrorBoundary>
    <ImageViewerContent {...props} />
  </ImageViewerErrorBoundary>
);

// Keep backward compatibility export
export const GradCamViewer = ImageViewer;
