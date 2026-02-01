import React, { useState, useEffect, useCallback } from 'react';
import { BrainCircuit, RefreshCw, CheckCircle2, XCircle, Clock, Zap, Hash, AlertTriangle, Activity, TrendingUp } from 'lucide-react';

interface LLMDashboardProps {
  userEmail: string;
}

interface CallEntry {
  timestamp: number;
  task_type: string;
  model: string;
  input_length: number;
  output_length: number;
  status: string;
  latency_ms: number;
  error: string | null;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface TaskBreakdown {
  [key: string]: {
    count: number;
    success: number;
    error: number;
    total_tokens: number;
    avg_latency_ms: number;
  };
}

interface AnalyticsData {
  model: string;
  api_key_configured: boolean;
  stats: {
    total_calls: number;
    success: number;
    errors: number;
    avg_latency_ms: number;
    total_tokens: number;
  };
  task_breakdown: TaskBreakdown;
  recent_calls: CallEntry[];
}

export const LLMDashboard: React.FC<LLMDashboardProps> = ({ userEmail }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const baseUrl = `http://${window.location.hostname}:8000`;

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${baseUrl}/api/admin/llm-analytics`, {
        headers: { 'X-Admin-Email': userEmail },
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${res.status}: ${errText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, userEmail]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const formatTimestamp = (ts: number) => {
    return new Date(ts * 1000).toLocaleTimeString();
  };

  const successRate = data && data.stats.total_calls > 0
    ? Math.round((data.stats.success / data.stats.total_calls) * 100)
    : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 text-amber-600 font-black text-[10px] uppercase tracking-[0.3em] mb-3">
            <BrainCircuit size={16} /> Admin Panel
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">LLM Analytics</h1>
          <p className="text-slate-400 mt-1 font-medium">Monitor Mistral API usage, latency, and token consumption.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${autoRefresh ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'}`}
          >
            {autoRefresh ? 'Live' : 'Auto-Refresh Off'}
          </button>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 flex items-center gap-3">
          <AlertTriangle size={18} />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              icon={<Hash size={20} />}
              label="Total Calls"
              value={data.stats.total_calls.toString()}
              color="indigo"
            />
            <StatCard
              icon={<CheckCircle2 size={20} />}
              label="Success Rate"
              value={`${successRate}%`}
              color="emerald"
            />
            <StatCard
              icon={<XCircle size={20} />}
              label="Errors"
              value={data.stats.errors.toString()}
              color="rose"
            />
            <StatCard
              icon={<Clock size={20} />}
              label="Avg Latency"
              value={`${data.stats.avg_latency_ms}ms`}
              color="amber"
            />
            <StatCard
              icon={<Zap size={20} />}
              label="Total Tokens"
              value={data.stats.total_tokens.toLocaleString()}
              color="violet"
            />
          </div>

          {/* Model Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Model Configuration</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm font-bold text-slate-500">Model</span>
                  <span className="text-sm font-black text-slate-800 bg-slate-50 px-3 py-1 rounded-lg">{data.model}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm font-bold text-slate-500">API Key</span>
                  <span className={`text-sm font-black px-3 py-1 rounded-lg ${data.api_key_configured ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {data.api_key_configured ? 'Configured' : 'Missing'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-bold text-slate-500">Endpoint</span>
                  <span className="text-xs font-bold text-slate-400">Mistral AI</span>
                </div>
              </div>
            </div>

            {/* Task Breakdown */}
            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <TrendingUp size={14} className="text-indigo-500" /> Task Breakdown
              </h3>
              {Object.keys(data.task_breakdown).length > 0 ? (
                <div className="space-y-4">
                  {(Object.entries(data.task_breakdown) as [string, TaskBreakdown[string]][]).map(([task, info]) => (
                    <div key={task} className="flex items-center gap-4">
                      <div className="w-24 text-xs font-black text-slate-600 uppercase tracking-wider">{task}</div>
                      <div className="flex-1 bg-slate-50 rounded-full h-6 overflow-hidden relative">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                          style={{ width: `${data.stats.total_calls > 0 ? (info.count / data.stats.total_calls) * 100 : 0}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-600">
                          {info.count} calls | {info.avg_latency_ms}ms avg | {info.total_tokens} tokens
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold">
                        <span className="text-emerald-600">{info.success}ok</span>
                        {info.error > 0 && <span className="text-rose-500">{info.error}err</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <Activity size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-xs font-black uppercase tracking-widest">No LLM calls recorded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Calls Table */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Activity size={14} className="text-indigo-500" /> Recent Calls
            </h3>
            {data.recent_calls.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                      <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task</th>
                      <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="text-right py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Latency</th>
                      <th className="text-right py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tokens</th>
                      <th className="text-right py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">In/Out</th>
                      <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.recent_calls].reverse().map((entry, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-xs font-mono text-slate-500">{formatTimestamp(entry.timestamp)}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-md uppercase">{entry.task_type}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${entry.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {entry.status === 'success' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-xs font-mono text-slate-600">{entry.latency_ms}ms</td>
                        <td className="py-3 px-4 text-right text-xs font-mono text-slate-600">{entry.total_tokens || '-'}</td>
                        <td className="py-3 px-4 text-right text-xs font-mono text-slate-400">{entry.input_length}/{entry.output_length}</td>
                        <td className="py-3 px-4 text-xs text-rose-500 font-bold max-w-[200px] truncate">{entry.error || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <BrainCircuit size={40} className="mx-auto mb-4 opacity-30" />
                <p className="text-xs font-black uppercase tracking-widest mb-2">No LLM Calls Yet</p>
                <p className="text-xs font-medium text-slate-400">Upload a clinical artifact to trigger LLM processing.</p>
              </div>
            )}
          </div>
        </>
      )}

      {loading && !data && (
        <div className="text-center py-24">
          <RefreshCw size={32} className="mx-auto mb-4 animate-spin text-indigo-400" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading analytics...</p>
        </div>
      )}
    </div>
  );
};

/* --- Helper Components --- */

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet';
}

const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'text-indigo-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'text-rose-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'text-violet-500' },
};

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
      <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center ${c.icon} mb-4`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className={`text-2xl font-black tracking-tight ${c.text}`}>{value}</p>
    </div>
  );
};
