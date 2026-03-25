import React from 'react';
import { 
  BarChart, 
  Bar as ReBar, 
  XAxis as ReXAxis, 
  YAxis as ReYAxis, 
  Tooltip as ReTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Zap, Sun, Moon, Bird } from 'lucide-react';

const XAxis = ReXAxis as any;
const YAxis = ReYAxis as any;
const Tooltip = ReTooltip as any;
const Bar = ReBar as any;

interface ProductiveHoursProps {
  data: {
    hour: number;
    count: number;
  }[];
}

const ProductiveHours: React.FC<ProductiveHoursProps> = ({ data }) => {
  // Fill in missing hours if any
  const fullData = Array.from({ length: 24 }, (_, i) => {
    const existing = data.find(d => d.hour === i);
    return { hour: i, count: existing ? existing.count : 0 };
  });

  const getBarColor = (hour: number) => {
    if (hour >= 0 && hour < 6) return '#1a1a2e'; // Night
    if (hour >= 6 && hour < 12) return '#f59e0b'; // Morning
    if (hour >= 12 && hour < 18) return '#1A3FE0'; // Afternoon
    return '#7C3AED'; // Evening
  };

  const getPersona = () => {
    const sortedData = [...fullData].sort((a, b) => b.count - a.count);
    const maxHour = sortedData[0]?.hour || 0;

    if (maxHour >= 6 && maxHour < 12) return { 
      label: 'Morning coder', 
      icon: <Sun size={14} />, 
      emoji: '🌅',
      desc: 'You do your best work before noon.' 
    };
    if (maxHour >= 12 && maxHour < 18) return { 
      label: 'Afternoon builder', 
      icon: <Zap size={14} />, 
      emoji: '🌞',
      desc: 'Your rhythm peaks during the day.' 
    };
    if (maxHour >= 18 && maxHour < 24) return { 
      label: 'Evening hacker', 
      icon: <Moon size={14} />, 
      emoji: '🌙',
      desc: 'You light up when the sun goes down.' 
    };
    return { 
      label: 'Night owl', 
      icon: <Bird size={14} />, 
      emoji: '🦉',
      desc: 'The quiet of the night is your sanctuary.' 
    };
  };

  const persona = getPersona();
  const peakHour = [...fullData].sort((a, b) => b.count - a.count)[0]?.hour || 0;
  const avgPerHour = Math.round(fullData.reduce((acc, curr) => acc + curr.count, 0) / 24);

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-premium space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-mono font-bold text-ink-muted uppercase tracking-widest">Most Productive Hours</h3>
        <span className="text-[10px] font-bold text-ink-muted px-2 py-0.5 bg-paper-warm rounded-md border border-border">
          Last 30 Days
        </span>
      </div>

      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={fullData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
            <XAxis 
              dataKey="hour" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              tickFormatter={(h: number) => {
                if (h === 0) return '12am';
                if (h === 12) return '12pm';
                if (h % 3 === 0) return h > 12 ? `${h-12}pm` : `${h}am`;
                return '';
              }}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const label = d.hour === 0 ? '12am' : d.hour === 12 ? '12pm' : d.hour > 12 ? `${d.hour-12}pm` : `${d.hour}am`;
                  return (
                    <div className="bg-white border border-border p-2 rounded-lg shadow-premium text-[10px] font-bold text-ink">
                      {label} — {d.count} activities
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {fullData.map((d, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(d.hour)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-paper-warm border border-border/50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-widest mb-1">Your peak hours</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-primary">{persona.icon}</span>
            <span className="text-sm font-bold text-ink">{persona.label} {persona.emoji}</span>
          </div>
          <p className="text-[10px] text-ink-soft font-medium">Most active: {peakHour % 12 || 12}{peakHour >= 12 ? 'pm' : 'am'} - {(peakHour + 1) % 12 || 12}{(peakHour + 1) >= 12 ? 'pm' : 'am'}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-serif italic text-primary">{avgPerHour}</p>
          <p className="text-[9px] font-bold text-ink-muted uppercase tracking-tighter">Avg activities/hr</p>
        </div>
      </div>
    </div>
  );
};

export default ProductiveHours;
