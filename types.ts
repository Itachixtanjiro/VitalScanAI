
export interface ActiveModules {
  history: boolean;
  metrics: boolean;
  imaging: boolean;
  genomics: boolean;
  trends: boolean;
  actions: boolean;
}

export interface HealthMetric {
  name: string;
  value: number | string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  status: 'normal' | 'warning' | 'critical';
  description: string;
  normalRange?: string;
  justification?: string; // Reviewer-friendly explanation
}

export interface DetailedRiskAssessment {
  observed_signal_intensity: {
    level: 'Low' | 'Moderate' | 'High' | 'Critical';
    confidence: number;
    evidence_points: string[]; // For explainability
  };
  cognitive_progression_observation: 'No Observation' | 'Early' | 'Moderate' | 'Significant Observation';
  metabolic_cardiovascular_profile: 'Low' | 'Elevated' | 'High';
  summary: string;
  review_context: string; // The "Why" behind the assessment
}

export interface ImagingReport {
  id: string;
  title: string;
  date: string;
  modality: 'MRI' | 'CT' | 'X-Ray' | 'Ultrasound';
  findings: string;
  interpretation: string;
  riskScore: number;
  suggestedFollowUp: string[];
  roi_coordinates?: { x: number; y: number; w: number; h: number }[]; // Simulated Grad-CAM areas
  model_confidence: number;
}

export interface HistoricalDataPoint {
  date: string;
  a1c?: number;
  cholesterol_ldl?: number;
  cholesterol_hdl?: number;
  blood_pressure_sys?: number;
  blood_pressure_dia?: number;
  note?: string;
}

export interface GenomicMarker {
  gene: string;
  variant: string;
  interpretation: string;
  significance: 'Pathogenic' | 'Likely Pathogenic' | 'VUS' | 'Benign';
}

export interface AnalysisResult {
  activeModules: ActiveModules;
  summary: string;
  vitalityObservation: number;
  biologicalAge: number;
  patientBio: {
    name: string;
    age: number;
    bloodType: string;
    medicalHistory: string[];
    familyHistory: string;
    socialHistory: string;
  };
  metrics: HealthMetric[];
  imagingReports?: ImagingReport[];
  genomicMarkers?: GenomicMarker[];
  riskAssessment: DetailedRiskAssessment;
  considerationPlan: { task: string; priority: 'High' | 'Medium' | 'Low'; category: string; }[];
  historicalTrends: HistoricalDataPoint[];
  observationsDetected: string[];
  suggestedFollowUp: string[];
}

export interface PreprocessedData {
  extractedText: string;
  keyFindings: string[];
  inferredCategory: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  content: string; 
  category: 'note' | 'lab' | 'imaging' | 'genomics' | 'other';
  preprocessedData?: PreprocessedData;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
