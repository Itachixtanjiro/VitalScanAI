import React, { useState, useRef } from 'react';
import { ClinicalAnalysisResult } from '../types/ClinicalSynthesis';
import { SummaryPanel } from '../components/SummaryPanel';
import { RiskCard } from '../components/RiskCard';
import { GradCamViewer } from '../components/GradCamViewer';
import { TrendCharts } from '../components/TrendCharts';
import { SignalIntensityDisplay } from '../components/SignalIntensityDisplay';
import { Activity, Scan, LayoutTemplate, Database, AlertCircle, ShieldCheck, Scale, Info, ShieldAlert } from 'lucide-react';
import { mockMedGemmaValidate, MedGemmaValidation } from '../utils/MedGemmaMock';

interface DashboardPageProps {
  data: ClinicalAnalysisResult;
}

// Add Analysis Types
interface AnalysisResult {
  condition: string;
  probability: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ data }) => {
  const { imaging_artifact, biomarkers, longitudinal_trends, patient_context, consensus_state, intensity_level, overall_status, signal_intensity_probability, clinical_reasoning } = data;

  // Real-time Analysis State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [medGemmaStatus, setMedGemmaStatus] = useState<MedGemmaValidation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getConsensusStyles = (state: string) => {
    switch (state) {
      case 'Unified': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Mixed Signal': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Variance Detected': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setAnalysisResults(null);
      setMedGemmaStatus(null);
    }
  };

  const triggerAnalysis = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      let isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf');

      // Dynamic Base URL to support LAN/Network interactions
      const baseUrl = `http://${window.location.hostname}:8000`;
      let endpoint = '';

      if (isPdf) {
        endpoint = `${baseUrl}/api/analysis/report/`;
      } else {
        endpoint = `${baseUrl}/api/imaging/predict/chest-xray/`;
      }

      // 1. Call Backend API
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const docType = data.ingestion_metadata?.document_type;

      console.log("Ingestion Metadata:", data.ingestion_metadata);

      // Handle Response based on explicitly assigned backend type
      if (docType === 'clinical_report') {
        const modules = data.modules_run || [];
        const riskDetails = [];
        if (data.cancer_risk) riskDetails.push({ condition: 'Cancer Risk', probability: data.cancer_risk.probability });
        if (data.diabetes_risk) riskDetails.push({ condition: 'Diabetes Risk', probability: data.diabetes_risk.probability });

        if (riskDetails.length > 0) {
          setAnalysisResults(riskDetails);
          setMedGemmaStatus({
            is_safe_to_display: true,
            validation_score: 1.0,
            reasoning: `Analysis of ${data.ingestion_metadata.file_name}: Extracted ${modules.join(', ')}.`
          });
        } else {
          setAnalysisResults([{ condition: 'Report Analyzed', probability: 1.0 }]);
          setMedGemmaStatus({ is_safe_to_display: true, validation_score: 1.0, reasoning: "Clinical data extracted. No specific risk modules triggered." });
        }

      } else if (docType === 'radiograph') {
        // X-Ray Flow
        const predictions = data.predictions;
        // Mock validation or verify if backend provided it
        const validation = await mockMedGemmaValidate(predictions);
        setMedGemmaStatus(validation);
        setAnalysisResults(predictions);
      } else {
        // Fallback or Unknown
        console.warn("Unknown document type:", docType);
        if (data.predictions) {
          setAnalysisResults(data.predictions); // Fallback to Xray style
        } else {
          setAnalysisResults([{ condition: 'Unknown Artifact', probability: 0 }]);
        }
      }

    } catch (error) {
      console.error("Pipeline breakdown:", error);
      alert(`Analysis Failed: ${error}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* 1. Clinical Advisory Banner */}
      <section className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 border border-slate-800 shadow-xl overflow-hidden relative">
        {/* ... (Existing Banner Content) ... */}
        <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-400"><ShieldAlert size={160} /></div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/50"><Info size={32} /></div>
          <div className="space-y-3 flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <h2 className="text-xl font-black tracking-tight uppercase">Clinical Decision Support Advisory</h2>
              <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5">Research Protocol</span>
            </div>
            <p className="text-sm font-medium text-slate-300 leading-relaxed max-w-4xl">
              The synthesis presented below is a probabilistic aggregation of de-identified tokens extracted from clinical artifacts.
              <span className="text-indigo-400 font-bold ml-1">It does not constitute a medical diagnosis.</span> All outputs must be correlated with original patient records by a qualified practitioner.
            </p>
          </div>
        </div>
      </section>

      {/* 2. System Consensus & Status */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Detailed Risk Cards - mapped from Live Analysis OR Static Data */}
        {(analysisResults ? analysisResults.map(res => ({
          name: res.condition,
          value: (res.probability * 100).toFixed(1),
          unit: '%',
          status: res.probability > 0.7 ? 'critical' : res.probability > 0.3 ? 'warning' : 'normal',
          riskLevel: res.probability > 0.7 ? 'Critical' : res.probability > 0.3 ? 'Moderate' : 'Low',
          description: "Real-time probabilistic inference from uploaded artifact.",
          justification: medGemmaStatus?.reasoning
        })) : data.biomarkers).map((metric, idx) => (
          <RiskCard key={idx} metric={metric as any} />
        ))}
      </section>

      {/* 3. Narrative Synthesis */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SummaryPanel
            summary={analysisResults ? `Analysis of ${selectedFile?.name || 'artifact'} complete. Detected ${analysisResults.length} conditions.` : data.narrative_summary}
            reasoning={medGemmaStatus?.reasoning || data.clinical_reasoning || "Clinical reasoning trace pending..."}
          />
        </div>

        <div className="space-y-6">
          <div className={`p-8 rounded-[2.5rem] border ${getConsensusStyles(overall_status === 'Critical' ? 'Variance Detected' : 'Unified')} h-full flex flex-col justify-center`}>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-4">SYSTEM STATE</p>
            <h3 className="text-4xl font-black tracking-tighter mb-2">{isAnalyzing ? "Processing..." : (analysisResults ? "Analysis Done" : overall_status)}</h3>
            <p className="text-sm font-bold opacity-80 leading-relaxed">
              {isAnalyzing ? "Ingesting and synthesizing clinical vectors..." : "Awaiting practitioner review of generated insights."}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Radiographic Verification Trace (Upload & Analysis) */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 flex items-center gap-2"><Scan size={12} className="text-indigo-500" /> Radiographic Verification Trace</h2>

        <div className="bg-white rounded-[3rem] border border-slate-200 p-8 md:p-10 shadow-sm">
          <h3 className="text-2xl font-black text-slate-800 mb-6">Real-time Analysis Engine</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Upload Area */}
            <div className="space-y-6">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, application/dicom, application/pdf"
                onChange={handleFileSelect}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-10 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center text-center transition-colors cursor-pointer group ${selectedFile ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
              >
                {previewUrl ? (
                  <div className="relative mb-4">
                    {selectedFile?.type === 'application/pdf' || selectedFile?.name.endsWith('.pdf') ? (
                      <div className="h-48 w-full rounded-2xl bg-indigo-50 flex flex-col items-center justify-center border border-indigo-100 shadow-sm">
                        <LayoutTemplate size={64} className="text-indigo-400 mb-2" />
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">PDF Report</span>
                      </div>
                    ) : (
                      <img src={previewUrl} alt="Preview" className="h-48 rounded-2xl object-cover shadow-sm" />
                    )}
                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full"><ShieldCheck size={16} /></div>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    <Scan className="text-indigo-600" size={32} />
                  </div>
                )}

                <h4 className="text-lg font-black text-slate-700 mb-1">{selectedFile ? selectedFile.name : "Upload Radiograph"}</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB OK` : "DICOM / PNG / PDF"}</p>

                {!selectedFile && (
                  <button className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 transition-colors">
                    Select Artifact
                  </button>
                )}
              </div>

              {selectedFile && !analysisResults && (
                <button
                  onClick={triggerAnalysis}
                  disabled={isAnalyzing}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? <><Activity className="animate-spin" /> Processing Signal...</> : "Initiate Verification"}
                </button>
              )}
            </div>

            {/* Results Preview */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 text-white p-10 flex flex-col justify-between min-h-[400px]">
              <div className="absolute top-0 right-0 p-10 opacity-10"><Activity size={200} /></div>

              {analysisResults && analysisResults.length > 0 ? (
                <div className="relative z-10 space-y-6 animate-in slide-in-from-bottom duration-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${medGemmaStatus?.is_safe_to_display ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Analysis Complete</p>
                  </div>

                  <div>
                    <h4 className="text-3xl font-black tracking-tight mb-2">{analysisResults[0]?.condition || 'Unknown'}</h4>
                    <p className="text-4xl text-indigo-400 font-black">
                      {((analysisResults[0]?.probability || 0) * 100).toFixed(1)}%
                      <span className="text-sm text-white/40 font-bold uppercase tracking-widest">Confidence</span>
                    </p>
                  </div>

                  {/* MedGemma Insight */}
                  {medGemmaStatus && (
                    <div className={`p-5 rounded-2xl border ${medGemmaStatus.is_safe_to_display ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck size={16} className={medGemmaStatus.is_safe_to_display ? 'text-emerald-400' : 'text-amber-400'} />
                        <span className="text-xs font-black uppercase tracking-widest">MedGemma Validator</span>
                      </div>
                      <p className="text-xs font-medium text-white/80 leading-relaxed">
                        "{medGemmaStatus.reasoning}"
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 mt-4">
                    {analysisResults.slice(1, 4).map((res, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm py-2 border-b border-white/5">
                        <span className="font-bold text-slate-300">{res?.condition || 'N/A'}</span>
                        <span className="font-mono text-slate-400">{((res?.probability || 0) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Standby</p>
                  </div>
                  <h4 className="text-3xl font-black tracking-tight max-w-xs text-slate-700">Awaiting Signal Input</h4>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Grad-CAM & Explainability (Conditional) */}
      {(selectedFile?.type.startsWith('image/') || previewUrl) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GradCamViewer
            originalImage={previewUrl || imaging_artifact?.source_data || ''}
            heatmapOverlay={imaging_artifact?.gradcam_data}
            findings={analysisResults ? analysisResults.map(r => r.condition) : imaging_artifact?.findings || []}
          />
          <SignalIntensityDisplay
            level={intensity_level}
            probability={signal_intensity_probability}
          />
        </section>
      )}

      {/* 6. Longitudinal Trends */}
      <section>
        <TrendCharts data={longitudinal_trends} />
      </section>
    </div >
  );
};
