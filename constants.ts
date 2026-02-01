
/**
 * Clinical Thresholds and Utility Constants
 * Used across components for consistent risk classification
 */

// Clinical Risk Thresholds
export const CLINICAL_THRESHOLDS = {
  CANCER_RISK: {
    LOW: 15,
    MODERATE: 40,
    HIGH: 70
  },
  DIABETES_RISK: {
    LOW: 20,
    MODERATE: 50,
    HIGH: 75
  },
  A1C: {
    NORMAL: 5.7,
    PREDIABETES: 6.5,
    DIABETES: 7.0,
    HIGH_RISK: 8.0
  },
  BLOOD_PRESSURE: {
    NORMAL: { systolic: 120, diastolic: 80 },
    ELEVATED: { systolic: 130, diastolic: 80 },
    HIGH_STAGE_1: { systolic: 140, diastolic: 90 },
    HIGH_STAGE_2: { systolic: 180, diastolic: 120 }
  },
  CHOLESTEROL: {
    LDL: {
      OPTIMAL: 100,
      BORDERLINE: 130,
      HIGH: 160
    },
    HDL: {
      LOW: 40,
      OPTIMAL: 60
    },
    TOTAL: {
      OPTIMAL: 200,
      BORDERLINE: 240
    }
  }
};

// A1C styling utility function
export const getA1CStyles = (value: string | number): {
  bg: string;
  text: string;
  border: string;
  lightBg: string;
  lightText: string;
} => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      lightBg: 'bg-slate-50',
      lightText: 'text-slate-500'
    };
  }

  if (numericValue >= CLINICAL_THRESHOLDS.A1C.HIGH_RISK) {
    return {
      bg: 'bg-rose-600',
      text: 'text-white',
      border: 'border-rose-300 shadow-rose-100',
      lightBg: 'bg-rose-50',
      lightText: 'text-rose-700'
    };
  }

  if (numericValue >= CLINICAL_THRESHOLDS.A1C.DIABETES) {
    return {
      bg: 'bg-orange-500',
      text: 'text-white',
      border: 'border-orange-300 shadow-orange-100',
      lightBg: 'bg-orange-50',
      lightText: 'text-orange-700'
    };
  }

  if (numericValue >= CLINICAL_THRESHOLDS.A1C.PREDIABETES) {
    return {
      bg: 'bg-amber-500',
      text: 'text-white',
      border: 'border-amber-300 shadow-amber-100',
      lightBg: 'bg-amber-50',
      lightText: 'text-amber-700'
    };
  }

  if (numericValue >= CLINICAL_THRESHOLDS.A1C.NORMAL) {
    return {
      bg: 'bg-yellow-500',
      text: 'text-white',
      border: 'border-yellow-300 shadow-yellow-100',
      lightBg: 'bg-yellow-50',
      lightText: 'text-yellow-700'
    };
  }

  // Normal range
  return {
    bg: 'bg-emerald-600',
    text: 'text-white',
    border: 'border-emerald-200 shadow-emerald-50',
    lightBg: 'bg-emerald-50',
    lightText: 'text-emerald-700'
  };
};

// Risk level styling utility
export const getRiskLevelStyles = (level: string): {
  bg: string;
  text: string;
  border: string;
} => {
  switch (level?.toLowerCase()) {
    case 'critical':
    case 'high':
      return {
        bg: 'bg-rose-600',
        text: 'text-white',
        border: 'border-rose-300'
      };
    case 'elevated':
    case 'moderate':
    case 'warning':
      return {
        bg: 'bg-amber-500',
        text: 'text-white',
        border: 'border-amber-300'
      };
    case 'low':
    case 'normal':
    default:
      return {
        bg: 'bg-emerald-600',
        text: 'text-white',
        border: 'border-emerald-200'
      };
  }
};
