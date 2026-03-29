import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:3005').replace(/\/api$/, '');
const HEALTH_URL = `${API_URL}/api/health`;

interface ServerStatusContextValue {
  serverOnline: boolean;
  lastChecked: Date | null;
  checking: boolean;
  recheckNow: () => void;
}

const ServerStatusContext = createContext<ServerStatusContextValue>({
  serverOnline: true,
  lastChecked: null,
  checking: false,
  recheckNow: () => {},
});

export const useServerStatus = () => useContext(ServerStatusContext);

// Exponential backoff: 30s → 60s → 120s → 120s (max) when offline
const getNextInterval = (failCount: number): number => {
  if (failCount === 0) return 30_000;   // Online: check every 30s
  const backoff = Math.min(120_000, 30_000 * Math.pow(2, failCount - 1));
  return backoff;
};

export const ServerStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverOnline, setServerOnline] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);
  const failCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        if (failCount.current > 0) {
          console.info('[ServerStatus] ✅ API server back online.');
        }
        failCount.current = 0;
        setServerOnline(true);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      failCount.current += 1;
      setServerOnline(false);
      if (failCount.current === 1) {
        console.warn(`[ServerStatus] ⚠️ API server offline. Will retry with backoff.`);
      }
    } finally {
      setLastChecked(new Date());
      setChecking(false);
      // Schedule next check
      const nextMs = getNextInterval(failCount.current);
      timerRef.current = setTimeout(check, nextMs);
    }
  }, []);

  useEffect(() => {
    check();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [check]);

  return (
    <ServerStatusContext.Provider value={{
      serverOnline,
      lastChecked,
      checking,
      recheckNow: check,
    }}>
      {children}
    </ServerStatusContext.Provider>
  );
};
