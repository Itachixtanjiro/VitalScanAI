
export const CLINICAL_THRESHOLDS = {
  A1C: {
    DIABETIC: 7.0,
    PRE_DIABETIC: 5.7,
  },
  CANCER_RISK: {
    HIGH: 65,
    MODERATE: 35,
  }
};

export const getA1CStyles = (value: number | string) => {
  const val = typeof value === 'string' ? parseFloat(value) : value;
  // Standardized to Rose/Amber palette for UI consistency
  if (val > CLINICAL_THRESHOLDS.A1C.DIABETIC) {
    return { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-200', lightBg: 'bg-rose-50', lightText: 'text-rose-700' };
  }
  if (val >= CLINICAL_THRESHOLDS.A1C.PRE_DIABETIC) {
    return { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-200', lightBg: 'bg-amber-50', lightText: 'text-amber-700' };
  }
  return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-200', lightBg: 'bg-emerald-50', lightText: 'text-emerald-700' };
};
