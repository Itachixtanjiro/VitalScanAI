
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

  ui_hints?: Record<string, any>;
}

export type SynthesisResponse = ClinicalAnalysisResult;

// ============================================================
// NEW API CONTRACTS (X-Ray, Cancer, Clinical Notes)
// ============================================================

// --- X-Ray Analysis ---
export interface XRayFinding {
  label: string;
  confidence: number;
}

export interface XRayPredictionResponse {
  ingestion_metadata: {
    document_type: string;
    file_name: string;
  };
  findings: XRayFinding[];
  top_finding: XRayFinding;
  gradcam_heatmap: string | null;  // base64 encoded Grad-CAM overlay
  model_info: {
    architecture: string;
    gradcam_layer: string;
    preprocessing: string;
  };
}

// --- Cervical Cancer Risk ---
export interface CervicalCancerRiskInput {
  Age: number;
  Number_of_sexual_partners: number;
  First_sexual_intercourse: number;
  Num_of_pregnancies: number;
  Smokes: number;
  Smokes_years: number;
  Smokes_packs_year: number;
  Hormonal_Contraceptives: number;
  Hormonal_Contraceptives_years: number;
  IUD: number;
  IUD_years: number;
  STDs: number;
  STDs_number: number;
  STDs_condylomatosis: number;
  STDs_cervical_condylomatosis: number;
  STDs_vaginal_condylomatosis: number;
  STDs_vulvo_perineal_condylomatosis: number;
  STDs_syphilis: number;
  STDs_pelvic_inflammatory_disease: number;
  STDs_genital_herpes: number;
  STDs_molluscum_contagiosum: number;
  STDs_AIDS: number;
  STDs_HIV: number;
  STDs_Hepatitis_B: number;
  STDs_HPV: number;
  STDs_Number_of_diagnosis: number;
  Dx_Cancer: number;
  Dx_CIN: number;
  Dx_HPV: number;
  Dx: number;
}

export interface CervicalCancerRiskResponse {
  risk_class: number;
  risk_probability: number;
  risk_level: 'Low' | 'Moderate' | 'High';
  intensity_level: IntensityLevel;
  interpretation: string;
  clinical_reasoning?: string;
  contributing_factors: string[];
}

// --- Diabetes Risk ---
export interface DiabetesRiskInput {
  Pregnancies: number;
  Glucose: number;
  BloodPressure: number;
  SkinThickness: number;
  Insulin: number;
  BMI: number;
  DiabetesPedigreeFunction: number;
  Age: number;
}

export interface DiabetesRiskResponse {
  risk_class: number;
  risk_probability: number;
  risk_level: 'Low' | 'Moderate' | 'High';
  intensity_level: IntensityLevel;
  interpretation: string;
  clinical_reasoning?: string;
  contributing_factors: string[];
  is_diabetic: boolean;
  probability: number;
}

// --- Clinical Notes Parsing ---
export interface ClinicalNoteInput {
  text: string;
  use_llm?: boolean;   // default true
  use_bert?: boolean;  // default true
}

export interface ClinicalNoteResponse {
  raw_text: string;
  bert_entities: {
    entity_group: string;
    score: number;
    word: string;
    start: number;
    end: number;
  }[];
  structured_data: {
    patient_demographics?: any;
    chief_complaint?: string;
    history_of_present_illness?: string;
    vital_signs?: any;
    diagnosis?: string[];
    medications?: any;
    plan?: any;
    ui_hints?: {
      show_bp_trend: boolean;
      show_medication_list: boolean;
      show_lab_table: boolean;
      critical_alert: boolean;
    };
    [key: string]: any;
  };
  status: string;
}
