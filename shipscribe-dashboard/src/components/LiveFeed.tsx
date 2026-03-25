import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Github, Code, FileText, Monitor } from 'lucide-react';

interface Activity {
  id: string;
  note: string;
  source: string;
  editor?: string;
  project: string;
  timestamp: string;
}

const LiveFeed: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [connected, setConnected] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let channel: any = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Initial fetch
      const { data } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(20);
      
      setActivities(data || []);
      setConnected(true);

      // Supabase Realtime subscription
      channel = supabase
        .channel('public:activities')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'activities',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          setActivities(prev => [payload.new as Activity, ...prev].slice(0, 50));
        })
        .subscribe((status) => {
          setConnected(status === 'SUBSCRIBED');
        });
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'github': return <Github className="text-primary" size={14} />;
      case 'claude_code': return <Code className="text-orange-500" size={14} />;
      case 'file_watcher': return <FileText className="text-success" size={14} />;
      default: return <Monitor className="text-ink-muted" size={14} />;
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diff < 30) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-premium flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-paper-warm/30">
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted">Supabase Realtime Feed</h3>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border bg-white shadow-sm">
             <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-ink-muted'}`} />
             <span className="text-[9px] font-mono font-bold text-ink-soft uppercase leading-none">
               {connected ? 'Live' : 'Connecting...'}
             </span>
          </div>
        </div>
      </div>
      
      <div 
        ref={feedRef}
        className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-border/50 bg-paper/10"
      >
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div 
              key={`${activity.id}-${index}`}
              className="px-6 py-4 flex items-start gap-4 hover:bg-paper-warm/30 transition-colors"
            >
              <div className="mt-1 p-2 rounded-lg bg-white border border-border shadow-sm flex-shrink-0">
                {getSourceIcon(activity.source)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-ink font-medium leading-relaxed truncate">
                  {activity.note}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] font-mono font-bold text-ink-muted uppercase">
                    via {activity.editor || (activity.source === 'file_watcher' ? 'Antigravity' : activity.source.replace('_', ' '))} · {getRelativeTime(activity.timestamp)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-[9px] font-mono font-bold text-primary uppercase bg-accent-light px-1.5 py-0.5 rounded border border-primary/10 tracking-tight">
                    {activity.project}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
             <p className="text-ink-muted font-medium italic text-sm">Listening for Supabase events...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
