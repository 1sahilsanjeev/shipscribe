import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Request interceptor to inject Supabase session token
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized if needed, though supabase listener in AuthContext might handle it better
    }
    return Promise.reject(error);
  }
);

export const authActions = {
  me: () => api.get('/api/auth/me'),
  regenerateKey: () => api.post('/api/auth/regenerate-key'), 
  mcpStatus: () => api.get('/api/auth/mcp-status'),
};

export const syncActions = {
  github: () => api.post('/api/sync/github'),
  claudecode: () => api.post('/api/sync/claudecode'),
};

export const aiActions = {
  generateSummary: (data: any) => api.post('/api/summaries/generate', data),
  generatePosts: (data: any) => api.post('/api/posts/generate', data),
  chat: (data: any) => api.post('/api/chat', data),
};

export const voiceActions = {
  getAll: () => api.get('/api/voice'),
  getActive: () => api.get('/api/voice/active'),
  create: (data: any) => api.post('/api/voice', data),
  update: (id: string, data: any) => api.patch(`/api/voice/${id}`, data),
  delete: (id: string) => api.delete(`/api/voice/${id}`),
  train: (id: string, x_username: string) => api.post(`/api/voice/${id}/train`, { x_username }),
  activate: (id: string) => api.post(`/api/voice/${id}/activate`),
  preview: (id: string) => api.post(`/api/voice/${id}/preview`),
};

export const projectActions = {
  getAll: () => api.get('/api/projects'),
  getPrimary: () => api.get('/api/projects/primary'),
  create: (data: any) => api.post('/api/projects', data),
  update: (id: string, data: any) => api.patch(`/api/projects/${id}`, data),
  delete: (id: string) => api.delete(`/api/projects/${id}`),
  setPrimary: (id: string) => api.patch(`/api/projects/${id}/primary`),
};

export const waitlistActions = {
  join: (data: any) => api.post('/api/waitlist/join', data),
  check: (email: string) => api.get(`/api/waitlist/check/${email}`),
  stats: () => api.get('/api/waitlist/stats'),
};

export const adminActions = {
  getWaitlist: (params: any) => api.get('/api/admin/waitlist', { params }),
  getStats: () => api.get('/api/admin/stats'),
  approve: (email: string) => api.post('/api/admin/approve', { email }),
  bulkApprove: (emails: string[]) => api.post('/api/admin/bulk-approve', { emails }),
  reject: (email: string) => api.post('/api/admin/reject', { email }),
  revoke: (email: string) => api.post('/api/admin/revoke', { email }),
};

export default api;
