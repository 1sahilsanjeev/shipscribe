import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useServerStatus } from '../context/ServerStatusContext';

// Type casts for Recharts components to resolve React 18 type mismatches
const RechartsBarChart = BarChart as any;
const RechartsBar = Bar as any;
const RechartsXAxis = XAxis as any;
const RechartsYAxis = YAxis as any;
const RechartsTooltip = Tooltip as any;

// Backoff: 5m, 10m, 20m (max) — this data changes slowly
const getBackoffMs = (failCount: number) => Math.min(20 * 60_000, 5 * 60_000 * Math.pow(2, failCount - 1));

const TimeToday: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { serverOnline } = useServerStatus();
  const failCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    if (!serverOnline) return;
    try {
      const response = await api.get('/api/activity/live');
      failCountRef.current = 0;
      const chartData = response.data.time_today.by_project.map((p: any) => ({
        name: p.project,
        hours: p.hours,
      }));
      setData(chartData);
    } catch (error: any) {
      if (error.code !== 'ERR_NETWORK') {
        console.error('Error fetching time data:', error.message);
      }
      failCountRef.current += 1;
    } finally {
      setLoading(false);
    }
  }, [serverOnline]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!serverOnline) return;

    fetchData();

    const schedule = () => {
      const delay = failCountRef.current === 0 ? 300_000 : getBackoffMs(failCountRef.current);
      timerRef.current = setTimeout(async () => { await fetchData(); schedule(); }, delay);
    };
    schedule();

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [fetchData, serverOnline]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) return <div className="h-48 bg-white/5 animate-pulse rounded-2xl border border-border" />;

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-premium h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted">Work Hours Today</h3>
        <span className="text-[11px] font-serif italic text-ink-muted">by project</span>
      </div>

      <div className="flex-1 min-h-[120px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data} layout="vertical" margin={{ left: -10, right: 40, top: 0, bottom: 0 }}>
              <RechartsXAxis type="number" hide />
              <RechartsYAxis 
                type="category" 
                dataKey="name" 
                width={100} 
                tick={{ fontSize: 9, fontFamily: 'DM Mono', fontWeight: 'bold', fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip 
                cursor={{ fill: 'rgba(26, 63, 224, 0.04)' }}
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-border p-2 rounded-lg shadow-premium text-[10px] font-mono">
                        <p className="font-bold uppercase text-ink">{payload[0].payload.name}</p>
                        <p className="text-primary mt-1">{payload[0].value} hours</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <RechartsBar dataKey="hours" radius={[0, 4, 4, 0]} barSize={12}>
                {data.map((_, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </RechartsBar>
            </RechartsBarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-[11px] font-serif italic text-ink-muted">No data for today yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeToday;
