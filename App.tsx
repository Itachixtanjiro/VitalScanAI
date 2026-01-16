
import React, { useEffect, useRef, useState } from 'react';
import { useAnalysis } from './hooks/useAnalysis';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { FileUploader } from './components/FileUploader';
import { BackendConfigModal } from './components/BackendConfigModal';
import { AlertTriangle, MessageSquare, Send, X, Sparkles, Send as SendIcon } from 'lucide-react';

const App: React.FC = () => {
  const { analysisResult, isAnalyzing, error, setError, performAnalysis, resetAnalysis } = useAnalysis();
  const { isChatOpen, setIsChatOpen, chatMessages, isTyping, initChat, sendMessage } = useChat(`I am your MedGemma Advocate. Please upload your health records (notes, labs, or imaging) to begin the synthesis.`);
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysisResult) {
      initChat(analysisResult);
    }
  }, [analysisResult]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages]);

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans overflow-x-hidden">
      <Sidebar onReset={resetAnalysis} onOpenConfig={() => setIsConfigOpen(true)} isActive={!!analysisResult} />

      <main className="flex-1 bg-[#fbfcfd]">
        <Header />

        <div className="p-12 max-w-7xl mx-auto">
          {error && (
            <div className="mb-10 p-6 bg-rose-50 border border-rose-100 rounded-[2.5rem] text-rose-700 shadow-xl animate-in slide-in-from-top-4">
              <div className="flex items-center gap-4 mb-3">
                <AlertTriangle className="text-rose-600" size={24} />
                <h4 className="font-black text-lg">System Error</h4>
              </div>
              <p className="text-sm opacity-80 mb-4">{error}</p>
              <button onClick={() => setIsConfigOpen(true)} className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-black uppercase">Update Backend</button>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-[0.3em] mb-3">
                <Sparkles size={18} /> MedGemma 1.5 Synthesis
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">Patient Clinical Dashboard</h1>
            </div>
          </div>

          <div className="space-y-16">
            <FileUploader onFilesReady={performAnalysis} isAnalyzing={isAnalyzing} />
            {analysisResult && <Dashboard data={analysisResult} />}
          </div>
        </div>
      </main>

      {isConfigOpen && <BackendConfigModal onClose={() => setIsConfigOpen(false)} />}

      {analysisResult && (
        <div className={`fixed bottom-10 right-10 z-[60] flex flex-col items-end transition-all ${isChatOpen ? 'w-[28rem]' : 'w-20'}`}>
          {isChatOpen ? (
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 w-full h-[600px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
              <div className="p-7 bg-indigo-600 text-white flex justify-between items-center font-black">
                <div className="flex items-center gap-4">
                  <MessageSquare size={20} />
                  <p>MedGemma Advocate</p>
                </div>
                <button onClick={() => setIsChatOpen(false)}><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/30" ref={scrollRef}>
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-100 text-slate-700 shadow-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && <div className="text-xs text-indigo-400 font-black animate-pulse px-2">Reasoning...</div>}
              </div>
              <div className="p-6 bg-white border-t border-slate-100 flex gap-2">
                <input 
                  type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && (sendMessage(userInput), setUserInput(''))}
                  placeholder="Ask a medical question..."
                  className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button onClick={() => (sendMessage(userInput), setUserInput(''))} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg"><SendIcon size={20} /></button>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsChatOpen(true)} className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-105 transition-all border-4 border-white"><MessageSquare size={32} /></button>
          )}
        </div>
      )}

      {isAnalyzing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-8 text-center">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md w-full space-y-8 animate-in zoom-in-95">
             <div className="w-24 h-24 mx-auto border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <div>
                <h3 className="text-2xl font-black text-slate-900">Streaming to MedGemma</h3>
                <p className="text-sm text-slate-500 mt-4 leading-relaxed">Synthesizing clinical artifacts and imaging results...</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
