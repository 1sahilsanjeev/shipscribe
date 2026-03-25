import React from 'react';
import { BarChart3, Binary, Rocket } from 'lucide-react';

const EmptyState: React.FC = () => {
  return (
    <div className="p-8 max-w-[1200px] mx-auto pb-20 space-y-12">
      {/* Hero Empty State */}
      <div className="bg-white border border-border rounded-3xl p-12 text-center space-y-6 shadow-premium relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        
        <div className="flex justify-center mb-12">
          <div className="relative group">
            {/* Background decorative elements */}
            <div className="absolute -inset-8 bg-gradient-to-tr from-primary/20 via-transparent to-primary/10 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-1000 opacity-70" />
            
            {/* Glassmorphism Plate */}
            <div className="relative w-28 h-28 bg-white/40 backdrop-blur-md border border-white/60 rounded-[2rem] shadow-premium flex items-center justify-center rotate-3 group-hover:rotate-6 transition-transform duration-700">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center transform -rotate-3 group-hover:-rotate-6 transition-transform duration-700">
                <BarChart3 size={44} className="text-primary" />
              </div>
              
              {/* Floating accents */}
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-paper-warm border border-border rounded-xl shadow-sm flex items-center justify-center animate-bounce-slow">
                <Binary size={18} className="text-primary/60" />
              </div>
              
              <div className="absolute -bottom-2 -left-4 w-8 h-8 bg-ink rounded-lg shadow-premium flex items-center justify-center text-[10px] font-mono text-paper font-bold rotate-12">
                01
              </div>
            </div>

            {/* Orbiting particles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-primary/5 rounded-full animate-spin-slow opacity-20 pointer-events-none" />
            <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-primary rounded-full blur-[1px]" />
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-3">
          <h2 className="text-4xl font-serif italic text-ink tracking-tight">Data is <em>simmering</em></h2>
          <p className="text-ink-soft text-[15px] font-medium leading-relaxed">
            Your personal engineering engine is collecting data. Detailed insights will unlock after <span className="text-primary font-bold">3 days</span> of baseline activity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="p-4 bg-paper-warm rounded-2xl border border-border/50 text-left space-y-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-border">
              <Rocket size={16} className="text-primary" />
            </div>
            <p className="text-xs font-bold text-ink">Actionable Insights</p>
            <p className="text-[10px] text-ink-soft">We'll identify your peak performance hours and coding persona.</p>
          </div>
          <div className="p-4 bg-paper-warm rounded-2xl border border-border/50 text-left space-y-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-border">
              <div className="w-3 h-3 bg-primary rounded-full" />
            </div>
            <p className="text-xs font-bold text-ink">Gamified Tracking</p>
            <p className="text-[10px] text-ink-soft">Track streaks and hit personal records to keep the momentum going.</p>
          </div>
          <div className="p-4 bg-paper-warm rounded-2xl border border-border/50 text-left space-y-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-border">
              <BarChart3 size={16} className="text-primary" />
            </div>
            <p className="text-xs font-bold text-ink">Deep Statistics</p>
            <p className="text-[10px] text-ink-soft">Detailed breakdowns of tasks, commits, and hours across projects.</p>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="space-y-6 opacity-30 grayscale pointer-events-none select-none">
        <div className="flex items-center gap-2">
          <div className="h-5 w-32 bg-ink-muted rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-32 bg-paper-warm rounded-2xl border border-border" />
          <div className="h-32 bg-paper-warm rounded-2xl border border-border" />
          <div className="h-32 bg-paper-warm rounded-2xl border border-border" />
          <div className="h-32 bg-paper-warm rounded-2xl border border-border" />
        </div>
        <div className="h-[300px] bg-paper-warm rounded-2xl border border-border" />
      </div>
    </div>
  );
};

export default EmptyState;
