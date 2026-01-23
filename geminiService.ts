
import { AnalysisResult, UploadedFile, PreprocessedData } from "./types";

/**
 * Preprocessing service - Backend-agnostic.
 * Extracts basic metadata and simulates clinical tokenization.
 */
export async function preprocessFile(file: UploadedFile): Promise<PreprocessedData> {
  // Simulate processing time
  await new Promise(res => setTimeout(res, 800));

  const isImage = file.type.startsWith('image/');
  const findings = isImage 
    ? ["Visible ROI detected", "Anatomical landmark verified"] 
    : ["Numerical value detected", "Clinical keyword extracted"];

  return {
    extractedText: `Clinical extraction successful for ${file.name}. Artifact integrity verified.`,
    keyFindings: findings,
    inferredCategory: file.category
  };
}

/**
 * Returns the current service mode.
 */
export function getServiceMode() {
  return 'backend';
}

/**
 * Orchestrated Synthesis - Stable Mock Implementation.
 * Returns a consistent AnalysisResult shell for the prototype.
 */
export async function analyzeHealthData(files: UploadedFile[]): Promise<AnalysisResult> {
  await new Promise(res => setTimeout(res, 2000));

  // Fix: Aligned mock return object with AnalysisResult and DetailedRiskAssessment interfaces from types.ts
  return {
    activeModules: {
      history: true,
      metrics: true,
      imaging: true,
      genomics: false,
      trends: true,
      actions: true,
    },
    summary: "Consolidated patient history with current laboratory markers.",
    vitalityObservation: 75,
    biologicalAge: 40,
    patientBio: {
      name: "Patient Context",
      age: 40,
      bloodType: "B+",
      medicalHistory: [],
      familyHistory: "Stable",
      socialHistory: "N/A",
    },
    metrics: [],
    imagingReports: [],
    genomicMarkers: [],
    riskAssessment: {
      observed_signal_intensity: {
        level: 'Low',
        confidence: 90,
        evidence_points: ["Regular Border", "No Calcification"],
      },
      cognitive_progression_observation: "No Observation",
      metabolic_cardiovascular_profile: "Low",
      summary: "Stable metabolic state.",
      review_context: "Synthesis of recent laboratory artifacts indicates normoglycemic profile.",
    },
    considerationPlan: [],
    historicalTrends: [],
    observationsDetected: [],
    suggestedFollowUp: [],
  };
}

/**
 * Chat Session Wrapper - Finalized Mock Version.
 * Replaces live Gemini connection with a procedural response generator.
 */
export function createHealthChatSession(analysis: AnalysisResult) {
  return {
    async sendMessageStream({ message }: { message: string }) {
      return (async function* () {
        await new Promise(res => setTimeout(res, 800));
        yield { text: "As your Clinical Advocate, I have reviewed the current synthesis. " };
        await new Promise(res => setTimeout(res, 600));
        yield { text: "Regarding your question about '" + message + "', the records indicate a stable baseline with no acute flags detected in the recent artifacts. " };
        await new Promise(res => setTimeout(res, 600));
        yield { text: "Please consult with your primary healthcare provider for a definitive clinical correlation." };
      })();
    }
  };
}
