import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  RefreshCw, 
  Shield, 
  CreditCard,
  LogOut,
  ChevronRight
} from 'lucide-react';

const Settings: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showKey, setShowKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // For password change (UI only for now)
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profile) {
          setProfile(profile);
          setApiKey(profile.api_key);
        }
      }
    };
    fetchUserData();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API Key copied to clipboard');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleRegenerateKey = async () => {
    if (!confirm('Are you sure? This will disconnect all editors using your current key.')) return;
    
    setIsRegenerating(true);
    try {
      const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const { error } = await supabase
        .from('profiles')
        .update({ api_key: newKey })
        .eq('id', user.id);

      if (error) throw error;
      setApiKey(newKey);
      toast.success('New API Key generated!');
    } catch (error) {
      toast.error('Failed to regenerate key');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-serif">Settings</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage your Supabase profile and API keys.</p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
        >
          <LogOut size={18} />
          <span className="font-bold">Log out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white dark:bg-[#0F0F0F] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-center shadow-premium">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
              <User className="text-primary" size={32} />
            </div>
            <h3 className="text-zinc-900 dark:text-white font-bold text-lg truncate">{user?.email}</h3>
            <div className="mt-4 flex flex-col gap-2">
              <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-mono font-bold rounded-full border border-primary/20 self-center uppercase tracking-wider">
                {profile?.plan || 'Free'} Plan
              </div>
            </div>
          </div>

          <nav className="bg-white dark:bg-[#0F0F0F] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-2">
            <button type="button" className="w-full flex items-center gap-3 p-3 bg-primary/5 text-primary rounded-2xl font-bold text-sm">
              <User size={18} />
              Account
              <ChevronRight className="ml-auto" size={16} />
            </button>
            <button type="button" className="w-full flex items-center gap-3 p-3 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-2xl font-bold text-sm">
              <CreditCard size={18} />
              Billing
              <ChevronRight className="ml-auto" size={16} />
            </button>
          </nav>
        </div>

        <div className="md:col-span-2 space-y-6">
          <section className="bg-white dark:bg-[#0F0F0F] border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-premium">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-1">
                <Key className="text-primary" size={20} />
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white font-serif italic">Shipscribe API Key</h2>
              </div>
              <p className="text-sm text-zinc-500">Connected to Supabase. This key authorizes your MCP server.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="relative">
                <div className="w-full h-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 flex items-center justify-between font-mono text-xs">
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {showKey ? apiKey : `sk_live_••••••••••••••••••••${apiKey.slice(-4)}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                       type="button"
                       onClick={() => setShowKey(!showKey)}
                       title={showKey ? "Hide key" : "Show key"}
                       aria-label={showKey ? "Hide key" : "Show key"}
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button 
                       type="button"
                       onClick={copyToClipboard}
                       title="Copy key"
                       aria-label="Copy key"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleRegenerateKey}
                disabled={isRegenerating}
                className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm inline-flex items-center gap-2"
              >
                <RefreshCw className={isRegenerating ? "animate-spin" : ""} size={16} />
                Regenerate Key
              </button>
            </div>
          </section>

          <section className="bg-white dark:bg-[#0F0F0F] border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-premium">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-1">
                <Shield className="text-primary" size={20} />
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white font-serif italic">Security</h2>
              </div>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={handleUpdatePassword}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-2">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-sm"
                    aria-label="New password"
                  />
                </div>
              </div>
              <button type="submit" className="px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm">
                Update Password
              </button>
            </form>
          </section>

          <section className="bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 font-serif">Delete Account</h2>
            <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-4">This will clear your Supabase profile permanently.</p>
            <button type="button" className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm">Delete Account</button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
