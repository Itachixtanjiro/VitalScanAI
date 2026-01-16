
// Fixed: Removed the circular self-import of CLINICAL_THRESHOLDS to resolve merged declaration conflicts.

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
  if (val > CLINICAL_THRESHOLDS.A1C.DIABETIC) return { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', lightBg: 'bg-red-50', lightText: 'text-red-600' };
  if (val >= CLINICAL_THRESHOLDS.A1C.PRE_DIABETIC) return { bg: 'bg-yellow-500', text: 'text-white', border: 'border-yellow-600', lightBg: 'bg-yellow-50', lightText: 'text-yellow-600' };
  return { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600', lightBg: 'bg-green-50', lightText: 'text-green-600' };
};
