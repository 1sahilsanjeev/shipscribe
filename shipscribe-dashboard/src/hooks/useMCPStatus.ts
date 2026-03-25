import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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

export const useMCPStatus = () => {
  const { session } = useAuth();
  const [status, setStatus] = useState<MCPStatus>({
    connected: false,
    connections: [],
    primary: null
  });
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!session?.access_token) {
      console.log('[useMCPStatus] No session token yet');
      return;
    }

    try {
      console.log('[useMCPStatus] Fetching status...');
      const res = await axios.get(`${API_BASE_URL}/auth/mcp-status`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      console.log('[useMCPStatus] Status received:', res.data);
      setStatus(res.data);
    } catch (error) {
      console.error('Failed to fetch MCP status:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { ...status, loading, refetch: fetchStatus };
};
