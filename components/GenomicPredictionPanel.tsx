
import React from 'react';
import { Dna, AlertTriangle, CheckCircle, Info, Shield, Activity, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';

// Types
export interface GenomicVariant {
  gene: string;
  variant: string;
  rsid?: string;
  significance: 'Pathogenic' | 'Likely Pathogenic' | 'VUS' | 'Benign' | 'Likely Benign';
  condition?: string;
  interpretation: string;
  inheritance?: 'Autosomal Dominant' | 'Autosomal Recessive' | 'X-linked' | 'Mitochondrial';
}

export interface GenomicRiskScore {
  category: string;
  score: number; // 0-100
  percentile?: number;
  riskLevel: 'Low' | 'Average' | 'Elevated' | 'High';
  factors: string[];
}

export interface GenomicPrediction {
  condition: string;
  probability: number; // 0-1
  confidence: number; // 0-1
  contributing_genes: string[];
  recommendation?: string;
}

interface GenomicPredictionPanelProps {
  variants?: GenomicVariant[];
  riskScores?: GenomicRiskScore[];
  predictions?: GenomicPrediction[];
  sequencingType?: string;
}

// Utility functions
const getSignificanceStyles = (sig: string) => {
  switch (sig) {
    case 'Pathogenic': return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' };
    case 'Likely Pathogenic': return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' };
    case 'VUS': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
    case 'Likely Benign': return { bg: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-200' };
    default: return { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' };
  }
};

const getRiskLevelStyles = (level: string) => {
  switch (level) {
    case 'High': return { bg: 'bg-rose-500', gradient: 'from-rose-500 to-rose-600' };
    case 'Elevated': return { bg: 'bg-amber-500', gradient: 'from-amber-500 to-amber-600' };
    case 'Average': return { bg: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600' };
    default: return { bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600' };
  }
};

// Empty State
const EmptyState: React.FC = () => (
  <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
      <Dna size={40} />
    </div>
    <h4 className="text-lg font-black text-slate-700 tracking-tight uppercase mb-2">Genomic Data Pending</h4>
    <p className="text-xs font-medium text-slate-400 max-w-sm leading-relaxed">
      Upload a clinical report containing genetic testing results for polygenic risk scoring and variant analysis.
    </p>
  </div>
);

// Variant Card Component
const VariantCard: React.FC<{ variant: GenomicVariant }> = ({ variant }) => {
  const styles = getSignificanceStyles(variant.significance);

  return (
    <div className={`p-4 rounded-2xl border ${styles.border} ${styles.bg} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-xs font-black text-indigo-600">{variant.gene}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{variant.variant}</p>
            {variant.rsid && <p className="text-[10px] text-slate-400 font-mono">{variant.rsid}</p>}
          </div>
        </div>
        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${styles.bg} ${styles.text}`}>
          {variant.significance}
        </span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{variant.interpretation}</p>
      {variant.condition && (
        <p className="text-[10px] text-slate-400 mt-2 italic">Associated: {variant.condition}</p>
      )}
    </div>
  );
};

// Risk Score Bar Component
const RiskScoreBar: React.FC<{ score: GenomicRiskScore }> = ({ score }) => {
  const styles = getRiskLevelStyles(score.riskLevel);

  return (
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-slate-700">{score.category}</span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white ${styles.bg}`}>
          {score.riskLevel}
        </span>
      </div>

      <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden mb-2">
        <div
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${styles.gradient} transition-all duration-1000`}
          style={{ width: `${score.score}%` }}
        />
        {/* Percentile marker */}
        {score.percentile && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-slate-800 rounded"
            style={{ left: `${score.percentile}%` }}
            title={`${score.percentile}th percentile`}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>Score: {score.score}/100</span>
        {score.percentile && <span>{score.percentile}th percentile</span>}
      </div>

      {score.factors.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {score.factors.slice(0, 3).map((factor, i) => (
            <span key={i} className="px-2 py-0.5 bg-white rounded text-[9px] font-medium text-slate-500 border border-slate-100">
              {factor}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Prediction Card Component
const PredictionCard: React.FC<{ prediction: GenomicPrediction }> = ({ prediction }) => {
  const riskPercent = Math.round(prediction.probability * 100);
  const isHighRisk = riskPercent > 50;
  const isModerateRisk = riskPercent > 25 && riskPercent <= 50;

  return (
    <div className={`p-5 rounded-2xl border ${isHighRisk ? 'bg-rose-50 border-rose-200' : isModerateRisk ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-slate-800">{prediction.condition}</p>
          <p className="text-[10px] text-slate-400">Confidence: {Math.round(prediction.confidence * 100)}%</p>
        </div>
        <div className={`text-2xl font-black ${isHighRisk ? 'text-rose-600' : isModerateRisk ? 'text-amber-600' : 'text-emerald-600'}`}>
          {riskPercent}%
        </div>
      </div>

      <div className="relative h-2 bg-white/50 rounded-full overflow-hidden mb-3">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${isHighRisk ? 'bg-rose-500' : isModerateRisk ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          style={{ width: `${riskPercent}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-1">
        {prediction.contributing_genes.map((gene, i) => (
          <span key={i} className="px-2 py-0.5 bg-white rounded text-[9px] font-bold text-indigo-600 border border-indigo-100">
            {gene}
          </span>
        ))}
      </div>

      {prediction.recommendation && (
        <p className="mt-3 text-[10px] text-slate-500 italic leading-relaxed">
          {prediction.recommendation}
        </p>
      )}
    </div>
  );
};

// Main Component
export const GenomicPredictionPanel: React.FC<GenomicPredictionPanelProps> = ({
  variants = [],
  riskScores = [],
  predictions = [],
  sequencingType = 'Whole Genome'
}) => {
  const hasData = variants.length > 0 || riskScores.length > 0 || predictions.length > 0;

  if (!hasData) {
    return <EmptyState />;
  }

  const pathogenicCount = variants.filter(v => v.significance === 'Pathogenic' || v.significance === 'Likely Pathogenic').length;
  const vusCount = variants.filter(v => v.significance === 'VUS').length;

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
              <Dna size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Genomic Risk Analysis</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sequencingType} Sequencing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-600 uppercase">AI-Enhanced</span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-3 bg-white/70 rounded-xl text-center">
            <p className="text-2xl font-black text-slate-800">{variants.length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Variants</p>
          </div>
          <div className="p-3 bg-white/70 rounded-xl text-center">
            <p className="text-2xl font-black text-rose-600">{pathogenicCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Pathogenic</p>
          </div>
          <div className="p-3 bg-white/70 rounded-xl text-center">
            <p className="text-2xl font-black text-amber-600">{vusCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">VUS</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Polygenic Risk Scores */}
        {riskScores.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-indigo-500" />
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Polygenic Risk Scores</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riskScores.map((score, i) => (
                <RiskScoreBar key={i} score={score} />
              ))}
            </div>
          </div>
        )}

        {/* Condition Predictions */}
        {predictions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-indigo-500" />
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Risk Predictions</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictions.map((pred, i) => (
                <PredictionCard key={i} prediction={pred} />
              ))}
            </div>
          </div>
        )}

        {/* Detected Variants */}
        {variants.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-indigo-500" />
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Detected Variants</h4>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {variants.slice(0, 5).map((variant, i) => (
                <VariantCard key={i} variant={variant} />
              ))}
            </div>
            {variants.length > 5 && (
              <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-indigo-600 transition-all">
                <span className="text-xs font-black uppercase tracking-widest">View All {variants.length} Variants</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
          <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700 leading-relaxed">
            <span className="font-bold">Important:</span> Genomic risk scores are probabilistic estimates based on population data.
            Individual risk may vary. Consult a genetic counselor for comprehensive interpretation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GenomicPredictionPanel;
