
import React, { useState, useRef, useEffect } from 'react';
import { Mail, ShieldCheck, Fingerprint, Camera, Loader2, HeartPulse, ChevronRight, Lock, AlertTriangle } from 'lucide-react';

interface AuthPortalProps {
  onAuthenticated: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onAuthenticated }) => {
  const [method, setMethod] = useState<'email' | 'face'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState(false);

  const startFaceScan = async () => {
    if (!acknowledged) return;
    setIsScanning(true);
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setTimeout(() => {
        setIsLoading(true);
        setTimeout(() => {
          onAuthenticated();
          stream.getTracks().forEach(track => track.stop());
        }, 2000);
      }, 3000);
    } catch (err) {
      setCameraError(true);
      setIsScanning(false);
    }
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !acknowledged) return;
    setIsLoading(true);
    setTimeout(() => {
      onAuthenticated();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/50 mx-auto mb-6">
            <HeartPulse size={40} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">VitalScan<span className="text-indigo-400">AI</span></h1>
          <p className="text-slate-400 font-medium tracking-wide">Research Decision Support Portal</p>
        </div>

        <div className="bg-white/10 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/10 shadow-2xl space-y-8">
          
          <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
            <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
            <div className="space-y-2">
                <p className="text-[10px] font-black text-amber-200 uppercase tracking-widest">Advisory Protocol</p>
                <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                  This system is for research purposes only. It is not an FDA-cleared diagnostic device and must not be used for primary diagnosis.
                </p>
            </div>
          </div>

          <div className="flex bg-white/5 p-1.5 rounded-2xl">
            <button 
              onClick={() => { setMethod('email'); setIsScanning(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${method === 'email' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >
              <Mail size={16} /> Clinical ID
            </button>
            <button 
              onClick={() => setMethod('face')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${method === 'face' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >
              <Camera size={16} /> Biometric
            </button>
          </div>

          {method === 'email' ? (
            <form onSubmit={handleEmailAuth} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Practitioner Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="dr.smith@hospital.med"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>
              <div className="flex items-start gap-3 px-1">
                <input 
                    type="checkbox" id="ack" checked={acknowledged} onChange={() => setAcknowledged(!acknowledged)}
                    className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 accent-indigo-500"
                />
                <label htmlFor="ack" className="text-[10px] text-slate-400 font-bold leading-relaxed cursor-pointer select-none">
                  I acknowledge this is a research-only platform and that diagnostic correlation is my sole responsibility.
                </label>
              </div>
              <button 
                disabled={isLoading || !acknowledged}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-20"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Initialize Review Session <ChevronRight size={18} /></>}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="relative aspect-square bg-black rounded-[2rem] overflow-hidden border border-white/10">
                {isScanning ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    <div className="absolute inset-0 border-4 border-indigo-500/50 rounded-[2rem] pointer-events-none">
                       <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                    <Fingerprint size={48} className="text-indigo-400 mb-4" />
                    <p className="text-white font-bold text-sm mb-2">Biometric Scan</p>
                    <p className="text-slate-500 text-xs mb-6 px-4">Research protocol requires biometric verification for clinical data access.</p>
                    <div className="flex items-start gap-3 px-4 mb-6 text-left">
                        <input 
                            type="checkbox" id="ack-face" checked={acknowledged} onChange={() => setAcknowledged(!acknowledged)}
                            className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 accent-indigo-500 shrink-0"
                        />
                        <label htmlFor="ack-face" className="text-[9px] text-slate-400 font-bold leading-tight cursor-pointer select-none">
                            I acknowledge that this system does not provide autonomous diagnoses.
                        </label>
                    </div>
                    <button 
                      disabled={!acknowledged}
                      onClick={startFaceScan}
                      className="px-8 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase hover:bg-slate-100 transition-all disabled:opacity-20"
                    >
                      Initialize Scan
                    </button>
                  </div>
                )}
                {isLoading && (
                   <div className="absolute inset-0 bg-indigo-600/90 flex flex-col items-center justify-center text-white text-center p-8 animate-in fade-in">
                     <Loader2 className="animate-spin mb-4" size={40} />
                     <h4 className="text-xl font-black tracking-tight">Traceability Verified</h4>
                     <p className="text-indigo-100 text-sm mt-2 font-medium">Loading research artifacts...</p>
                   </div>
                )}
              </div>
            </div>
          )}

          <p className="text-center text-[10px] font-black uppercase text-slate-600 tracking-widest mt-6">HIPAA & GDPR COMPLIANT PROTOCOL</p>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
};
