import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Calendar,
  Clock,
  GitCommit,
  Zap,
  Award,
  BarChart3,
  Flame
} from 'lucide-react';
import api from '../lib/api';
import StatCard from '../components/StatCard';
import ActivityHeatmap from '../components/ActivityHeatmap';
import CodingHoursChart from '../components/CodingHoursChart';
import TopProjects from '../components/TopProjects';
import StreakCard from '../components/StreakCard';
import ProductivityTrend from '../components/ProductivityTrend';
import ProductiveHours from '../components/ProductiveHours';
import AchievementCard from '../components/AchievementCard';
import AnalyticsSkeleton from '../components/AnalyticsSkeleton';
import EmptyState from '../components/EmptyState';

const Analytics: React.FC = () => {
  const [range, setRange] = useState<'week' | 'month' | 'all'>('week');
  const [data, setData] = useState<{
    stats: any;
    heatmap: any[];
    hours: any[];
    projects: any[];
    streak: any;
    productivity: any[];
    distribution: any[];
    personalBests: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const days = range === 'week' ? 7 : range === 'month' ? 30 : 365;
      const [statsRes, heatmapRes, hoursRes, projectsRes, streakRes, prodRes, distRes, bestsRes] = await Promise.all([
        api.get('/api/analytics/stats'),
        api.get('/api/analytics/heatmap'),
        api.get(`/api/analytics/hours?range=${range}`),
        api.get('/api/analytics/projects'),
        api.get('/api/analytics/streak'),
        api.get(`/api/analytics/productivity?days=${days}`),
        api.get('/api/analytics/hours-distribution'),
        api.get('/api/analytics/personal-bests')
      ]);

      setData({
        stats: statsRes.data,
        heatmap: heatmapRes.data,
        hours: hoursRes.data,
        projects: projectsRes.data,
        streak: streakRes.data,
        productivity: prodRes.data,
        distribution: distRes.data,
        personalBests: bestsRes.data
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  if (loading && !data) {
    return <AnalyticsSkeleton />;
  }

  // Only show empty state if fetch failed entirely
  if (!loading && !data) {
    return <EmptyState />;
  }

  const { stats, heatmap, hours, projects, streak, productivity, distribution, personalBests } = data!;

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif italic text-ink mb-1">Analytics</h1>
          <p className="text-ink-soft text-sm font-medium">Visualize your productivity and coding habits.</p>
        </div>

        <div className="flex bg-paper-warm p-1 rounded-xl border border-border w-full md:w-auto">
          {(['week', 'month', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                range === r 
                  ? 'bg-white text-primary shadow-premium' 
                  : 'text-ink-muted hover:text-ink-soft'
              }`}
            >
              {r === 'week' ? 'This week' : r === 'month' ? 'This month' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Hours Coded" 
          value={`${stats?.totalHours || 0}h`} 
          icon={Clock} 
          trend="+12%" 
          trendUp={true} 
        />
        <StatCard 
          title="Commits" 
          value={stats?.commits || 0} 
          icon={GitCommit} 
          trend="+5" 
          trendUp={true} 
        />
        <StatCard 
          title="Tasks Done" 
          value={stats?.tasksCompleted || 0} 
          icon={CheckCircle2} 
          trend="+3" 
          trendUp={true} 
        />
        <StatCard 
          title="Streak" 
          value={`${streak?.current_streak || 0} days`} 
          icon={Flame} 
          trend="Stable" 
          trendUp={true} 
        />
      </div>

      {/* Streak + Heatmap two-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {streak && (
          <StreakCard 
            currentStreak={streak.current_streak}
            longestStreak={streak.longest_streak}
            streakStart={streak.streak_start}
            codedToday={streak.coded_today}
          />
        )}
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-6 shadow-premium space-y-4 overflow-hidden">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <h2 className="text-sm font-mono font-bold text-ink-muted uppercase tracking-widest">Activity Heatmap</h2>
          </div>
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <ActivityHeatmap data={heatmap} />
          </div>
        </div>
      </div>

      {/* Full width charts */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-primary" />
          <h2 className="text-lg font-bold text-ink tracking-tight uppercase tracking-widest font-mono">Productivity Metrics</h2>
        </div>
        <div className="space-y-8">
          <CodingHoursChart data={hours} />
          <ProductivityTrend data={productivity} />
        </div>
      </section>

      {/* Two col charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TopProjects data={projects} />
        <ProductiveHours data={distribution} />
      </div>

      {/* Personal Bests Section */}
      <section className="space-y-6 pt-8 border-t border-border/10">
        <div className="flex items-center gap-2">
          <Award size={20} className="text-primary" />
          <h2 className="text-lg font-bold text-ink tracking-tight uppercase tracking-widest font-mono">Personal Bests</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AchievementCard 
            label="Most commits in one day" 
            metric="COMMITS" 
            value={personalBests?.commits?.value || 0} 
            date={personalBests?.commits?.date}
            icon={<GitCommit size={14} />} 
          />
          <AchievementCard 
            label="Most coding hours" 
            metric="HOURS" 
            value={`${personalBests?.hours?.value || 0}h`} 
            date={personalBests?.hours?.date}
            icon={<Clock size={14} />} 
          />
          <AchievementCard 
            label="Most tasks completed" 
            metric="TASKS" 
            value={personalBests?.tasks?.value || 0} 
            date={personalBests?.tasks?.date}
            icon={<CheckCircle2 size={14} />} 
          />
          <AchievementCard 
            label="Highest productivity score" 
            metric="SCORE" 
            value={personalBests?.score?.value || 0} 
            date={personalBests?.score?.date}
            icon={<Zap size={14} />} 
          />
        </div>
      </section>
    </div>
  );
};

export default Analytics;
