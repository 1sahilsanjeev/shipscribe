import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import StatCard from '../components/StatCard';
import TaskCard from '../components/TaskCard';
import LiveFeed from '../components/LiveFeed';
import CurrentSession from '../components/CurrentSession';
import TimeToday from '../components/TimeToday';
import { Task } from '../types';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useServerStatus } from '../context/ServerStatusContext';

const Home: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    today_activities: 0,
    tasks_completed_today: 0,
    current_streak: 5,
    total_tasks_todo: 0,
    today_commits: 0,
    active_projects: 0
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const { serverOnline } = useServerStatus();

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Supabase queries always work; api.get only when server is online
      const supabasePromises = [
        supabase.from('activities').select('*').eq('user_id', user.id).gte('timestamp', `${today}T00:00:00Z`),
        supabase.from('tasks').select('*').eq('user_id', user.id).eq('status', 'todo').order('created_at', { ascending: false })
      ];

      if (serverOnline) {
        const [statsRes, actRes, tasksRes] = await Promise.all([
          api.get('/api/stats'),
          ...supabasePromises
        ]);
        const activities = Array.isArray(actRes.data) ? actRes.data : [];
        const githubCount = activities.filter((a: any) => a.source === 'github').length || 0;
        const projects = new Set(activities.map((a: any) => a.project) || []);
        setStats({ ...statsRes.data, today_commits: githubCount, active_projects: projects.size });
        setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      } else {
        const [actRes, tasksRes] = await Promise.all(supabasePromises);
        const activities = Array.isArray(actRes.data) ? actRes.data : [];
        const githubCount = activities.filter((a: any) => a.source === 'github').length || 0;
        const projects = new Set(activities.map((a: any) => a.project) || []);
        setStats(prev => ({ ...prev, today_commits: githubCount, active_projects: projects.size }));
        setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      }
    } catch (error: any) {
      if (error.code !== 'ERR_NETWORK') {
        console.error('Error fetching dashboard data:', error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [serverOnline]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 60s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCompleteTask = async (id: number) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Task marked as done!');
      fetchData(); 
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return <div className="p-10 animate-pulse text-ink-muted italic">Loading your velocity...</div>;
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <div className="inline-flex items-center gap-2 bg-accent-light text-primary px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-4 border border-primary/10">
          Supabase Dashboard
        </div>
        <h2 className="text-5xl font-serif text-ink tracking-tight mb-2">
          {getGreeting()}, <em>Here's your day.</em>
        </h2>
        <p className="text-ink-muted font-medium text-lg">Connected and shipping via Supabase.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
           <CurrentSession />
        </div>
        <div className="lg:col-span-1">
           <TimeToday />
        </div>
        <div className="lg:col-span-1">
          <StatCard title="Tasks Done" value={stats.tasks_completed_today} icon={CheckCircle} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <LiveFeed />
        </div>

        <div>
          <div className="bg-white border border-border rounded-2xl shadow-premium flex flex-col overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-border bg-paper-warm/30">
               <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted">Today's Tasks</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-paper/20">
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <TaskCard key={task.id} task={task} onComplete={handleCompleteTask} />
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-paper-warm/20 rounded-xl border border-dashed border-border m-2">
                  <CheckCircle size={32} strokeWidth={1.5} className="text-ink-muted mb-4" />
                  <p className="text-[13px] text-ink-soft font-medium leading-relaxed">
                    All caught up!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
