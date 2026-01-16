
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, UploadedFile, ChatMessage } from "./types";

export type ServiceMode = 'backend' | 'aistudio';

let BACKEND_URL = localStorage.getItem('VITALSCAN_BACKEND_URL') || "http://localhost:8000";
let SERVICE_MODE: ServiceMode = (localStorage.getItem('VITALSCAN_SERVICE_MODE') as ServiceMode) || 'backend';

export const setBackendUrl = (url: string) => {
  const formattedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  BACKEND_URL = formattedUrl;
  localStorage.setItem('VITALSCAN_BACKEND_URL', formattedUrl);
};

export const setServiceMode = (mode: ServiceMode) => {
  SERVICE_MODE = mode;
  localStorage.setItem('VITALSCAN_SERVICE_MODE', mode);
};

export const getBackendUrl = () => BACKEND_URL;
export const getServiceMode = () => SERVICE_MODE;

/**
 * AI Studio Native Analysis Implementation
 * Follows the Chain-of-Thought logic from the MedGemma Colab
 */
async function analyzeWithAIStudio(files: UploadedFile[]): Promise<AnalysisResult> {
  // Use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts = files.map(file => {
    if (file.type.startsWith('image/')) {
      return {
        inlineData: {
          mimeType: file.type,
          data: file.content.includes(',') ? file.content.split(',')[1] : file.content
        }
      };
    }
    return { text: `File (${file.name} - ${file.category}):\n${file.content}` };
  });

  const prompt = `Perform a comprehensive clinical synthesis using a multi-step medical reasoning process:
  1. ANALYZE IMAGING: Interpret any DICOM/X-ray/MRI findings for anomalies (lesions, atrophy, malignancy markers).
  2. EXTRACT LABS: Parse text-based lab reports (A1C, BP, Lipid profiles) into structured values.
  3. CLINICAL SUMMARIZATION: Analyze historical notes for disease progression (e.g., Alzheimer's stages).
  4. CHAIN OF THOUGHT: Combine these inputs to determine overall risk levels and suggest next steps.

  Return the result in the specified JSON format strictly.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [...parts, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          vitalityScore: { type: Type.NUMBER },
          biologicalAge: { type: Type.NUMBER },
          patientBio: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              age: { type: Type.NUMBER },
              bloodType: { type: Type.STRING }
            }
          },
          metrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.STRING },
                unit: { type: Type.STRING },
                trend: { type: Type.STRING },
                riskLevel: { type: Type.STRING },
                status: { type: Type.STRING },
                description: { type: Type.STRING },
                normalRange: { type: Type.STRING }
              }
            }
          },
          bodySystems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                system: { type: Type.STRING },
                status: { type: Type.STRING },
                score: { type: Type.NUMBER }
              }
            }
          },
          imagingReports: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                date: { type: Type.STRING },
                modality: { type: Type.STRING },
                findings: { type: Type.STRING },
                interpretation: { type: Type.STRING },
                riskScore: { type: Type.NUMBER },
                nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          symptomsDetected: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedNextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          riskAssessment: {
            type: Type.OBJECT,
            properties: {
              malignancy_risk: {
                type: Type.OBJECT,
                properties: {
                  level: { type: Type.STRING },
                  confidence: { type: Type.NUMBER }
                }
              },
              cognitive_progression_risk: { type: Type.STRING },
              metabolic_cardiovascular_risk: { type: Type.STRING },
              summary: { type: Type.STRING }
            }
          }
        }
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return {
      ...data,
      predictions: data.predictions || [],
      genomicMarkers: data.genomicMarkers || [],
      riskAssessment: data.riskAssessment || { 
        malignancy_risk: { level: "Low", confidence: 0.1 },
        cognitive_progression_risk: "No Progression",
        metabolic_cardiovascular_risk: "Low",
        summary: "Synthesis complete. No critical anomalies detected." 
      },
      actionPlan: data.actionPlan || [],
      historicalTrends: data.historicalTrends || [],
      flaggedNotes: data.flaggedNotes || [],
      researchSources: data.researchSources || [],
      symptomsDetected: data.symptomsDetected || [],
      suggestedNextSteps: data.suggestedNextSteps || ["Continue routine monitoring."]
    } as AnalysisResult;
  } catch (e) {
    throw new Error("Failed to parse AI Studio response");
  }
}

/**
 * Custom Backend Implementation
 */
async function analyzeWithBackend(files: UploadedFile[]): Promise<AnalysisResult> {
  const bundle = files.map(file => ({
    type: file.type.startsWith('image/') ? "image" : "text",
    mime_type: file.type,
    data: file.content.includes(',') ? file.content.split(',')[1] : file.content,
    name: file.name,
    category: file.category
  }));

  const response = await fetch(`${BACKEND_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context_bundle: bundle }),
  });

  if (!response.ok) throw new Error(`Backend Error: ${response.status}`);
  const data = await response.json();
  return data as AnalysisResult;
}

/**
 * Main Entry Point for Analysis
 */
export async function analyzeHealthData(files: UploadedFile[]): Promise<AnalysisResult> {
  if (SERVICE_MODE === 'aistudio') {
    return analyzeWithAIStudio(files);
  }
  return analyzeWithBackend(files);
}

/**
 * Chat Logic (Hybrid)
 */
export function createHealthChatSession(analysis: AnalysisResult) {
  if (SERVICE_MODE === 'aistudio') {
    // Always use process.env.API_KEY directly
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are a medical analyst assisting with this record: ${analysis.summary}. 
        Answer questions clearly based on the clinical data. Avoid final diagnoses without physician oversight.`
      }
    });

    return {
      sendMessageStream: async function* ({ message }: { message: string }) {
        const stream = await chat.sendMessageStream({ message });
        for await (const chunk of stream) {
          // Access .text property directly as per guidelines
          yield { text: chunk.text };
        }
      }
    };
  }

  // Backend Chat
  return {
    sendMessageStream: async function* ({ message }: { message: string }) {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context: analysis }),
      });
      const data = await response.json();
      const words = data.response.split(' ');
      let current = '';
      for (const word of words) {
        current += word + ' ';
        yield { text: current };
        await new Promise(r => setTimeout(r, 20));
      }
    }
  };
}
