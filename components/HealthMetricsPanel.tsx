
import React from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, BarChart, Bar, AreaChart, Area
} from 'recharts';
import { Heart, Activity, Droplets, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

// Types for health metrics data
export interface CholesterolData {
  date: string;
  ldl: number;
  hdl: number;
  total?: number;
  triglycerides?: number;
}

export interface A1CData {
  date: string;
  value: number;
  fasting_glucose?: number;
}

export interface BloodPressureData {
  date: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
}

interface HealthMetricsPanelProps {
  cholesterolData?: CholesterolData[];
  a1cData?: A1CData[];
  bloodPressureData?: BloodPressureData[];
  patientAge?: number;
}

// Threshold configurations
const THRESHOLDS = {
  cholesterol: {
    ldl: { optimal: 100, borderline: 130, high: 160 },
    hdl: { low: 40, optimal: 60 },
    total: { optimal: 200, borderline: 240 }
  },
  a1c: {
    normal: 5.7,
    prediabetes: 6.5,
    diabetes: 7.0
  },
  bp: {
    normal: { sys: 120, dia: 80 },
    elevated: { sys: 130, dia: 80 },
    high1: { sys: 140, dia: 90 },
    high2: { sys: 180, dia: 120 }
  }
};

// Utility functions for status styling
const getCholesterolStatus = (ldl: number, hdl: number) => {
  if (ldl > THRESHOLDS.cholesterol.ldl.high || hdl < THRESHOLDS.cholesterol.hdl.low) {
    return { status: 'critical', color: 'rose', label: 'High Risk' };
  }
  if (ldl > THRESHOLDS.cholesterol.ldl.borderline) {
    return { status: 'warning', color: 'amber', label: 'Borderline' };
  }
  return { status: 'normal', color: 'emerald', label: 'Optimal' };
};

const getA1CStatus = (value: number) => {
  if (value >= THRESHOLDS.a1c.diabetes) {
    return { status: 'critical', color: 'rose', label: 'Diabetic Range' };
  }
  if (value >= THRESHOLDS.a1c.normal) {
    return { status: 'warning', color: 'amber', label: 'Pre-diabetic' };
  }
  return { status: 'normal', color: 'emerald', label: 'Normal' };
};

const getBPStatus = (sys: number, dia: number) => {
  if (sys >= THRESHOLDS.bp.high2.sys || dia >= THRESHOLDS.bp.high2.dia) {
    return { status: 'critical', color: 'rose', label: 'Hypertensive Crisis' };
  }
  if (sys >= THRESHOLDS.bp.high1.sys || dia >= THRESHOLDS.bp.high1.dia) {
    return { status: 'warning', color: 'amber', label: 'High' };
  }
  if (sys >= THRESHOLDS.bp.elevated.sys) {
    return { status: 'elevated', color: 'yellow', label: 'Elevated' };
  }
  return { status: 'normal', color: 'emerald', label: 'Normal' };
};

const getTrend = (data: number[]) => {
  if (data.length < 2) return 'stable';
  const recent = data.slice(-3);
  const avg1 = recent.slice(0, Math.ceil(recent.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(recent.length / 2);
  const avg2 = recent.slice(Math.ceil(recent.length / 2)).reduce((a, b) => a + b, 0) / (recent.length - Math.ceil(recent.length / 2));
  if (avg2 > avg1 * 1.05) return 'up';
  if (avg2 < avg1 * 0.95) return 'down';
  return 'stable';
};

const TrendIcon: React.FC<{ trend: string; goodDirection?: 'up' | 'down' }> = ({ trend, goodDirection = 'down' }) => {
  const isGood = (trend === 'down' && goodDirection === 'down') || (trend === 'up' && goodDirection === 'up');
  const color = trend === 'stable' ? 'text-slate-400' : isGood ? 'text-emerald-500' : 'text-rose-500';
  if (trend === 'up') return <TrendingUp size={16} className={color} />;
  if (trend === 'down') return <TrendingDown size={16} className={color} />;
  return <Minus size={16} className={color} />;
};

// Empty State Component
const EmptyState: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center h-[300px]">
    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
      {icon}
    </div>
    <h4 className="text-sm font-black text-slate-700 tracking-tight uppercase mb-1">{title}</h4>
    <p className="text-xs font-medium text-slate-400 max-w-xs leading-relaxed">{description}</p>
  </div>
);

// Cholesterol Chart Component
export const CholesterolChart: React.FC<{ data?: CholesterolData[] }> = ({ data }) => {
  if (!data || data.length < 1) {
    return <EmptyState title="No Cholesterol Data" description="Lipid panel results will appear here after report analysis" icon={<Droplets size={28} />} />;
  }

  const latestData = data[data.length - 1];
  const status = getCholesterolStatus(latestData.ldl, latestData.hdl);
  const ldlTrend = getTrend(data.map(d => d.ldl));

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-100">
              <Droplets size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Lipid Panel</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cholesterol Metrics</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase bg-${status.color}-50 text-${status.color}-600`}>
            {status.status === 'normal' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {status.label}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Current Values */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-rose-400 uppercase">LDL (Bad)</span>
              <TrendIcon trend={ldlTrend} goodDirection="down" />
            </div>
            <p className="text-2xl font-black text-rose-600">{latestData.ldl} <span className="text-xs font-bold text-rose-400">mg/dL</span></p>
            <p className="text-[10px] text-rose-400 mt-1">Target: &lt;100 mg/dL</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-emerald-400 uppercase">HDL (Good)</span>
              <TrendIcon trend={getTrend(data.map(d => d.hdl))} goodDirection="up" />
            </div>
            <p className="text-2xl font-black text-emerald-600">{latestData.hdl} <span className="text-xs font-bold text-emerald-400">mg/dL</span></p>
            <p className="text-[10px] text-emerald-400 mt-1">Target: &gt;60 mg/dL</p>
          </div>
        </div>

        {/* Chart */}
        {data.length >= 2 && (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ldlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="hdlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 200]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                <Area type="monotone" dataKey="ldl" stroke="#f43f5e" strokeWidth={2} fill="url(#ldlGradient)" name="LDL" />
                <Area type="monotone" dataKey="hdl" stroke="#10b981" strokeWidth={2} fill="url(#hdlGradient)" name="HDL" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

// A1C Chart Component
export const A1CChart: React.FC<{ data?: A1CData[] }> = ({ data }) => {
  if (!data || data.length < 1) {
    return <EmptyState title="No A1C Data" description="HbA1c readings will appear here after report analysis" icon={<Activity size={28} />} />;
  }

  const latestData = data[data.length - 1];
  const status = getA1CStatus(latestData.value);
  const trend = getTrend(data.map(d => d.value));

  // Reference zones for the chart
  const chartData = data.map(d => ({
    ...d,
    normalZone: THRESHOLDS.a1c.normal,
    prediabetesZone: THRESHOLDS.a1c.prediabetes,
    diabetesZone: THRESHOLDS.a1c.diabetes + 1
  }));

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">HbA1c Monitoring</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diabetic Control Index</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase bg-${status.color}-50 text-${status.color}-600`}>
            {status.status === 'normal' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {status.label}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Current Value Display */}
        <div className="flex items-center justify-center mb-6">
          <div className={`relative p-8 rounded-full bg-${status.color}-50 border-4 border-${status.color}-200`}>
            <div className="text-center">
              <p className={`text-4xl font-black text-${status.color}-600`}>{latestData.value.toFixed(1)}</p>
              <p className="text-xs font-bold text-slate-400 uppercase">% HbA1c</p>
            </div>
            <div className="absolute -right-2 -top-2">
              <TrendIcon trend={trend} goodDirection="down" />
            </div>
          </div>
        </div>

        {/* Reference Ranges */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <p className="text-[10px] font-black text-emerald-600 uppercase">&lt;5.7%</p>
            <p className="text-[9px] text-emerald-500">Normal</p>
          </div>
          <div className="p-2 bg-amber-50 rounded-lg">
            <p className="text-[10px] font-black text-amber-600 uppercase">5.7-6.4%</p>
            <p className="text-[9px] text-amber-500">Pre-diabetic</p>
          </div>
          <div className="p-2 bg-rose-50 rounded-lg">
            <p className="text-[10px] font-black text-rose-600 uppercase">&ge;6.5%</p>
            <p className="text-[9px] text-rose-500">Diabetic</p>
          </div>
        </div>

        {/* Chart */}
        {data.length >= 2 && (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[4, 10]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                {/* Reference lines */}
                <Line type="monotone" dataKey="normalZone" stroke="#10b981" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Normal Threshold" />
                <Line type="monotone" dataKey="prediabetesZone" stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Diabetes Threshold" />
                {/* Actual A1C line */}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                  name="HbA1c"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

// Blood Pressure Chart Component
export const BloodPressureChart: React.FC<{ data?: BloodPressureData[] }> = ({ data }) => {
  if (!data || data.length < 1) {
    return <EmptyState title="No Blood Pressure Data" description="BP readings will appear here after report analysis" icon={<Heart size={28} />} />;
  }

  const latestData = data[data.length - 1];
  const status = getBPStatus(latestData.systolic, latestData.diastolic);
  const sysTrend = getTrend(data.map(d => d.systolic));

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-100">
              <Heart size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Blood Pressure</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cardiovascular Monitor</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase bg-${status.color}-50 text-${status.color}-600`}>
            {status.status === 'normal' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {status.label}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Current Reading */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-black text-rose-600">{latestData.systolic}</p>
              <span className="text-lg font-bold text-slate-300">/</span>
              <p className="text-3xl font-black text-blue-600">{latestData.diastolic}</p>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase mt-1">mmHg</p>
          </div>
          <div className="pl-4 border-l border-slate-200">
            <TrendIcon trend={sysTrend} goodDirection="down" />
            <p className="text-[10px] text-slate-400 mt-1">Trend</p>
          </div>
        </div>

        {/* Category Reference */}
        <div className="grid grid-cols-4 gap-1 mb-6 text-center text-[9px]">
          <div className="p-1.5 bg-emerald-50 rounded">
            <p className="font-black text-emerald-600">&lt;120/80</p>
            <p className="text-emerald-500">Normal</p>
          </div>
          <div className="p-1.5 bg-yellow-50 rounded">
            <p className="font-black text-yellow-600">120-129</p>
            <p className="text-yellow-500">Elevated</p>
          </div>
          <div className="p-1.5 bg-amber-50 rounded">
            <p className="font-black text-amber-600">130-139</p>
            <p className="text-amber-500">High-1</p>
          </div>
          <div className="p-1.5 bg-rose-50 rounded">
            <p className="font-black text-rose-600">&ge;140</p>
            <p className="text-rose-500">High-2</p>
          </div>
        </div>

        {/* Chart */}
        {data.length >= 2 && (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[60, 180]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="systolic" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} name="Systolic" />
                <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} name="Diastolic" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Health Metrics Panel
export const HealthMetricsPanel: React.FC<HealthMetricsPanelProps> = ({
  cholesterolData,
  a1cData,
  bloodPressureData,
  patientAge
}) => {
  const hasAnyData = (cholesterolData && cholesterolData.length > 0) ||
    (a1cData && a1cData.length > 0) ||
    (bloodPressureData && bloodPressureData.length > 0);

  if (!hasAnyData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity size={14} className="text-indigo-500" />
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Vital Health Metrics</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CholesterolChart data={cholesterolData} />
        <A1CChart data={a1cData} />
        <BloodPressureChart data={bloodPressureData} />
      </div>
    </div>
  );
};

export default HealthMetricsPanel;
