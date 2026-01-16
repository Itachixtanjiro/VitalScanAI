
export interface HealthMetric {
  name: string;
  value: number | string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'Low' | 'Moderate' | 'High'; // Aligned with MedGemma 1.5 requirement
  status: 'normal' | 'warning' | 'critical';
  description: string;
  normalRange?: string;
}

export interface BodySystemStatus {
  system: string;
  status: 'Optimal' | 'Stable' | 'Needs Attention' | 'At Risk';
  score: number; // 0-100
}

export interface Prediction {
  condition: string;
  riskLevel: 'Low' | 'Moderate' | 'High';
  confidence: number;
  reasoning: string;
}

export interface ResearchLink {
  title: string;
  uri: string;
}

export interface ActionItem {
  task: string;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
}

export interface GenomicMarker {
  gene: string;
  variant: string;
  interpretation: string;
  significance: 'Pathogenic' | 'VUS' | 'Likely Benign' | 'Benign';
}

export interface RiskAssessment {
  malignancy_risk: 'Low' | 'Elevated' | 'High' | 'Critical';
  summary: string;
}

export interface ImagingReport {
  id: string;
  title: string;
  date: string;
  modality: 'MRI' | 'CT' | 'X-Ray' | 'Ultrasound';
  findings: string;
  interpretation: string;
  riskScore: number; // 0-100 (Simplified Cancer Risk Interpretation)
  nextSteps: string[];
}

export interface HistoricalDataPoint {
  date: string;
  a1c?: number;
  cholesterol_ldl?: number;
  cholesterol_hdl?: number;
  blood_pressure_sys?: number;
  blood_pressure_dia?: number;
}

export interface AnalysisResult {
  summary: string;
  vitalityScore: number;
  biologicalAge: number;
  patientBio: {
    name: string;
    age: number;
    bloodType: string;
  };
  metrics: HealthMetric[];
  bodySystems: BodySystemStatus[];
  predictions: Prediction[];
  imagingReports?: ImagingReport[];
  genomicMarkers?: GenomicMarker[];
  riskAssessment?: RiskAssessment;
  actionPlan: ActionItem[];
  historicalTrends: HistoricalDataPoint[];
  flaggedNotes: string[];
  researchSources: ResearchLink[];
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  content: string;
  category: 'note' | 'lab' | 'imaging' | 'genomics' | 'other';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
