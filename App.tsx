
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { UploadPanel } from './components/UploadPanel';
import { DashboardPage } from './pages/Dashboard';
import { LLMDashboard } from './pages/LLMDashboard';
import { AuthPortal } from './components/AuthPortal';
import { LegalFooter } from './components/LegalFooter';
import { analyzeHealthArtifacts } from './services/api';
import { SynthesisResponse } from './types/ClinicalSynthesis';
import { UploadedFile } from './types';
import { AlertTriangle, Database, BrainCircuit, Activity, FileCheck, ShieldCheck } from 'lucide-react';

const PROCESSING_STEPS = [
  { icon: <Database size={18} />, text: "Anonymizing Clinical Artifacts..." },
  { icon: <FileCheck size={18} />, text: "Extracting Probabilistic Tokens..." },
  { icon: <BrainCircuit size={18} />, text: "ROI Latent Space Activation..." },
  { icon: <Activity size={18} />, text: "Synthesizing Research Insights..." }
];

type PageView = 'dashboard' | 'llm-admin';
const ADMIN_EMAIL = 'med@med.com';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [activePage, setActivePage] = useState<PageView>('dashboard');
  const [result, setResult] = useState<SynthesisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = userEmail.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % PROCESSING_STEPS.length);
      }, 2500);
    } else {
      setActiveStep(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleAnalysis = async (files: UploadedFile[]) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeHealthArtifacts(files);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Synthesizer failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isAuthenticated) return <AuthPortal onAuthenticated={(email: string) => { setUserEmail(email); setIsAuthenticated(true); }} />;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans overflow-x-hidden">
      <div className="flex flex-1">
        <Sidebar
          onReset={() => setResult(null)}
          onOpenConfig={() => {}}
          isActive={!!result}
          isAdmin={isAdmin}
          userEmail={userEmail}
          activePage={activePage}
          onNavigate={(page: PageView) => setActivePage(page)}
        />

        <main className="flex-1">
          <Header />
          <div className="p-12 max-w-7xl mx-auto pb-32">
            {activePage === 'llm-admin' && isAdmin ? (
              <LLMDashboard userEmail={userEmail} />
            ) : (
              <>
                {error && (
                  <div className="mb-10 p-6 bg-rose-50 border border-rose-100 rounded-[2.5rem] text-rose-700 flex items-center gap-4 animate-in slide-in-from-top-4">
                    <AlertTriangle className="text-rose-600" />
                    <p className="text-sm font-bold">{error}</p>
                  </div>
                )}

                <div className="mb-16">
                  <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                      <ShieldCheck size={16} /> Research-Only Clinical Synthesis Engine
                  </div>
                  <h1 className="text-5xl font-black text-slate-900 tracking-tight">Probabilistic Analysis</h1>
                  <p className="text-slate-400 mt-2 font-medium">Decision support synthesis for multi-modal clinical artifacts.</p>
                </div>

                <div className="space-y-16">
                  {!result && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                      <UploadPanel onFilesReady={handleAnalysis} isAnalyzing={isAnalyzing} />
                    </div>
                  )}
                  {result && <DashboardPage data={result} />}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <LegalFooter />

      {isAnalyzing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-8">
            <div className="bg-white p-16 rounded-[5rem] text-center space-y-10 animate-in zoom-in-95 max-w-md shadow-2xl border border-slate-200">
                <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Processing Anonymously</h3>
                  <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-xs mx-auto">
                    Data is being processed within a secure, de-identified inference container. PII is not stored on research nodes.
                  </p>
                </div>
                <div className="space-y-3 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                  {PROCESSING_STEPS.map((step, i) => (
                    <div key={i} className={`flex items-center gap-4 transition-all duration-500 ${i === activeStep ? 'text-indigo-600 opacity-100 translate-x-1' : 'text-slate-300 opacity-40'}`}>
                      <div className={`p-2 rounded-lg ${i === activeStep ? 'bg-indigo-100' : 'bg-transparent'}`}>{step.icon}</div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{step.text}</span>
                    </div>
                  ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
