import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar as ReBar, 
  XAxis as ReXAxis, 
  YAxis as ReYAxis, 
  CartesianGrid, 
  Tooltip as ReTooltip, 
  ResponsiveContainer,
  ReferenceLine as ReReferenceLine,
  Cell
} from 'recharts';

const XAxis = ReXAxis as any;
const YAxis = ReYAxis as any;
const Tooltip = ReTooltip as any;
const ReferenceLine = ReReferenceLine as any;
const Bar = ReBar as any;

interface CodingHoursChartProps {
  data: {
    date: string;
    hours: number;
    sessions: number;
  }[];
}

const CodingHoursChart: React.FC<CodingHoursChartProps> = ({ data }) => {
  const stats = useMemo(() => {
    if (!data.length) return { bestDay: '-', average: 0, total: 0 };
    
    let totalHours = 0;
    let maxHours = 0;
    let bestDay = '';
    
    data.forEach(d => {
      totalHours += d.hours;
      if (d.hours > maxHours) {
        maxHours = d.hours;
        bestDay = new Date(d.date).toLocaleDateString('en-US', { weekday: 'long' });
      }
    });
    
    return {
      bestDay: `${bestDay} — ${maxHours.toFixed(1)} hours`,
      average: (totalHours / data.length).toFixed(1),
      total: totalHours.toFixed(1)
    };
  }, [data]);

  const avgHours = useMemo(() => {
    if (!data.length) return 0;
    return data.reduce((acc, curr) => acc + curr.hours, 0) / data.length;
  }, [data]);

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-premium space-y-6">
      <h3 className="text-sm font-mono font-bold text-ink-muted uppercase tracking-widest">Coding Hours</h3>
      
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 10, fill: '#94a3b8'}}
              tickFormatter={(str: string) => {
                const d = new Date(str);
                return data.length <= 7 
                  ? d.toLocaleDateString('en-US', { weekday: 'short' })
                  : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 10, fill: '#94a3b8'}}
              domain={[0, (dataMax: number) => Math.ceil(dataMax + 1)]}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const dateStr = new Date(d.date).toLocaleDateString('en-US', { weekday: 'long' });
                  return (
                    <div className="bg-white border border-border p-3 rounded-xl shadow-premium animate-in zoom-in-95 duration-200">
                      <p className="text-xs font-bold text-ink mb-1">{dateStr}</p>
                      <p className="text-sm text-primary font-bold">
                        {d.hours} hours, <span className="text-ink-soft">{d.sessions} sessions</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={avgHours} stroke="#1A3FE0" strokeDasharray="5 5" opacity={0.3} />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]} barSize={data.length <= 7 ? 32 : undefined}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.hours === 0 ? '#e2e8f0' : '#1A3FE0'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
        <div>
          <p className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider mb-1">Best Day</p>
          <p className="text-sm font-bold text-ink">{stats.bestDay}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider mb-1">Average</p>
          <p className="text-sm font-bold text-ink">{stats.average} hours / day</p>
        </div>
        <div>
          <p className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider mb-1">Total</p>
          <p className="text-sm font-bold text-ink">{stats.total} hours this week</p>
        </div>
      </div>
    </div>
  );
};

export default CodingHoursChart;
