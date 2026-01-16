
import React, { useState, useRef, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { FileUploader } from './components/FileUploader';
import { analyzeHealthData, createHealthChatSession } from './geminiService';
import { AnalysisResult, UploadedFile, ChatMessage } from './types';
// Fixed: Added AlertTriangle and Brain to the lucide-react imports which were missing and causing reference errors.
import { HeartPulse, LayoutDashboard, History, Settings, Info, LogOut, Search, User, ChevronRight, MessageSquare, Send, X, Loader2, Sparkles, Activity, AlertTriangle, Brain } from 'lucide-react';

const CLINICAL_DEMO_DATA: AnalysisResult = {
  summary: "Patient presents with excellent cardiovascular conditioning and favorable lipid profile improvements. However, a recent high-resolution Chest CT identified a 4mm ground-glass opacity which requires indeterminate risk management. Metabolic markers show rising HbA1c (5.7%) necessitating dietary recalibration to prevent type-2 onset.",
  vitalityScore: 82,
  biologicalAge: 39,
  patientBio: {
    name: "Johnathon Doe",
    age: 45,
    bloodType: "O Positive"
  },
  metrics: [
    { name: "A1C Hemoglobin", value: "5.7", unit: "%", trend: "up", riskLevel: "Moderate", status: "warning", description: "Currently entering pre-diabetic threshold. Focus on low-glycemic intake.", normalRange: "4.0 - 5.6%" },
    { name: "LDL Cholesterol", value: "108", unit: "mg/dL", trend: "down", riskLevel: "Low", status: "normal", description: "Favorable reduction from previous labs. Continue current lipid protocol.", normalRange: "<130 mg/dL" },
    { name: "Blood Pressure", value: "119/78", unit: "mmHg", trend: "stable", riskLevel: "Low", status: "normal", description: "Optimal systolic and diastolic range maintained over 12 months.", normalRange: "120/80 mmHg" }
  ],
  bodySystems: [
    { system: "Cardiovascular", status: "Optimal", score: 94 },
    { system: "Respiratory", status: "At Risk", score: 58 },
    { system: "Endocrine", status: "Stable", score: 72 },
    { system: "Neurological", status: "Optimal", score: 91 },
    { system: "Musculoskeletal", status: "Stable", score: 82 }
  ],
  predictions: [
    { condition: "Lung Malignancy", riskLevel: "Moderate", confidence: 0.68, reasoning: "Sub-solid ground-glass nodule detected. Non-specific but requires clinical staging follow-up." },
    { condition: "Type 2 Diabetes", riskLevel: "Low", confidence: 0.82, reasoning: "Weight and active profile are protective, though glucose trend is upward." }
  ],
  genomicMarkers: [
    { gene: "BRCA1", variant: "c.5266dupC", interpretation: "Elevated susceptibility to breast/ovarian malignancy.", significance: "Pathogenic" },
    { gene: "KRAS", variant: "G12D", interpretation: "Indeterminate variant in circulating DNA.", significance: "VUS" }
  ],
  riskAssessment: {
    malignancy_risk: "Elevated",
    summary: "Genetic predisposition identified in BRCA1 alongside a persistent 4mm pulmonary nodule. Requires serial imaging and specialized genetic counseling."
  },
  imagingReports: [
    {
      id: "img-onc-1",
      title: "Chest CT - Pulmonology Review",
      date: "May 18, 2024",
      modality: "CT",
      findings: "4mm area of ground-glass opacity in right apical segment. No pleural thickening. No lymphadenopathy.",
      interpretation: "Finding is indeterminate. Given size and sub-solid morphology, it requires follow-up imaging in 6 months to rule out indolent malignancy or adenocarcinoma in situ.",
      riskScore: 72,
      nextSteps: [
        "Low-dose CT surveillance in 180 days",
        "Pulmonology risk assessment consultation",
        "Smoking cessation (if applicable)"
      ]
    },
    {
      id: "img-ortho-2",
      title: "Lumbar MRI",
      date: "Feb 04, 2024",
      modality: "MRI",
      findings: "L4-L5 minor disc protrusion without neural encroachment.",
      interpretation: "Physiological age-appropriate degenerative changes. No acute structural risks.",
      riskScore: 8,
      nextSteps: [
        "Continue active lifestyle",
        "Monitor for radicular symptoms"
      ]
    }
  ],
  actionPlan: [
    { task: "Schedule Pulmonology Consult", priority: "High", category: "Oncology" },
    { task: "Low Glycemic Nutritional Shift", priority: "High", category: "Endocrine" },
    { task: "Follow-up Chest CT (Nov 2024)", priority: "Medium", category: "Radiology" }
  ],
  historicalTrends: [
    { date: "May 23", a1c: 5.2, blood_pressure_sys: 124, blood_pressure_dia: 82, cholesterol_ldl: 142, cholesterol_hdl: 44 },
    { date: "Aug 23", a1c: 5.3, blood_pressure_sys: 122, blood_pressure_dia: 80, cholesterol_ldl: 135, cholesterol_hdl: 45 },
    { date: "Nov 23", a1c: 5.4, blood_pressure_sys: 120, blood_pressure_dia: 79, cholesterol_ldl: 128, cholesterol_hdl: 48 },
    { date: "Feb 24", a1c: 5.5, blood_pressure_sys: 119, blood_pressure_dia: 78, cholesterol_ldl: 118, cholesterol_hdl: 52 },
    { date: "May 24", a1c: 5.7, blood_pressure_sys: 119, blood_pressure_dia: 78, cholesterol_ldl: 108, cholesterol_hdl: 55 }
  ],
  flaggedNotes: [
    "Indeterminate lung nodule identified",
    "Rising glycemic baseline detected"
  ],
  researchSources: [
    { title: "NCCN Lung Screening Guidelines 2024", uri: "https://www.nccn.org" }
  ]
};

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(CLINICAL_DEMO_DATA);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ 
    role: 'model', 
    text: `Greetings John. I've synthesized your latest medical data. Your overall vitality is high (82%), but we should prioritize a discussion regarding the recent CT findings and your glucose trends. How can I help you today?` 
  }]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysisResult && !chatSessionRef.current) {
      chatSessionRef.current = createHealthChatSession(analysisResult);
    }
  }, [analysisResult]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages]);

  const handleAnalysis = async (files: UploadedFile[]) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeHealthData(files);
      setAnalysisResult(result);
      chatSessionRef.current = createHealthChatSession(result);
      setChatMessages([{ role: 'model', text: `Multi-modal analysis complete. I've integrated your new files into the dashboard. What specific health metrics would you like to review?` }]);
    } catch (err: any) {
      setError(err.message || "Synthesized analysis failed. Check API configuration.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !chatSessionRef.current) return;

    const userMsg = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const resultStream = await chatSessionRef.current.sendMessageStream({ message: userMsg });
      let fullText = '';
      setChatMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of resultStream) {
        fullText += chunk.text;
        setChatMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = fullText;
          return newMsgs;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans overflow-x-hidden">
      {/* Sidebar - Pro Desktop Navigation */}
      <aside className="w-80 bg-white border-r border-slate-200 flex-col hidden xl:flex h-screen sticky top-0 shadow-sm z-50">
        <div className="p-10 border-b border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
            <HeartPulse size={28} />
          </div>
          <span className="text-2xl font-black text-slate-800 tracking-tighter">VitalScan<span className="text-indigo-600">AI</span></span>
        </div>
        <nav className="flex-1 p-8 space-y-3">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-6">Medical Portal</p>
          <button onClick={() => setAnalysisResult(CLINICAL_DEMO_DATA)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${analysisResult === CLINICAL_DEMO_DATA ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-50' : 'text-slate-400 hover:bg-slate-50'}`}>
            <LayoutDashboard size={22} /> Dashboard
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl font-bold">
            <History size={22} /> Archive
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl font-bold">
            <Settings size={22} /> Configuration
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl font-bold">
            <Info size={22} /> Clinical Library
          </button>
        </nav>
        <div className="p-8 border-t border-slate-100">
           <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                <User size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-slate-800">J. Doe</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase">Premium Patient</p>
              </div>
              <LogOut size={18} className="text-slate-300 hover:text-rose-500 cursor-pointer transition-colors" />
           </div>
        </div>
      </aside>

      <main className="flex-1 bg-[#fbfcfd]">
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40 px-12 flex items-center justify-between">
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Search lab results, radiology scans, or visit notes..." className="w-full bg-slate-100/50 border-none rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
          </div>
          <div className="flex items-center gap-6">
             <div className="h-10 px-4 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest border border-emerald-100">
                <Activity size={16} /> Systems Nominal
             </div>
             <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all relative">
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></div>
                <Sparkles size={20} />
             </button>
          </div>
        </header>

        <div className="p-12 max-w-7xl mx-auto">
          {error && (
            <div className="mb-10 p-5 bg-rose-50 border border-rose-100 rounded-[2rem] text-rose-600 text-sm font-bold flex items-center gap-4 animate-in slide-in-from-top-4">
              <AlertTriangle className="shrink-0" size={24} />
              <div className="flex-1">{error}</div>
              <button onClick={() => setError(null)} className="p-2 hover:bg-rose-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-[0.3em] mb-3">
                <Sparkles size={18} />
                Medical Intelligence Engine v4.0
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">Patient Clinical <br />Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={() => setAnalysisResult(null)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-3">
                 <HeartPulse size={18} /> Re-Analyze History
               </button>
            </div>
          </div>

          <div className="space-y-16">
            <FileUploader onFilesReady={handleAnalysis} isAnalyzing={isAnalyzing} />
            
            {analysisResult && (
              <div className="animate-in fade-in slide-in-from-top-8 duration-700 delay-200">
                <Dashboard data={analysisResult} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Persistent AI Health Advocate */}
      {analysisResult && (
        <div className={`fixed bottom-10 right-10 z-[60] flex flex-col items-end transition-all ${isChatOpen ? 'w-[28rem]' : 'w-20'}`}>
          {isChatOpen ? (
            <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border border-slate-200 w-full overflow-hidden flex flex-col h-[700px] animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">
              <div className="p-7 bg-indigo-600 text-white flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-tight">Health Advocate</p>
                    <p className="text-[10px] opacity-70 uppercase font-black tracking-[0.2em]">Active Clinical Insights</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-all border border-transparent hover:border-white/20"><X size={24} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#fbfcfd]" ref={scrollRef}>
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 font-medium' : 'bg-white border border-slate-200 text-slate-700 shadow-sm font-medium'}`}>
                      {msg.text || (
                        <div className="flex gap-1.5 py-2 px-1">
                          <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-300"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
                <input 
                  type="text" 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about your imaging report..." 
                  className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isTyping}
                  className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-xl shadow-indigo-100"
                >
                  <Send size={22} />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsChatOpen(true)}
              className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border-4 border-white"
            >
              <MessageSquare size={32} className="group-hover:rotate-6 transition-transform" />
            </button>
          )}
        </div>
      )}

      {/* Immersive Clinical Loading State */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-500 border border-slate-200">
             <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 border-8 border-indigo-50 rounded-full"></div>
                <div className="absolute inset-0 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                   <Brain size={48} className="animate-pulse" />
                </div>
             </div>
             <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Synthesis</h3>
                <p className="text-sm text-slate-500 mt-4 leading-relaxed font-medium">
                  Gemini is performing cross-referential analysis on imaging reports and metabolic data to generate your personalized health advocate report...
                </p>
             </div>
             <div className="pt-4 flex justify-center gap-2">
                <div className="w-2 h-2 bg-indigo-200 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-150"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse delay-300"></div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
