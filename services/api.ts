
import { ClinicalAnalysisResult, IntensityLevel, ConsensusState, ClinicalStatus } from "../types/ClinicalSynthesis";
import { UploadedFile } from "../types";

// Backend API Base URL - Uses environment variable, falls back to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Health check for the MedGemma LLM service
 */
export const checkMedGemmaHealth = async (): Promise<{
  status: string;
  circuit_breaker: string;
  circuit_breaker_failures: number;
  test_response?: string;
  error?: string;
}> => {
  const response = await fetch(`${API_BASE_URL}/api/llm/health`);
  return response.json();
};

/**
 * Health check for the main backend service
 */
export const checkBackendHealth = async (): Promise<{
  status: string;
  mode: string;
}> => {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
};

/**
 * Analyzes health artifacts using the backend Synthesis API.
 * This calls the real ML pipeline and LLM summarization.
 */
export const analyzeHealthArtifacts = async (files: UploadedFile[]): Promise<ClinicalAnalysisResult> => {
  // Convert UploadedFile objects to actual File/Blob objects for FormData
  const formData = new FormData();

  for (const file of files) {
    // If the file has actual content (base64 or blob), convert it
    if (file.content) {
      // Handle base64 content
      if (file.content.startsWith('data:')) {
        const response = await fetch(file.content);
        const blob = await response.blob();
        formData.append('files', blob, file.name);
      } else {
        // Plain text content
        const blob = new Blob([file.content], { type: file.type });
        formData.append('files', blob, file.name);
      }
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/synthesis/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Analysis failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Backend API Error:', error);
    throw new Error(`Backend connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. Is the backend running at ${API_BASE_URL}?`);
  }
};

/**
 * Fallback mock data generator for when backend is unavailable
 */
const generateMockData = (files: UploadedFile[]): ClinicalAnalysisResult => {
  const hasImaging = files.some(f => f.category === 'imaging' || f.type.startsWith('image/'));
  const hasLabs = files.some(f => f.category === 'lab');

  let intensity: IntensityLevel = 'Low';
  let consensus: ConsensusState = 'Unified';
  let status = "Baseline Observations Detected";
  let prob = 12;

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
    }
  ] : [];

  return {
    overall_status: status,
    intensity_level: intensity,
    consensus_state: consensus,
    signal_intensity_probability: prob,
    narrative_summary: `[MOCK DATA] The synthesis yielded a ${consensus.toLowerCase()} profile with ${intensity.toLowerCase()} signal intensity.`,
    clinical_reasoning: `[MOCK DATA] Backend unavailable. Using simulated data.`,
    biomarkers,
    imaging_artifact: hasImaging ? {
      source_data: "[Binary Data]",
      modality: "X-Ray",
      findings: "Mock imaging findings - backend unavailable."
    } : undefined,
    longitudinal_trends,
    patient_context: {
      age: 45,
      blood_type: "A+",
      history: ["Managed Hypertension", "Type 2 Prediabetes Observation"]
    }
  };
};
