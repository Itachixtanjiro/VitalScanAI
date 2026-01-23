
export type IntensityLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type ClinicalStatus = 'normal' | 'warning' | 'critical';
export type ConsensusState = 'Unified' | 'Mixed Signal' | 'Variance Detected';

export interface SynthesisMetric {
  name: string;
  value: string | number;
  unit: string;
  status: ClinicalStatus;
  intensityLevel: IntensityLevel;
  description?: string;
  reviewContext?: string;
  normalRange?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface SynthesisObservation {
  label: string;
  level: IntensityLevel;
  confidence: number;
  evidence: string[];
}

/**
 * Strict Frontend-Backend Data Contract
 * Finalized for Clinical Consensus Architecture (Non-Diagnostic)
 */
export interface ClinicalAnalysisResult {
  overall_status: string;
  intensity_level: IntensityLevel;
  consensus_state: ConsensusState;
  signal_intensity_probability: number;
  narrative_summary: string;
  clinical_reasoning?: string;

  conflicts?: {
    source: string;
    description: string;
    impact: 'High' | 'Medium';
  }[];

  imaging_artifact?: {
    source_data: string;
    gradcam_data?: string;
    roi_coordinates?: { x: number; y: number; w: number; h: number; }[];
    modality: string;
    findings: string;
  };

  biomarkers: {
    name: string;
    value: string | number;
    unit: string;
    status: ClinicalStatus;
    reference_range?: string;
    description?: string;
  }[];

  longitudinal_trends: {
    date: string;
    [key: string]: any;
  }[];

  patient_context?: {
    age: number;
    blood_type: string;
    history: string[];
  };
}

export type SynthesisResponse = ClinicalAnalysisResult;
