import React from 'react';
import { 
  LineChart, 
  Line as ReLine, 
  XAxis as ReXAxis, 
  YAxis as ReYAxis, 
  CartesianGrid, 
  Tooltip as ReTooltip, 
  ResponsiveContainer,
  ReferenceLine as ReReferenceLine,
  Area as ReArea
} from 'recharts';

const XAxis = ReXAxis as any;
const YAxis = ReYAxis as any;
const Tooltip = ReTooltip as any;
const ReferenceLine = ReReferenceLine as any;
const Area = ReArea as any;
const Line = ReLine as any;

interface ProductivityTrendProps {
  data: {
    date: string;
    score: number;
    tasks: number;
    hours: number;
    commits: number;
  }[];
}

const ProductivityTrend: React.FC<ProductivityTrendProps> = ({ data }) => {
  const weeklyAvg = Math.round(
    data.slice(-7).reduce((acc, curr) => acc + curr.score, 0) / Math.max(Math.min(data.length, 7), 1)
  );

  const getBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-blue-100 text-blue-700';
    if (score >= 40) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-premium space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-mono font-bold text-ink-muted uppercase tracking-widest">Productivity Score Trend</h3>
        <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight ${getBadgeColor(weeklyAvg)}`}>
          This Week: {weeklyAvg} AVG
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <ReferenceLine y={50} label={{ position: 'right', value: 'Avg', fill: '#94a3b8', fontSize: 10 }} stroke="#e2e8f0" strokeDasharray="3 3" />
            <ReferenceLine y={80} label={{ position: 'right', value: 'Great', fill: '#10b981', fontSize: 10 }} stroke="#d1fae5" strokeDasharray="3 3" />
            
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 10, fill: '#94a3b8'}}
              tickFormatter={(str: string) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 10, fill: '#94a3b8'}}
              domain={[0, 100]}
            />
            <Tooltip 
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-border p-3 rounded-xl shadow-premium animate-in zoom-in-95 duration-200 min-w-[180px]">
                      <p className="text-xs font-bold text-ink mb-2">
                        {new Date(d.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-ink-soft">Score</span>
                          <span className="text-sm font-bold text-primary">{d.score}</span>
                        </div>
                        <div className="h-1 w-full bg-paper-warm rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${d.score}%` }} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono font-bold text-ink-muted pt-1">
                          <div>TASKS: {d.tasks}</div>
                          <div>HRS: {d.hours}</div>
                          <div>COMM: {d.commits}</div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="none"
              fill="url(#scoreGradient)"
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#1a56db" 
              strokeWidth={3} 
              dot={{ r: 3, fill: '#fff', strokeWidth: 2, stroke: '#1a56db' }} 
              activeDot={{ r: 5, fill: '#1a56db', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-ink-muted font-medium text-center">
        Score combines code duration, tasks completed, and commit frequency.
      </p>
    </div>
  );
};

export default ProductivityTrend;
