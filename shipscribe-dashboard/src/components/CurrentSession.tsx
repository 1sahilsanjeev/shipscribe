import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { Timer, FileCode, CheckCircle2 } from 'lucide-react';
import { useServerStatus } from '../context/ServerStatusContext';

// Backoff: 10s, 30s, 60s, 120s (max)
const getBackoffMs = (failCount: number) => Math.min(120_000, 10_000 * Math.pow(3, failCount - 1));

const CurrentSession: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ticker, setTicker] = useState(0);
  const { serverOnline } = useServerStatus();
  const failCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSession = useCallback(async () => {
    if (!serverOnline) return;
    try {
      const response = await api.get('/api/activity/live');
      failCountRef.current = 0;
      setSession(response.data.current_session);
    } catch (error: any) {
      if (error.code !== 'ERR_NETWORK') {
        console.error('Error fetching live session:', error.message);
      }
      failCountRef.current += 1;
    } finally {
      setLoading(false);
    }
  }, [serverOnline]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!serverOnline) return;

    fetchSession();

    const schedule = () => {
      const delay = failCountRef.current === 0 ? 10_000 : getBackoffMs(failCountRef.current);
      timerRef.current = setTimeout(async () => { await fetchSession(); schedule(); }, delay);
    };
    schedule();

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [fetchSession, serverOnline]);

  useEffect(() => {
    const timer = setInterval(() => setTicker(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (input: any) => {
    // If input is a string, use it. If it's a session object, try session_start or created_at
    const start = typeof input === 'string' ? input : (input?.session_start || input?.created_at);
    if (!start) return '--';
    
    const startTime = new Date(start).getTime();
    if (isNaN(startTime)) return '--';
    
    const diff = Math.floor((Date.now() - startTime) / 1000);
    if (diff < 0) return '0s';
    
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    
    if (isNaN(h) || isNaN(m) || isNaN(s)) return '--';
    
    return `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`;
  };

  if (loading) return <div className="h-32 bg-white/5 animate-pulse rounded-2xl border border-border" data-ticker={ticker} />;

  if (!session) {
    return (
      <div className="bg-white border border-border rounded-2xl p-6 shadow-premium h-full flex flex-col justify-center items-center text-center">
        <div className="w-10 h-10 rounded-xl bg-paper-warm flex items-center justify-center mb-3">
           <Timer className="text-ink-muted" size={18} />
        </div>
        <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-ink-muted mb-1">No Active Session</h4>
        <p className="text-[12px] text-ink-soft">Start coding to see live tracking.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-premium h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
         <Timer size={64} />
      </div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
           <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-success">Live Session</span>
        </div>
        <span className="text-[13px] font-serif italic text-ink-muted">{session.editor}</span>
      </div>

      <div className="space-y-4 relative z-10">
        <div>
          <h3 className="text-2xl font-serif text-ink tracking-tight mb-0.5">{session.project}</h3>
          <p className="text-[14px] font-mono font-bold text-primary">{formatDuration(session)}</p>
        </div>

        <div className="flex items-center gap-3 p-3 bg-paper-warm/50 rounded-xl border border-border/50">
           <div className="p-2 bg-white rounded-lg border border-border shadow-sm">
              <FileCode size={16} className="text-ink" />
           </div>
           <div className="min-w-0">
             <p className="text-[10px] font-mono font-bold uppercase text-ink-muted leading-tight">Current File</p>
             <p className="text-[12px] font-medium text-ink truncate">{session.active_file || 'No file active'}</p>
           </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
           <div className="flex items-center gap-1.5">
             <CheckCircle2 size={12} className="text-success" />
             <span className="text-[11px] font-medium text-ink-soft">{session.total_files_count} files today</span>
           </div>
           {session.tool_calls > 0 && (
             <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-primary" />
               <span className="text-[11px] font-medium text-ink-soft">{session.tool_calls} tool calls</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default CurrentSession;
