import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendUp }) => {
  return (
    <div className="bg-white border border-border rounded-xl p-6 shadow-premium hover:shadow-premium-lg transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-paper-warm rounded-xl text-ink-soft group-hover:text-primary transition-colors">
          <Icon size={24} strokeWidth={2.5} />
        </div>
        {trend && (
          <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-success-light text-success' : 'bg-red-50 text-red-500'}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] text-ink-muted font-mono font-bold mb-1 uppercase tracking-[0.1em]">{title}</p>
        <h3 className="text-[32px] font-bold tracking-tighter text-ink leading-tight">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;
