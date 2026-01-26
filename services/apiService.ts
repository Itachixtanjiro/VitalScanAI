/**
 * API Service for VitalScan AI Frontend
 * Provides typed HTTP client functions to communicate with FastAPI backend
 */

// Get API base URL from environment variable, fallback to localhost
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
 * Get chest X-ray prediction with GradCAM
 */
export async function predictChestXray(imageFile: File) {
  return uploadFiles<{
    prediction: string;
    confidence: number;
    gradcam_data?: string;
    findings?: string[];
  }>('/api/imaging/predict/chest-xray', [imageFile]);
}

/**
 * Get cancer risk prediction
 */
export async function predictCancerRisk(files: File[]) {
  return uploadFiles('/api/risk/predict/cancer', files);
}

/**
 * Get diabetes risk prediction
 */
export async function predictDiabetesRisk(files: File[]) {
  return uploadFiles('/api/risk/predict/diabetes', files);
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
