
import React from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line 
} from 'recharts';
import { HistoricalDataPoint } from '../types';
import { Heart, Activity, Droplets } from 'lucide-react';
import { getA1CStyles } from '../constants';

export const TrendCharts: React.FC<{ data: HistoricalDataPoint[] }> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
            <Heart size={20} className="text-rose-500" />
            Blood Pressure Profile
          </h3>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
              <YAxis domain={[60, 160]} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="blood_pressure_sys" stroke="#f43f5e" strokeWidth={4} dot={{ r: 6, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} name="Systolic" />
              <Line type="monotone" dataKey="blood_pressure_dia" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} name="Diastolic" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
            <Activity size={20} className="text-indigo-500" />
            A1C History
          </h3>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
              <YAxis domain={[4, 8]} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Line 
                type="monotone" 
                dataKey="a1c" 
                stroke="#6366f1" 
                strokeWidth={4} 
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const styles = getA1CStyles(payload.a1c);
                  const color = styles.bg.replace('bg-', '');
                  return <circle key={cx} cx={cx} cy={cy} r={6} fill={color} stroke="#fff" strokeWidth={2} />;
                }}
                name="A1C %" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
