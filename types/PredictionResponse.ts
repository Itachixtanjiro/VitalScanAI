
export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type ClinicalStatus = 'normal' | 'warning' | 'critical';
export type ConsensusState = 'Unified' | 'Mixed Signal' | 'Variance Detected';

export interface PredictionMetric {
  name: string;
  value: string | number;
  unit: string;
  status: ClinicalStatus;
  riskLevel: RiskLevel;
  description?: string;
  justification?: string;
  normalRange?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface PredictionRisk {
  label: string;
  level: RiskLevel;
  confidence: number;
  evidence: string[];
}

/**
 * Strict Frontend-Backend Data Contract
 * Finalized for Clinical Consensus Architecture
 */
export interface ClinicalAnalysisResult {
  overall_status: string;
  risk_level: RiskLevel;
  consensus_state: ConsensusState;  // NEW: System verdict on data alignment
  malignancy_risk: number;
  narrative_summary: string;
  clinical_reasoning?: string;

  // Conflict handling
  conflicts?: {
    source: string;
    description: string;
    impact: 'High' | 'Medium';
  }[];

  imaging_artifact?: {
    source_data: string;
    bounding_boxes?: {
      condition: string;
      confidence: number;
      label: string;
      box: { x: number; y: number; width: number; height: number };
      color: string;
    }[];
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

export type PredictionResponse = ClinicalAnalysisResult;
