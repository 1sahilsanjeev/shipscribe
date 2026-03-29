import React, { useState } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';
import { useServerStatus } from '../context/ServerStatusContext';

const ServerOfflineBanner: React.FC = () => {
  const { serverOnline, checking, recheckNow } = useServerStatus();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissal when server comes back online (so banner shows again if it goes down)
  React.useEffect(() => {
    if (serverOnline) setDismissed(false);
  }, [serverOnline]);

  if (serverOnline || dismissed) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-xl border border-red-500/50 text-sm font-bold max-w-md">
        <WifiOff size={16} className="shrink-0" />
        <span className="flex-1">API server is offline — data may be stale</span>
        <button
          onClick={recheckNow}
          disabled={checking}
          title="Retry connection"
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={() => setDismissed(true)}
          title="Dismiss"
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default ServerOfflineBanner;
