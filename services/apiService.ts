/**
 * API Service for VitalScan AI Frontend
 * Provides typed HTTP client functions to communicate with FastAPI backend
 */

// Get API base URL from environment variable, fallback to localhost
import type {
  XRayPredictionResponse,
  CervicalCancerRiskInput,
  CervicalCancerRiskResponse,
  DiabetesRiskInput,
  DiabetesRiskResponse,
  ClinicalNoteResponse
} from '../types/ClinicalSynthesis';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Generic HTTP client function
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Upload files with multipart/form-data
 */
async function uploadFiles<T>(
  endpoint: string,
  files: File[],
  additionalData?: Record<string, any>
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const formData = new FormData();

  // Append files
  files.forEach((file) => {
    formData.append('files', file);
  });

  // Append additional data as JSON
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, JSON.stringify(value));
    });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Upload Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================================================
// API Endpoint Functions
// ============================================================================

/**
 * Health check endpoint
 */
export async function checkHealth() {
  return fetchAPI<{ status: string; mode: string }>('/health');
}

/**
 * Test backend connectivity
 */
export async function testConnection() {
  try {
    const result = await checkHealth();
    console.log('✅ Backend connection successful:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Upload and analyze health data files
 */
export async function analyzeHealthData(files: File[]) {
  return uploadFiles('/api/synthesis/analyze', files);
}

/**
 * Get chest X-ray prediction with Grad-CAM visualization
 */
export async function predictChestXray(imageFile: File, includeGradcam: boolean = true) {
  const url = `${API_BASE_URL}/api/imaging/predict/chest-xray/?include_gradcam=${includeGradcam}`;
  const formData = new FormData();
  formData.append('file', imageFile);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json() as XRayPredictionResponse;
  } catch (error) {
    console.error('API Error [chest-xray]:', error);
    throw error;
  }
}

/**
 * Get cervical cancer risk prediction (JSON Input)
 */
export async function predictCancerRisk(data: CervicalCancerRiskInput) {
  return fetchAPI<CervicalCancerRiskResponse>('/api/risk/predict/cancer', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Parse clinical note text
 */
export async function parseClinicalNote(text: string, useLlm: boolean = true) {
  return fetchAPI<ClinicalNoteResponse>('/api/notes/parse', {
    method: 'POST',
    body: JSON.stringify({
      text,
      use_llm: useLlm,
      use_bert: true
    }),
  });
}

/**
 * Get diabetes risk prediction (JSON Input)
 */
export async function predictDiabetesRisk(data: DiabetesRiskInput) {
  return fetchAPI<DiabetesRiskResponse>('/api/risk/predict/diabetes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// Sample Test Cases API
// ============================================

export interface SampleCase {
  id: string;
  name: string;
  description: string;
  expected_findings: string[];
  category: string;
  filename: string;
  available: boolean;
}

/**
 * Get list of available sample test cases
 */
export async function getSampleCases(category?: string): Promise<SampleCase[]> {
  const params = category ? `?category=${category}` : '';
  return fetchAPI<SampleCase[]>(`/api/samples/list${params}`);
}

/**
 * Get sample image URL for display
 */
export function getSampleImageUrl(category: string, filename: string): string {
  return `${API_BASE_URL}/api/samples/image/${category}/${filename}`;
}

/**
 * Get sample image as base64 for API testing
 */
export async function getSampleBase64(sampleId: string): Promise<{
  id: string;
  name: string;
  expected_findings: string[];
  image_base64: string;
}> {
  return fetchAPI(`/api/samples/base64/${sampleId}`);
}

/**
 * Export API base URL for debugging
 */
export { API_BASE_URL };

/**
 * Development helper: Log current API configuration
 */
if (import.meta.env.DEV) {
  console.log('🔌 API Service Configuration:', {
    baseURL: API_BASE_URL,
    environment: import.meta.env.MODE,
  });
}
