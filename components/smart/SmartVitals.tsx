import React from 'react';
import { HealthMetricsPanel, CholesterolData, A1CData, BloodPressureData } from '../HealthMetricsPanel';
import { ClinicalGuardrail } from './ClinicalGuardrail';

interface SmartVitalsProps {
    cholesterol: CholesterolData[];
    a1c: A1CData[];
    bp: BloodPressureData[];
    patientAge?: number;
    reasoning?: string;
    uiHints?: any;
}

export const SmartVitals: React.FC<SmartVitalsProps> = ({
    cholesterol,
    a1c,
    bp,
    patientAge,
    reasoning,
    uiHints
}) => {
    // If no data, don't render (Dynamic Layout principle)
    if (cholesterol.length === 0 && a1c.length === 0 && bp.length === 0) {
        return null;
    }

    // Calculate aggregate confidence (mock logic for now, or derive from metadata)
    // In a real app, each data point might have a confidence score.
    const aggregateConfidence = 92;

    return (
        <div className="animate-in slide-in-from-bottom duration-700">
            <ClinicalGuardrail
                confidence={aggregateConfidence}
                reasoning={reasoning || "Vitals extracted from clinical text and structured lab reports. Values normalized to standard units."}
                title="Patient Vitals & Biomarkers"
            >
                <HealthMetricsPanel
                    cholesterolData={cholesterol}
                    a1cData={a1c}
                    bloodPressureData={bp}
                    patientAge={patientAge}
                />
            </ClinicalGuardrail>
        </div>
    );
};
