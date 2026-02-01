import React from 'react';
import { ImageViewer } from '../ImageViewer';
import { SignalIntensityDisplay } from '../SignalIntensityDisplay';
import { ClinicalGuardrail } from './ClinicalGuardrail';

interface SmartImagingProps {
    selectedFile: File | null;
    previewUrl: string | null;
    imagingArtifact: any;
    boundingBoxes: any[];
    gradcamHeatmap?: string | null;
    analysisResults: any[] | null;
    isAnalyzing: boolean;
    intensityLevel?: string;
    signalProbability?: number;
    reasoning?: string;
}

export const SmartImaging: React.FC<SmartImagingProps> = ({
    selectedFile,
    previewUrl,
    imagingArtifact,
    boundingBoxes,
    gradcamHeatmap,
    analysisResults,
    isAnalyzing,
    intensityLevel,
    signalProbability,
    reasoning
}) => {
    // Only show if image is present
    if (!selectedFile?.type.startsWith('image/') && !previewUrl && !imagingArtifact) {
        return null;
    }

    // Calculate highest confidence from findings
    const topConfidence = analysisResults?.[0]?.probability
        ? Math.round(analysisResults[0].probability * 100)
        : (signalProbability || 0);

    // Derive consolidated findings
    const findingsList = analysisResults ? analysisResults.map(r => r.condition) : [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-700">
            <div className='md:col-span-2'>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Radiographic Analysis</h2>
            </div>

            <ClinicalGuardrail
                confidence={topConfidence}
                reasoning={reasoning || "Deep learning model analysis of radiographic density and anomaly detection."}
                title="Visual Anomaly Detection"
            >
                <ImageViewer
                    originalImage={previewUrl || imagingArtifact?.source_data || ''}
                    boundingBoxes={boundingBoxes.length > 0 ? boundingBoxes : (imagingArtifact?.bounding_boxes || [])}
                    gradcamOverlay={gradcamHeatmap || null}
                    findings={findingsList}
                    confidence={topConfidence}
                />
            </ClinicalGuardrail>

            <div className="flex flex-col justify-center">
                <ClinicalGuardrail
                    confidence={topConfidence}
                    title="Signal Intensity Analysis"
                    reasoning="Quantitative assessment of pixel intensity distribution relative to healthy baseline."
                >
                    <SignalIntensityDisplay
                        observation={{
                            level: analysisResults?.[0]
                                ? (analysisResults[0].probability > 0.6 ? 'High' : analysisResults[0].probability > 0.3 ? 'Moderate' : 'Low')
                                : (intensityLevel || 'Low'),
                            confidence: topConfidence,
                            label: analysisResults
                                ? (`Top finding: ${analysisResults[0]?.condition} at ${topConfidence}% confidence`)
                                : 'Analysis complete',
                            evidence: analysisResults
                                ? analysisResults.slice(0, 5).map(r => `${r.condition}: ${(r.probability * 100).toFixed(1)}%`)
                                : []
                        }}
                    />
                </ClinicalGuardrail>
            </div>
        </div>
    );
};
