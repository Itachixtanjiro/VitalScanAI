
import React from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { Heart, Activity, DatabaseZap } from 'lucide-react';
import { getA1CStyles } from '../constants';

export const TrendCharts: React.FC<{ data: any[] }> = ({ data }) => {
  const hasData = data && Array.isArray(data) && data.length >= 2;
  
  if (!hasData) {
    return (
      <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center h-[400px]">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
          <DatabaseZap size={32} />
        </div>
        <h4 className="text-lg font-black text-slate-800 tracking-tight uppercase">Insufficient History</h4>
        <p className="text-xs font-medium text-slate-400 max-w-xs mt-2 leading-relaxed">
          Historical reconstruction requires at least 2 diagnostic data points to calculate trajectories.
        </p>
      </div>
    );
  }

  const hasBP = data.some(d => d.blood_pressure_sys !== undefined);
  const hasA1C = data.some(d => d.a1c !== undefined);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full min-w-0">
      {hasBP && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col w-full min-w-0">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
              <Heart size={20} className="text-rose-500" />
              BP Reconstruction
            </h3>
            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">mmHg</span>
          </div>
          <div className="relative w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} domain={[60, 160]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                <Line type="monotone" dataKey="blood_pressure_sys" stroke="#f43f5e" strokeWidth={4} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} name="Systolic" isAnimationActive={true} />
                <Line type="monotone" dataKey="blood_pressure_dia" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} name="Diastolic" isAnimationActive={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {hasA1C && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col w-full min-w-0">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
              <Activity size={20} className="text-indigo-500" />
              Metabolic Trajectory
            </h3>
            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">% HbA1c</span>
          </div>
          <div className="relative w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} domain={[4, 8]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="a1c" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  isAnimationActive={true}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.a1c === undefined) return null;
                    const styles = getA1CStyles(payload.a1c);
                    const color = styles.bg.replace('bg-', '');
                    const hexColor = color === 'rose-600' ? '#e11d48' : color === 'amber-500' ? '#f59e0b' : '#16a34a';
                    return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={6} fill={hexColor} stroke="#fff" strokeWidth={2} />;
                  }}
                  name="HbA1c Glycation" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
