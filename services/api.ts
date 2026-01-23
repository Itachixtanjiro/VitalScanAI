
import { ClinicalAnalysisResult, IntensityLevel, ConsensusState, ClinicalStatus } from "../types/ClinicalSynthesis";
import { UploadedFile } from "../types";

/**
 * Generates a mock Clinical Analysis Result based on uploaded artifacts.
 * This simulates a de-identified synthesis process for research-only decision support.
 */
const generateConsensusData = (files: UploadedFile[]): ClinicalAnalysisResult => {
  const hasImaging = files.some(f => f.category === 'imaging' || f.type.startsWith('image/'));
  const hasLabs = files.some(f => f.category === 'lab');
  
  let intensity: IntensityLevel = 'Low';
  let consensus: ConsensusState = 'Unified';
  let status = "Baseline Observations Detected";
  let prob = 12;

  // Simulate logic based on multimodal artifacts
  if (hasImaging && hasLabs) {
    intensity = 'High';
    consensus = 'Unified'; 
    status = "Observation Profile: Correlation Advised";
    prob = 74;
  } else if (hasLabs && !hasImaging) {
    intensity = 'Moderate';
    consensus = 'Mixed Signal'; 
    status = "Monitoring Consideration Suggested";
    prob = 38;
  }

  // Generate realistic historical trends for TrendCharts
  const longitudinal_trends = [
    { date: "2024-Q1", a1c: 5.6, blood_pressure_sys: 128, blood_pressure_dia: 82 },
    { date: "2024-Q2", a1c: 5.7, blood_pressure_sys: 130, blood_pressure_dia: 84 },
    { date: "2024-Q3", a1c: 5.9, blood_pressure_sys: 135, blood_pressure_dia: 88 },
    { date: "2024-Q4", a1c: 6.2, blood_pressure_sys: 140, blood_pressure_dia: 90 },
    { date: "2025-Q1", a1c: intensity === 'High' ? 6.8 : 6.0, blood_pressure_sys: 142, blood_pressure_dia: 92 }
  ];

  const biomarkers = hasLabs ? [
    { 
      name: "HbA1c", 
      value: intensity === 'High' ? "6.8" : "6.0", 
      unit: "%", 
      status: (intensity === 'High' ? 'critical' : 'warning') as ClinicalStatus,
      reference_range: "4.0 - 5.6",
      description: "Synthesis identifies an upward metabolic trajectory."
    },
    {
      name: "Estimated GFR",
      value: "82",
      unit: "mL/min",
      status: "normal" as ClinicalStatus,
      reference_range: ">60",
      description: "Renal profile remains within established reference limits."
    },
    {
      name: "LDL Cholesterol",
      value: "142",
      unit: "mg/dL",
      status: "warning" as ClinicalStatus,
      reference_range: "<100",
      description: "Elevated lipid markers observed in recent artifacts."
    }
  ] : [];

  return {
    overall_status: status,
    intensity_level: intensity,
    consensus_state: consensus,
    signal_intensity_probability: prob,
    narrative_summary: `The synthesis yielded a ${consensus.toLowerCase()} profile with ${intensity.toLowerCase()} signal intensity. ${intensity === 'High' ? 'Observations within the radiographic artifacts correlate with elevated metabolic markers.' : 'Clinical artifacts remain largely consistent with baseline observations.'}`,
    clinical_reasoning: `Synthesis derived from ${files.length} artifacts including ${hasImaging ? 'imaging pixel metadata' : 'no imaging artifacts'}. Reliability coefficient estimated at ${prob + 10}%. Clinical correlation mandatory.`,
    biomarkers,
    imaging_artifact: hasImaging ? {
      source_data: files.find(f => f.category === 'imaging' || f.type.startsWith('image/'))?.content || "",
      modality: "MRI",
      findings: intensity === 'High' ? "Observed hyper-intensity in ROI; practitioner review advised." : "No significant radiographic variance detected."
    } : undefined,
    longitudinal_trends,
    patient_context: { 
      age: 45, 
      blood_type: "A+", 
      history: ["Managed Hypertension", "Type 2 Prediabetes Observation"] 
    }
  };
};

export const analyzeHealthArtifacts = async (files: UploadedFile[]): Promise<ClinicalAnalysisResult> => {
  // Simulate network latency for the inference cluster
  await new Promise(resolve => setTimeout(resolve, 3000));
  return generateConsensusData(files);
};
