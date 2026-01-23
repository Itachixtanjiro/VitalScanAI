
import { useState } from 'react';
import { AnalysisResult, UploadedFile } from '../types';
import { analyzeHealthData, preprocessFile } from '../geminiService';

export const useAnalysis = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const performAnalysis = async (files: UploadedFile[]) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      // Step 1: Sequential Preprocessing (Text/Info Extraction)
      const preprocessedFiles = [];
      for (const file of files) {
        setCurrentStep(`Extracting tokens from ${file.name}...`);
        const extracted = await preprocessFile(file);
        preprocessedFiles.push({ ...file, preprocessedData: extracted });
      }

      // Step 2: Orchestrated Synthesis
      setCurrentStep('Orchestrating clinical synthesis...');
      const result = await analyzeHealthData(preprocessedFiles);
      setAnalysisResult(result);
      return result;
    } catch (err: any) {
      setError(err.message || "Synthesis failed.");
      return null;
    } finally {
      setIsAnalyzing(false);
      setCurrentStep('');
    }
  };

  const resetAnalysis = () => setAnalysisResult(null);

  return { 
    analysisResult, 
    isAnalyzing, 
    currentStep,
    error, 
    setError, 
    performAnalysis, 
    resetAnalysis 
  };
};
