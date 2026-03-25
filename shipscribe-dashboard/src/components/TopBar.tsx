import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { RotateCw, Check, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const TopBar: React.FC = () => {
  const location = useLocation();
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/dashboard/activity': return 'Activity Feed';
      case '/dashboard/tasks': return 'Project Tasks';
      case '/dashboard/summaries': return 'AI Summaries';
      case '/dashboard/posts': return 'Post Generator';
      default: return 'Shipscribe';
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    const syncToast = toast.loading('Syncing your work across sources...');
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
    try {
      await Promise.all([
        axios.post(`${apiUrl}/api/sync/github`),
        axios.post(`${apiUrl}/api/sync/claudecode`)
      ]);
      setLastSynced(new Date());
      toast.success('All sources synced!', { id: syncToast });
    } catch (error) {
      toast.error('Sync partially failed. Check your connection.', { id: syncToast });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="h-[56px] border-b border-border bg-paper/80 backdrop-blur-xl sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-ink-muted uppercase">
          {getPageTitle(location.pathname)}
        </h2>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-ink-muted">
           <Clock size={12} strokeWidth={2.5} />
           <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
             {lastSynced ? `last synced ${Math.floor((new Date().getTime() - lastSynced.getTime()) / 60000)}m ago` : 'not synced'}
           </span>
        </div>

        <button 
          onClick={handleSync}
          disabled={syncing}
          className={`
            flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50
            ${syncing 
              ? 'bg-accent-light text-primary border-primary/20 border' 
              : 'bg-ink text-paper hover:bg-primary'}
          `}
        >
          {syncing ? (
            <RotateCw size={12} className="animate-spin" strokeWidth={3} />
          ) : (
            <Check size={12} strokeWidth={3} />
          )}
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    </div>
  );
};

export default TopBar;
