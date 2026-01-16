
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AnalysisResult, UploadedFile } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are MedGemma 1.5, a specialized medical reasoning engine designed for deep clinical synthesis. 
Your primary goal is to take a multimodal context bundle (text notes, lab results, and diagnostic images) and produce a structured clinical insight dashboard.

Clinical Protocol:
1. MULTIMODAL SYNTHESIS: Cross-reference visual findings in images (e.g., DICOM/JPG scans) with quantitative lab data (e.g., A1C, lipids) and qualitative physician notes.
2. RISK STRATIFICATION: For every health metric, assign a 'riskLevel' (Low, Moderate, High) based on current clinical guidelines (ACC/AHA, ADA, etc.).
3. NARRATIVE GENERATION: Provide a professional, concise summary that highlights critical immediate concerns.
4. PREDICTIVE ANALYTICS: Use long-term trends to predict potential morbidity risks with confidence scores.
5. ONCOLOGY & GENOMICS: Extract any genetic markers and provide a focused 'riskAssessment' for malignancy.

Strict JSON format is mandatory.
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Professional clinical summary narrative." },
    vitalityScore: { type: Type.INTEGER },
    biologicalAge: { type: Type.INTEGER },
    patientBio: {
      type: Type.OBJECT,
      properties: { name: { type: Type.STRING }, age: { type: Type.NUMBER }, bloodType: { type: Type.STRING } },
      required: ["name", "age", "bloodType"]
    },
    metrics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.STRING },
          unit: { type: Type.STRING },
          trend: { type: Type.STRING, enum: ["up", "down", "stable"] },
          riskLevel: { type: Type.STRING, enum: ["Low", "Moderate", "High"] },
          status: { type: Type.STRING, enum: ["normal", "warning", "critical"] },
          description: { type: Type.STRING },
          normalRange: { type: Type.STRING }
        },
        required: ["name", "value", "riskLevel", "status"]
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
    predictions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          condition: { type: Type.STRING },
          riskLevel: { type: Type.STRING, enum: ["Low", "Moderate", "High"] },
          confidence: { type: Type.NUMBER },
          reasoning: { type: Type.STRING }
        },
        required: ["condition", "riskLevel", "reasoning"]
      }
    },
    genomicMarkers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          gene: { type: Type.STRING },
          variant: { type: Type.STRING },
          interpretation: { type: Type.STRING },
          significance: { type: Type.STRING, enum: ["Pathogenic", "VUS", "Likely Benign", "Benign"] }
        }
      }
    },
    riskAssessment: {
      type: Type.OBJECT,
      properties: {
        malignancy_risk: { type: Type.STRING, enum: ["Low", "Elevated", "High", "Critical"] },
        summary: { type: Type.STRING }
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
    actionPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          task: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          category: { type: Type.STRING }
        }
      }
    },
    historicalTrends: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          a1c: { type: Type.NUMBER },
          cholesterol_ldl: { type: Type.NUMBER },
          cholesterol_hdl: { type: Type.NUMBER },
          blood_pressure_sys: { type: Type.NUMBER },
          blood_pressure_dia: { type: Type.NUMBER }
        }
      }
    },
    flaggedNotes: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["summary", "metrics", "predictions", "vitalityScore", "patientBio", "actionPlan"]
};

export async function analyzeHealthData(files: UploadedFile[]): Promise<AnalysisResult> {
  // Convert multimodal files into a single context bundle
  const parts: any[] = [{ text: "MedGemma 1.5: Initiate Multimodal Clinical Synthesis." }];

  files.forEach(file => {
    if (file.type.startsWith('image/') || file.type.includes('dicom')) {
      // For images/DICOM (simulated as JPG/PNG for the vision model)
      parts.push({ 
        inlineData: { 
          mimeType: file.type.includes('dicom') ? 'image/jpeg' : file.type, 
          data: file.content.split(',')[1] 
        } 
      });
      parts.push({ text: `Source Context (Imaging): ${file.name}` });
    } else {
      // For text-based records (PDF content extracted, CSV, JSON, TXT)
      parts.push({ text: `Source Artifact (${file.category} - ${file.name}):\n${file.content}` });
    }
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ parts }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: responseSchema as any,
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 12000 } // High thinking budget for deep clinical reasoning
    }
  });

  const textOutput = response.text;
  if (!textOutput) throw new Error("MedGemma 1.5: Empty response received.");
  
  const result = JSON.parse(textOutput);
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const researchSources = groundingChunks.map((c: any) => ({
    title: c.web?.title || 'Clinical Evidence',
    uri: c.web?.uri || ''
  })).filter((s: any) => s.uri);

  return { 
    ...result, 
    researchSources: researchSources.slice(0, 5),
    // Ensure all required arrays exist even if model misses them
    metrics: result.metrics || [],
    predictions: result.predictions || [],
    bodySystems: result.bodySystems || [],
    actionPlan: result.actionPlan || [],
    historicalTrends: result.historicalTrends || [],
    genomicMarkers: result.genomicMarkers || []
  } as AnalysisResult;
}

export function createHealthChatSession(analysis: AnalysisResult): Chat {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `
        You are the 'MedGemma 1.5 Patient Advocate'. 
        You have full visibility into the following analysis results:
        
        SUMMARY: ${analysis.summary}
        VITALS: ${analysis.metrics.map(m => `${m.name}: ${m.value} (${m.riskLevel} risk)`).join(', ')}
        RISKS: ${analysis.predictions.map(p => `${p.condition} (${p.riskLevel})`).join(', ')}
        GENOMICS: ${analysis.genomicMarkers?.map(g => `${g.gene} ${g.variant}`).join(', ')}
        
        Guidelines:
        - Communicate as a high-level clinical assistant.
        - Reference specific data points from the summary or metrics when asked questions.
        - If the patient asks "Do I have cancer?" or similar high-stakes diagnostic questions, direct them to the "Cancer Risk Analysis" section of their imaging reports and emphasize professional oncologist consultation.
        - Keep responses concise and focused on the provided data.
      `
    }
  });
}
