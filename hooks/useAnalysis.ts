
import { useState } from 'react';
import { AnalysisResult, UploadedFile } from '../types';
import { analyzeHealthData } from '../geminiService';

export const useAnalysis = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAnalysis = async (files: UploadedFile[]) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeHealthData(files);
      setAnalysisResult(result);
      return result;
    } catch (err: any) {
      setError(err.message || "Synthesis failed.");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => setAnalysisResult(null);

  return { analysisResult, isAnalyzing, error, setError, performAnalysis, resetAnalysis };
};
