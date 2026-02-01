import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Eye, EyeOff, Info, AlertTriangle } from 'lucide-react';

interface ClinicalGuardrailProps {
    confidence: number; // 0 to 100
    children: React.ReactNode;
    reasoning?: string; // The "Invisible Intelligence" logic trace
    isCritical?: boolean; // If true, forces a "Human Review Required" style
    title?: string;
}

/**
 * CLINICAL GUARDRAIL
 * Wraps sensitive clinical components.
 * - Blurs low-confidence inferences.
 * - Hides dense reasoning traces behind a drawer.
 * - Adds clear trust indicators (High/Med/Low confidence).
 */
export const ClinicalGuardrail: React.FC<ClinicalGuardrailProps> = ({
    confidence,
    children,
    reasoning,
    isCritical = false,
    title = "Clinical Insight"
}) => {
    const [isRevealed, setIsRevealed] = useState(confidence > 40); // Auto-blur low confidence
    const [showLogic, setShowLogic] = useState(false);

    // Determine Trust Level
    const trustLevel = confidence > 85 ? 'High' : confidence > 50 ? 'Medium' : 'Low';

    const getBadgeStyle = () => {
        if (isCritical) return "bg-rose-100 text-rose-700 border-rose-200";
        switch (trustLevel) {
            case 'High': return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case 'Medium': return "bg-amber-50 text-amber-700 border-amber-100";
            case 'Low': return "bg-slate-100 text-slate-500 border-slate-200";
        }
    };

    const getIcon = () => {
        if (isCritical) return <AlertTriangle size={14} />;
        switch (trustLevel) {
            case 'High': return <ShieldCheck size={14} />;
            case 'Medium': return <Info size={14} />;
            case 'Low': return <ShieldAlert size={14} />;
        }
    };

    return (
        <div className={`rounded-3xl border transition-all duration-300 ${isCritical ? 'border-rose-100 shadow-sm' : 'border-slate-100 hover:border-slate-200'} bg-white overflow-hidden`}>
            {/* Header / Guardrail Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
                <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getBadgeStyle()}`}>
                        {getIcon()}
                        {isCritical ? "Review Required" : `${trustLevel} Confidence`}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
                </div>

                <div className="flex items-center gap-2">
                    {trustLevel === 'Low' && (
                        <button
                            onClick={() => setIsRevealed(!isRevealed)}
                            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                            title={isRevealed ? "Hide uncertain data" : "Reveal uncertain data"}
                        >
                            {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    )}

                    {reasoning && (
                        <button
                            onClick={() => setShowLogic(!showLogic)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${showLogic ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-50'}`}
                        >
                            {showLogic ? "Hide Logic" : "View Logic"}
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="relative">
                <div className={`transition-all duration-500 ${isRevealed ? 'opacity-100 blur-0' : 'opacity-40 blur-sm select-none pointer-events-none'}`}>
                    {children}
                </div>

                {!isRevealed && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <button
                            onClick={() => setIsRevealed(true)}
                            className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-slate-100 text-xs font-black uppercase tracking-widest text-slate-600 hover:scale-105 transition-transform"
                        >
                            Reveal Low Confidence Data
                        </button>
                    </div>
                )}
            </div>

            {/* Logic Drawer (Invisible Intelligence) */}
            {showLogic && reasoning && (
                <div className="bg-slate-50/50 border-t border-slate-100 p-6 animate-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0 mt-0.5"><DnaIcon size={16} /></div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-900 mb-2">AI Reasoning Trace</h4>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                {reasoning}
                            </p>
                            <div className="mt-4 flex gap-2">
                                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-400 font-mono">Mistral-Large</span>
                                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-400 font-mono">Vector-RAG</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simple internal icon for the drawer
const DnaIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 15c6.667-6 13.333 0 20-6" />
        <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
        <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
        <path d="M17 6c2.235-1.008 4.241-1.362 6.082-.934" />
        <path d="M14 18c-2.235 1.008-4.241 1.362-6.082.934" />
    </svg>
);
