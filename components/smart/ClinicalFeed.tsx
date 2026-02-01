import React from 'react';
import { SummaryPanel } from '../SummaryPanel';

interface ClinicalFeedProps {
    summary: string;
    reasoning: string;
    status: string;
    isAnalyzing: boolean;
    analysisCount?: number;
}

export const ClinicalFeed: React.FC<ClinicalFeedProps> = ({
    summary,
    reasoning,
    status,
    isAnalyzing,
    analysisCount = 0
}) => {
    const getConsensusStyles = (state: string) => {
        switch (state) {
            case 'Unified': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Mixed Signal': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Variance Detected': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom duration-500 delay-100">
            <div className="lg:col-span-2">
                <SummaryPanel
                    summary={summary}
                    reasoning={reasoning}
                />
            </div>

            <div className="space-y-6">
                <div className={`p-8 rounded-[2.5rem] border ${getConsensusStyles(status === 'Critical' ? 'Variance Detected' : 'Unified')} h-full flex flex-col justify-center transition-colors duration-500`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-4">SYSTEM STATE</p>
                    <h3 className="text-4xl font-black tracking-tighter mb-2">
                        {isAnalyzing ? "Processing..." : (analysisCount > 0 ? "Analysis Done" : status)}
                    </h3>
                    <p className="text-sm font-bold opacity-80 leading-relaxed">
                        {isAnalyzing ? "Ingesting and synthesizing clinical vectors..." : "Awaiting practitioner review of generated insights."}
                    </p>
                </div>
            </div>
        </section>
    );
};
