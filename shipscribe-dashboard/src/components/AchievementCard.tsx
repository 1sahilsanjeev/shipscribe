import React from 'react';
import { Award } from 'lucide-react';

interface AchievementCardProps {
  label: string;
  metric: string;
  value: string | number;
  date: string | null;
  icon: React.ReactNode;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ label, metric, value, date, icon }) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white border border-border rounded-xl p-4 shadow-premium hover:shadow-premium-hover transition-all group overflow-hidden relative">
      <div className="absolute -right-4 -top-4 text-primary opacity-[0.03] group-hover:scale-110 transition-transform">
        <Award size={80} />
      </div>
      
      <div className="flex items-center gap-2 text-ink-muted mb-3">
        <div className="p-1.5 bg-paper-warm rounded-lg text-primary">
          {icon}
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">{metric}</span>
      </div>

      <div className="space-y-1">
        <p className="text-3xl font-serif italic text-ink">{value}</p>
        <p className="text-[10px] text-ink-soft font-medium">{label}</p>
        <div className="pt-2 border-t border-border/50 flex items-center justify-between">
          <span className="text-[9px] font-bold text-ink-muted uppercase tracking-tighter">Record Date</span>
          <span className="text-[10px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded">{formatDate(date)}</span>
        </div>
      </div>
    </div>
  );
};

export default AchievementCard;
