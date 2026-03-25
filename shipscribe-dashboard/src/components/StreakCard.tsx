import React from 'react';
import { Flame } from 'lucide-react';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  streakStart: string | null;
  codedToday: boolean;
}

const StreakCard: React.FC<StreakCardProps> = ({ 
  currentStreak, 
  longestStreak, 
  streakStart, 
  codedToday 
}) => {
  const progress = longestStreak > 0 ? (currentStreak / longestStreak) * 100 : 0;
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-premium space-y-6 relative overflow-hidden">
      {/* Decorative background icon */}
      <Flame 
        size={120} 
        className="absolute -right-8 -bottom-8 text-primary opacity-[0.03] rotate-12" 
      />

      <div className="flex items-center gap-2 text-primary">
        <Flame size={18} fill="currentColor" />
        <h3 className="text-sm font-mono font-bold uppercase tracking-widest">Current Streak</h3>
      </div>

      <div className="space-y-1">
        <p className="text-6xl font-serif italic text-ink">{currentStreak} days</p>
        <p className="text-xs text-ink-soft font-medium">
          Started: <span className="text-ink font-bold">{formatDate(streakStart)}</span>
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider">
          <span>Longest ever: {longestStreak} days</span>
          <span>{currentStreak}/{longestStreak}</span>
        </div>
        <div className="h-2 w-full bg-paper-warm rounded-full overflow-hidden border border-border/50">
          <div 
            className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(26,63,224,0.3)]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className={`flex items-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
        codedToday 
          ? 'bg-green-50 text-green-700 border-green-100' 
          : 'bg-amber-50 text-amber-700 border-amber-100'
      }`}>
        {codedToday ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>✓ Already coded today</span>
          </>
        ) : (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Keep it going — code today!</span>
          </>
        )}
      </div>
    </div>
  );
};

export default StreakCard;
