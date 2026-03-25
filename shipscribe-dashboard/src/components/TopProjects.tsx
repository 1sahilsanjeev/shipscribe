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
import { GitCommit, CheckCircle2 } from 'lucide-react';

const XAxis = ReXAxis as any;
const YAxis = ReYAxis as any;
const Tooltip = ReTooltip as any;
const Bar = ReBar as any;

interface TopProjectsProps {
  data: {
    project: string;
    hours: number;
    commits: number;
    tasks: number;
  }[];
}

const COLORS = ['#1a56db', '#1d4ed8', '#60a5fa', '#3b82f6', '#2563eb', '#1e3a8a', '#1e40af', '#3b82f6'];

const TopProjects: React.FC<TopProjectsProps> = ({ data }) => {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-premium space-y-6">
      <h3 className="text-sm font-mono font-bold text-ink-muted uppercase tracking-widest">Top Projects</h3>
      
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis 
              dataKey="project" 
              type="category" 
              tick={{ fontSize: 11, fontWeight: 'bold', fill: '#1e293b' }}
              width={100}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-border p-3 rounded-xl shadow-premium animate-in zoom-in-95 duration-200">
                      <p className="text-xs font-bold text-ink mb-1">{d.project}</p>
                      <div className="space-y-1">
                        <p className="text-sm text-primary font-bold">{d.hours} hours</p>
                        <p className="text-xs text-ink-soft flex items-center gap-1">
                          <GitCommit size={10} /> {d.commits} commits
                        </p>
                        <p className="text-xs text-ink-soft flex items-center gap-1">
                          <CheckCircle2 size={10} /> {d.tasks} tasks
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.project} className="flex items-center justify-between text-xs group">
            <div className="flex items-center gap-2">
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }} 
              />
              <span className="font-bold text-ink group-hover:text-primary transition-colors">{item.project}</span>
            </div>
            <div className="flex items-center gap-4 text-ink-soft">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold text-[10px]">
                {item.hours}h
              </span>
              <span className="flex items-center gap-1">
                <GitCommit size={12} className="opacity-50" /> {item.commits}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="opacity-50" /> {item.tasks}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProjects;
