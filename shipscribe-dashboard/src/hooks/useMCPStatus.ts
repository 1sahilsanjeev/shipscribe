import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useServerStatus } from '../context/ServerStatusContext';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:3005'}/api`;

export interface MCPConnection {
  id: string;
  user_id: string;
  editor: string;
  platform: string;
  last_seen: string;
  connected: boolean;
  minutes_ago: number;
  status: 'connected' | 'idle' | 'disconnected';
}

export interface MCPStatus {
  connected: boolean;
  connections: MCPConnection[];
  primary: MCPConnection | null;
}

// Exponential backoff intervals: 60s, 2m, 4m, 8m (max)
const getBackoffMs = (failCount: number) =>
  Math.min(8 * 60_000, 60_000 * Math.pow(2, failCount));

export const useMCPStatus = () => {
  const { session } = useAuth();
  const { serverOnline } = useServerStatus();
  const [status, setStatus] = useState<MCPStatus>({
    connected: false,
    connections: [],
    primary: null,
  });
  const [loading, setLoading] = useState(true);
  const failCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!session?.access_token || !serverOnline) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/auth/mcp-status`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      failCountRef.current = 0;
      const data = res.data;
      setStatus({
        connected: data?.connected ?? false,
        connections: Array.isArray(data?.connections) ? data.connections : [],
        primary: data?.primary ?? null
      });
    } catch (error: any) {
      // Don't log connection refused — ServerOfflineBanner handles it
      if (error.code !== 'ERR_NETWORK') {
        console.error('[useMCPStatus] Error:', error.message);
      }
      failCountRef.current += 1;
    } finally {
      setLoading(false);
    }
  }, [session, serverOnline]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // If server is offline, don't poll — wait for it to come back
    if (!serverOnline) return;

    fetchStatus();

    const scheduleNext = () => {
      const delayMs = failCountRef.current === 0 ? 60_000 : getBackoffMs(failCountRef.current);
      timerRef.current = setTimeout(async () => {
        await fetchStatus();
        scheduleNext();
      }, delayMs);
    };
    scheduleNext();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchStatus, serverOnline]);

  return { ...status, loading, refetch: fetchStatus };
};
