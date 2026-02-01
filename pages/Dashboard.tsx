import React, { useState, useRef } from 'react';
import { ClinicalAnalysisResult } from '../types/ClinicalSynthesis';
import { RiskCard } from '../components/RiskCard';
import { GenomicPredictionPanel, GenomicVariant, GenomicRiskScore, GenomicPrediction } from '../components/GenomicPredictionPanel';
import { TrendCharts } from '../components/TrendCharts';
import { Activity, Scan, LayoutTemplate, Info, ShieldAlert, Dna, Pill } from 'lucide-react';
import uiRegistry from '../ui_registry.json';

// Smart Components (Modernization Phase 3)
import { SmartVitals } from '../components/smart/SmartVitals';
import { SmartImaging } from '../components/smart/SmartImaging';
import { ClinicalFeed } from '../components/smart/ClinicalFeed';
import { CholesterolData, A1CData, BloodPressureData } from '../components/HealthMetricsPanel'; // Import types

interface DashboardPageProps {
  data: ClinicalAnalysisResult;
}

// Add Analysis Types
interface AnalysisResult {
  condition: string;
  probability: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ data }) => {
  const { imaging_artifact, biomarkers, longitudinal_trends, patient_context, consensus_state, intensity_level, overall_status, signal_intensity_probability, clinical_reasoning, ui_hints } = data;

  // UI Registry Lookup
  const alertConfig = uiRegistry.ui_components.find(c => c.id === 'critical_alert');
  const isCriticalAlert = ui_hints?.critical_alert && alertConfig;

  // Real-time Analysis State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [boundingBoxes, setBoundingBoxes] = useState<any[]>([]);
  const [gradcamHeatmap, setGradcamHeatmap] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Health Metrics State (populated after report analysis)
  const [cholesterolData, setCholesterolData] = useState<CholesterolData[]>([]);
  const [a1cData, setA1cData] = useState<A1CData[]>([]);
  const [bloodPressureData, setBloodPressureData] = useState<BloodPressureData[]>([]);

  // Genomic Data State
  const [genomicVariants, setGenomicVariants] = useState<GenomicVariant[]>([]);
  const [genomicRiskScores, setGenomicRiskScores] = useState<GenomicRiskScore[]>([]);
  const [genomicPredictions, setGenomicPredictions] = useState<GenomicPrediction[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setAnalysisResults(null);
      setBoundingBoxes([]);
      setGradcamHeatmap(null);
      // Reset health metrics on new file selection
      setCholesterolData([]);
      setA1cData([]);
      setBloodPressureData([]);
      setGenomicVariants([]);
      setGenomicRiskScores([]);
      setGenomicPredictions([]);
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

      // Handle Response based on explicitly assigned backend type
      if (docType === 'clinical_report') {
        const riskDetails = [];
        if (data.cancer_risk) riskDetails.push({ condition: 'Cancer Risk', probability: data.cancer_risk.probability });
        if (data.diabetes_risk) riskDetails.push({ condition: 'Diabetes Risk', probability: data.diabetes_risk.probability });

        // Extract and set health metrics
        if (data.health_metrics) {
          if (data.health_metrics.cholesterol?.length > 0) {
            setCholesterolData(data.health_metrics.cholesterol);
          }
          if (data.health_metrics.a1c?.length > 0) {
            setA1cData(data.health_metrics.a1c);
          }
          if (data.health_metrics.blood_pressure?.length > 0) {
            setBloodPressureData(data.health_metrics.blood_pressure);
          }
        }

        // Extract genomic data
        if (data.genomic_data) {
          if (data.genomic_data.variants?.length > 0) {
            setGenomicVariants(data.genomic_data.variants);
          }
          if (data.genomic_data.risk_scores?.length > 0) {
            setGenomicRiskScores(data.genomic_data.risk_scores);
          }
          if (data.genomic_data.predictions?.length > 0) {
            setGenomicPredictions(data.genomic_data.predictions);
          }
        }

        if (riskDetails.length > 0) {
          setAnalysisResults(riskDetails);
        } else {
          setAnalysisResults([{ condition: 'Report Analyzed', probability: 1.0 }]);
        }

      } else if (docType === 'radiograph') {
        // X-Ray Flow (new format: findings with label/confidence)
        const findings = data.findings || [];
        const mapped = findings.map((f: { label: string; confidence: number }) => ({
          condition: f.label,
          probability: f.confidence
        }));
        setAnalysisResults(mapped);
        // Store Grad-CAM heatmap overlay if available
        if (data.gradcam_heatmap) {
          setGradcamHeatmap(data.gradcam_heatmap);
        }
      } else {
        // Fallback or Unknown
        console.warn("Unknown document type:", docType);
        if (data.findings) {
          const mapped = data.findings.map((f: { label: string; confidence: number }) => ({
            condition: f.label,
            probability: f.confidence
          }));
          setAnalysisResults(mapped);
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
      {/* 1. Clinical Advisory Banner (Dynamic based on ui_hints) */}
      <section className={`${isCriticalAlert ? 'bg-rose-600' : 'bg-slate-900'} text-white rounded-[2.5rem] p-8 md:p-10 border border-slate-800 shadow-xl overflow-hidden relative transition-colors duration-500`}>
        {/* ... (Existing Banner Content) ... */}
        <div className="absolute top-0 right-0 p-8 opacity-5 text-white"><ShieldAlert size={160} /></div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className={`w-16 h-16 rounded-3xl ${isCriticalAlert ? 'bg-white text-rose-600' : 'bg-indigo-600 text-white'} flex items-center justify-center shrink-0 shadow-lg shadow-black/20`}><Info size={32} /></div>
          <div className="space-y-3 flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <h2 className="text-xl font-black tracking-tight uppercase">{isCriticalAlert ? alertConfig?.title : "Clinical Decision Support Advisory"}</h2>
              <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5">{isCriticalAlert ? "Action Required" : "Research Protocol"}</span>
            </div>
            <p className="text-sm font-medium text-white/90 leading-relaxed max-w-4xl">
              {isCriticalAlert ? alertConfig?.description : "The synthesis presented below is a probabilistic aggregation of de-identified tokens extracted from clinical artifacts."}
              {!isCriticalAlert && <span className="text-indigo-400 font-bold ml-1">It does not constitute a medical diagnosis.</span>}
              All outputs must be correlated with original patient records by a qualified practitioner.
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
          status: res.probability > 0.5 ? 'critical' : res.probability > 0.15 ? 'warning' : 'normal',
          riskLevel: res.probability > 0.5 ? 'Critical' : res.probability > 0.15 ? 'Moderate' : 'Low',
          description: "Real-time probabilistic inference from uploaded artifact.",
          justification: "Inference-based probability."
        })) : data.biomarkers).map((metric, idx) => (
          <RiskCard key={idx} metric={metric as any} />
        ))}
      </section>

      {/* 3. Clinical Feed (Smart Component replacement for Narrative Synthesis) */}
      <ClinicalFeed
        summary={analysisResults ? `Analysis of ${selectedFile?.name || 'artifact'} complete. Detected ${analysisResults.length} conditions.` : data.narrative_summary}
        reasoning={data.clinical_reasoning || "Clinical reasoning trace pending..."}
        status={overall_status}
        isAnalyzing={isAnalyzing}
        analysisCount={analysisResults ? analysisResults.length : 0}
      />

      {/* 3b. Active Medications List (Dynamic Trigger) */}
      {ui_hints?.show_medication_list && (
        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm animate-in slide-in-from-bottom">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Pill size={20} /></div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Active Medications</h3>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-sm font-medium text-center">
            Medication list extraction visualization is ready for implementation.
            <br />(Triggered by 'show_medication_list' hint)
          </div>
        </section>
      )}

      {/* 4. Smart Radiographic Verification Trace (Upload & Analysis) */}
      <section className="space-y-6">
        {/* File Upload UI */}
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
                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full"><Info size={16} /></div>
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

            {/* Results Preview (Simplified since details are in SmartImaging) */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 text-white p-10 flex flex-col justify-between min-h-[400px]">
              <div className="absolute top-0 right-0 p-10 opacity-10"><Activity size={200} /></div>

              {analysisResults && analysisResults.length > 0 ? (
                <div className="relative z-10 space-y-6 animate-in slide-in-from-bottom duration-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-emerald-400 animate-pulse`} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Analysis Complete</p>
                  </div>

                  <div>
                    <h4 className="text-3xl font-black tracking-tight mb-2">{analysisResults[0]?.condition || 'Unknown'}</h4>
                    <p className="text-4xl text-indigo-400 font-black">
                      {((analysisResults[0]?.probability || 0) * 100).toFixed(1)}%
                      <span className="text-sm text-white/40 font-bold uppercase tracking-widest">Confidence</span>
                    </p>
                  </div>

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

      {/* 5. Smart Imaging Analysis (Replaces Region & Explainability) */}
      <SmartImaging
        selectedFile={selectedFile}
        previewUrl={previewUrl}
        imagingArtifact={imaging_artifact}
        boundingBoxes={boundingBoxes}
        gradcamHeatmap={gradcamHeatmap}
        analysisResults={analysisResults}
        isAnalyzing={isAnalyzing}
        intensityLevel={intensity_level}
        signalProbability={signal_intensity_probability}
        reasoning={clinical_reasoning}
      />

      {/* 6. Smart Vitals Panel (Replaces Health Metrics) */}
      <SmartVitals
        cholesterol={cholesterolData}
        a1c={a1cData}
        bp={bloodPressureData}
        patientAge={patient_context?.age}
        uiHints={ui_hints}
      />

      {/* 7. Genomic Risk Analysis */}
      {(genomicVariants.length > 0 || genomicRiskScores.length > 0 || genomicPredictions.length > 0) && (
        <section className="animate-in slide-in-from-bottom duration-700">
          <div className="flex items-center gap-2 mb-6">
            <Dna size={14} className="text-indigo-500" />
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Genomic Analysis</h2>
          </div>
          <GenomicPredictionPanel
            variants={genomicVariants}
            riskScores={genomicRiskScores}
            predictions={genomicPredictions}
          />
        </section>
      )}

      {/* 8. Longitudinal Trends */}
      <section>
        <TrendCharts data={longitudinal_trends} />
      </section>
    </div >
  );
};
