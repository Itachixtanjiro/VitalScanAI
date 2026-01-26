
export interface MedGemmaValidation {
    is_safe_to_display: boolean;
    validation_score: number;
    reasoning: string;
}

export const mockMedGemmaValidate = async (predictions: any[]): Promise<MedGemmaValidation> => {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));

    const topPrediction = predictions[0];

    // Mock Logic: If top probability is high, validate it.
    if (topPrediction.probability > 0.75) {
        return {
            is_safe_to_display: true,
            validation_score: 0.95,
            reasoning: `MedGemma concurs with the high-confidence detection of ${topPrediction.condition}. Signal-to-noise ratio is optimal.`
        };
    } else if (topPrediction.probability > 0.4) {
        return {
            is_safe_to_display: true,
            validation_score: 0.82,
            reasoning: `MedGemma detects ambiguous features. Displaying results with 'Mixed Signal' advisory is recommended.`
        };
    } else {
        return {
            is_safe_to_display: false,
            validation_score: 0.30,
            reasoning: "MedGemma flags this artifact as 'Low Quality' or 'Inconclusive'. Clinical correlation is strictly required."
        };
    }
};
