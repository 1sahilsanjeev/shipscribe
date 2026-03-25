import { supabase, supabaseAdmin } from './supabase.js';

export const supabaseAuth = {
  async signup(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password 
    });
    return { data, error };
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    return { data, error };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getUser(token: string) {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error) return null;
    return user;
  },

  async signInWithOAuth(provider: 'github') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.VITE_DASHBOARD_URL || 'http://localhost:5173'}/auth/callback`
      }
    });
    return { data, error };
  }
};
