import React, { useState, useEffect, useCallback } from 'react';
import { 
  Copy, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Github,
  Slack,
  Twitter,
  Linkedin,
  Terminal,
  Search,
  CheckCircle,
  Shield,
  Zap,
  Layout,
  Check,
  X,
  ArrowRight,
  Info,
  Layers,
  Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import EditorCard from '../components/EditorCard';
import { useMCPStatus } from '../hooks/useMCPStatus';
import { authActions } from '../lib/api';

interface IntegrationStatus {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'disconnected' | 'error';
  lastSynced: string | null;
}

const Integrations: React.FC = () => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const { connections, refetch: fetchMcpStatus } = useMCPStatus();

  // Modal States
  const [activeModal, setActiveModal] = useState<'upgrade' | 'regenerate' | null>(null);

  // Connection Data
  const [integrationStatuses] = useState<IntegrationStatus[]>([
    { id: 'github', name: 'GitHub', status: 'active', lastSynced: '2 mins ago' },
    { id: 'claude', name: 'Claude Code', status: 'active', lastSynced: 'Just now' },
    { id: 'slack', name: 'Slack', status: 'paused', lastSynced: null },
    { id: 'x', name: 'X/Twitter', status: 'active', lastSynced: null },
  ]);


  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('api_key, plan')
      .eq('id', user.id)
      .single();
    
    if (error) {
       console.error('Error fetching profile:', error);
       return;
    }

    if (data) {
      setApiKey(data.api_key);
      setIsProUser(data.plan === 'pro');
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
    fetchMcpStatus();
  }, [fetchProfile, fetchMcpStatus]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, {
      icon: '📋',
      duration: 2000
    });
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await authActions.regenerateKey();
      setApiKey(res.data.api_key);
      toast.success('API Key regenerated! Update your .env files.', {
        duration: 5000,
        icon: '🔑'
      });
      setActiveModal(null);
    } catch (error) {
      toast.error('Failed to regenerate key');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Syncing all integrations...',
        success: 'All integrations synced!',
        error: 'Sync failed',
      }
    );
    setTimeout(() => setIsSyncingAll(false), 2000);
  };

  const handleConnect = (isPro: boolean, name: string) => {
    if (isPro && !isProUser) {
      setActiveModal('upgrade');
    } else {
      toast(`${name} connection logic here...`, { icon: '🔗' });
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 bg-accent-light text-primary px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-4 border border-primary/10">
          Connections
        </div>
        <h2 className="text-5xl font-serif text-ink tracking-tight mb-2">
          Integrations <em>& API.</em>
        </h2>
        <p className="text-ink-muted font-medium text-lg">Connect Shipscribe to your existing tools and workflow.</p>
      </div>

      {/* SECTION 1: Your API Key */}
      <section className="bg-white border border-border rounded-2xl p-8 shadow-premium relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-700">
          <Shield size={120} />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted mb-6 flex items-center gap-2">
              <Shield size={12} className="text-primary" />
              Your Shipscribe API Key
            </h3>
            
            <div className="flex items-center gap-3">
              <div className="bg-paper-warm border border-border rounded-xl px-4 py-3 font-mono text-[14px] min-w-[320px] flex items-center justify-between">
                <span className="text-ink-soft select-none">
                  {showKey ? apiKey : `sk_live_••••••••••••••••••••${apiKey.slice(-4)}`}
                </span>
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 hover:bg-white rounded-lg transition-colors text-ink-muted hover:text-primary"
                  title={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              <button 
                onClick={() => handleCopy(apiKey, 'API Key')}
                className="flex items-center gap-2 bg-paper-warm border border-border hover:border-ink/20 hover:bg-white text-ink-soft px-4 py-3 rounded-xl transition-all font-bold text-[13px]"
              >
                <Copy size={16} />
                Copy
              </button>
              
              <button 
                onClick={() => setActiveModal('regenerate')}
                className="flex items-center gap-2 bg-white border border-border hover:border-red-200 hover:text-red-500 text-ink-soft px-4 py-3 rounded-xl transition-all font-bold text-[13px]"
              >
                <RefreshCw size={16} className={isRegenerating ? 'animate-spin' : ''} />
                Regenerate
              </button>
            </div>
            
            <p className="mt-4 text-[12px] text-ink-muted max-w-md">
              Keep this key secret. If you suspect it has been compromised, regenerate it immediately.
            </p>
          </div>
          
          <div className="hidden lg:block">
            <div className="bg-success-light/30 border border-success/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center text-white">
                <Check size={20} strokeWidth={3} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-success capitalize">Active Key</p>
                <p className="text-[11px] text-success/70 font-medium">Valid for all services</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CLI Setup */}
      <section className="bg-paper border border-border rounded-2xl p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 -translate-x-4 translate-y-4 group-hover:-translate-x-2 group-hover:translate-y-2 transition-transform duration-700">
          <Terminal size={100} strokeWidth={1} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
              <Zap size={18} fill="currentColor" />
            </div>
            <h3 className="text-xl font-bold text-ink">One-Command CLI Setup</h3>
            <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider border border-success/10">Quickest</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <p className="text-[14px] text-ink-soft font-medium mb-6 leading-relaxed">
                Run this command in your terminal to automatically configure Shipscribe MCP for <strong>Antigravity</strong>, <strong>Cursor</strong>, <strong>Windsurf</strong>, and <strong>Claude Desktop</strong>.
              </p>
              
              <div className="bg-ink rounded-xl p-5 font-mono text-[13px] text-white/90 border border-white/5 relative group/cli mb-4 shadow-xl">
                <code className="break-all leading-relaxed whitespace-pre-wrap">
                  npx -y shipscribe-setup --key {apiKey} --url https://www.shipscribe.pro/api
                </code>
                <button 
                  onClick={() => handleCopy(`npx -y shipscribe-setup --key ${apiKey} --url https://www.shipscribe.pro/api`, 'CLI command')}
                  className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all active:scale-95"
                  title="Copy command"
                >
                  <Copy size={16} />
                </button>
              </div>
              
              <div className="flex items-center gap-4 text-[11px] text-ink-muted">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-success" /> No install needed</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-success" /> Auto-detects editors</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-success" /> Secure & local</span>
              </div>
            </div>
            
            <div className="bg-paper-warm/50 rounded-2xl p-6 border border-border">
              <h4 className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-4">Supported Editors:</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Antigravity', icon: <Zap size={14} className="text-[#00C2FF]" /> },
                  { name: 'Cursor', icon: <Search size={14} className="text-[#3E7EFF]" /> },
                  { name: 'Windsurf', icon: <Layers size={14} className="text-[#9B7C72]" /> },
                  { name: 'Claude Desktop', icon: <Cpu size={14} className="text-[#D97757]" /> }
                ].map((editor) => (
                  <div key={editor.name} className="flex items-center gap-2.5 bg-white border border-border px-3 py-2 rounded-xl text-xs font-bold text-ink-soft">
                    {editor.icon}
                    {editor.name}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-ink-muted italic leading-relaxed">
                The setup script will update your local configuration files to include the Shipscribe MCP server. Requires Node.js 18+.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Editor Connections */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
            <Terminal size={12} className="text-primary" />
            Editor Connections
          </h3>
        </div>



        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['antigravity', 'cursor', 'claude_code'] as const).map((id) => {
            const connection = connections?.find((c: any) => c.editor === id) || null;
            return (
              <EditorCard 
                key={id}
                editor={id}
                connection={connection}
                apiKey={apiKey}
              />
            );
          })}
        </div>
      </section>

      {/* SECTION 3: Data Source Integrations */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
          <Layers size={12} className="text-primary" />
          Data Source Integrations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'github', name: 'GitHub', icon: <Github />, desc: 'Auto-sync commits, PRs, issues', pro: false, connected: true },
            { id: 'slack', name: 'Slack', icon: <Slack />, desc: 'Decisions, blockers, standups', pro: true, connected: false },
            { id: 'linear', name: 'Linear', icon: <Layers />, desc: 'Tickets, sprints, velocity', pro: true, connected: false },
            { id: 'jira', name: 'Jira', icon: <Layout />, desc: 'Issues, boards, story points', pro: true, connected: false },
            { id: 'notion', name: 'Notion', icon: <Search />, desc: 'Task sync two-way', pro: true, connected: false },
            { id: 'todoist', name: 'Todoist', icon: <CheckCircle />, desc: 'Task sync two-way', pro: true, connected: false },
          ].map((item) => (
            <div key={item.id} className="bg-white border border-border rounded-2xl p-6 shadow-premium hover:shadow-premium-lg transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${item.connected ? 'bg-success-light text-success' : 'bg-paper-warm text-ink-muted'} flex items-center justify-center transition-colors group-hover:scale-110 duration-500`}>
                    {React.cloneElement(item.icon as React.ReactElement, { size: 24 })}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink">{item.name}</span>
                      {item.pro && (
                        <span className="px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-600 text-[9px] font-bold uppercase tracking-wider border border-orange-500/10">Pro</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.connected ? 'bg-success' : 'bg-gray-300'}`} />
                      <span className="text-[10px] font-bold text-ink-muted uppercase tracking-tight">
                        {item.connected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-ink-muted font-medium mb-6">{item.desc}</p>
              
              <button 
                onClick={() => handleConnect(item.pro, item.name)}
                className={`w-full py-3 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-2 ${
                  item.connected 
                    ? 'bg-paper-warm text-ink-soft hover:bg-white border border-border hover:text-red-500 hover:border-red-200' 
                    : 'bg-white border border-border text-ink hover:border-primary hover:text-primary'
                }`}
              >
                {item.connected ? (
                  <>Disconnect <X size={14} /></>
                ) : (
                  <>Connect {item.name} <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: Publishing Connections */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
          <ExternalLink size={12} className="text-primary" />
          Publishing Connections
        </h3>
        <p className="text-[13px] text-ink-muted -mt-4">Where your approved posts get sent.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { id: 'twitter', name: 'X/Twitter', icon: <Twitter />, desc: 'One-click posting to your account', pro: false, connected: true, meta: '@shipscribe_user' },
            { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin />, desc: 'One-click posting to your profile', pro: true, connected: false }
          ].map((item) => (
            <div key={item.id} className="bg-white border border-border rounded-2xl p-6 shadow-premium flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl ${item.connected ? 'bg-primary/10 text-primary' : 'bg-paper-warm text-ink-muted'} flex items-center justify-center`}>
                  {React.cloneElement(item.icon as React.ReactElement, { size: 32 })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-link-soft text-lg">{item.name}</span>
                    {item.pro && (
                      <span className="px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-600 text-[9px] font-bold uppercase tracking-wider">Pro</span>
                    )}
                  </div>
                  <p className="text-[13px] text-ink-muted font-medium mb-1">{item.desc}</p>
                  {item.connected && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-5 h-5 rounded-full bg-paper-warm overflow-hidden flex items-center justify-center border border-border">
                        <span className="text-[8px] font-bold">JD</span>
                      </div>
                      <span className="text-[11px] font-bold text-ink-soft">{item.meta || 'Connected'}</span>
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => handleConnect(item.pro, item.name)}
                className={`px-6 py-3 rounded-xl font-bold text-[13px] transition-all ${
                  item.connected 
                    ? 'bg-paper-warm text-ink-soft hover:bg-white border border-border' 
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                {item.connected ? 'Manage' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: Connection Health */}
      <section className="bg-white border border-border rounded-2xl overflow-hidden shadow-premium">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-paper-warm/30">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted">Connection Health</h3>
          <button 
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="flex items-center gap-2 bg-white border border-border hover:border-primary text-ink-soft hover:text-primary px-4 py-2 rounded-xl transition-all font-bold text-[11px] disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncingAll ? 'animate-spin' : ''} />
            Sync all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/50 text-[11px] font-mono font-bold text-ink-muted uppercase tracking-wider">
                <th className="px-6 py-4">Integration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last synced</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {integrationStatuses.map((item) => (
                <tr key={item.id} className="text-[13px] hover:bg-paper-warm/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-ink-soft">{item.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        item.status === 'active' ? 'bg-success shadow-[0_0_8px_rgba(15,110,86,0.5)]' : 
                        item.status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className={`font-bold capitalize ${
                        item.status === 'active' ? 'text-success' : 
                        item.status === 'paused' ? 'text-yellow-600' : 'text-red-500'
                      }`}>
                        {item.status === 'active' ? '✓ Active' : item.status === 'paused' ? '✗ Paused' : 'Error'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-ink-muted">{item.lastSynced || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary font-bold hover:underline">
                      {item.status === 'active' ? 'Sync now' : 'Connect'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODALS */}
      {activeModal === 'upgrade' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-premium-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center text-orange-600 mx-auto mb-6">
                <Zap size={40} fill="currentColor" />
              </div>
              <h4 className="text-2xl font-serif text-ink tracking-tight mb-3">This is a <em>Pro feature.</em></h4>
              <p className="text-[14px] text-ink-muted font-medium mb-8 leading-relaxed px-4">
                Upgrade to Shipscribe Pro to unlock premium data sources, advanced publishing tools, and multi-team collaboration.
              </p>
              
              <div className="space-y-3 mb-10">
                {[
                  'Sync with Slack, Jira, Linear & more',
                  'One-click publishing to LinkedIn',
                  'Multiple API keys & team access'
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3 bg-paper/50 rounded-xl p-3 border border-border">
                    <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                    <span className="text-[12px] font-bold text-ink-soft">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => { setIsProUser(true); setActiveModal(null); toast.success('Welcome to Pro!'); }}
                className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
              >
                Upgrade to Pro — $9/month
              </button>
              <button 
                onClick={() => setActiveModal(null)}
                className="mt-4 text-ink-muted text-[13px] font-bold hover:text-ink transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'regenerate' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-premium-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6">
                <AlertCircle size={32} />
              </div>
              <h4 className="text-2xl font-serif text-ink tracking-tight mb-3">Regenerate <em>API Key?</em></h4>
              <p className="text-[14px] text-red-600 font-bold mb-6 bg-red-50 rounded-xl p-4 border border-red-100 flex gap-3">
                <Info size={18} className="flex-shrink-0" />
                This will disconnect all editors using your current key. This action cannot be undone.
              </p>
              
              <p className="text-[13px] text-ink-muted mb-4 font-bold">Type <code className="bg-paper-warm px-1.5 py-0.5 rounded text-ink">regenerate</code> to confirm</p>
              <input 
                type="text" 
                placeholder="regenerate" 
                className="w-full bg-paper-warm border border-border rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 mb-8"
                onChange={(e) => setIsRegenerating(e.target.value === 'regenerate')}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setActiveModal(null)}
                  className="py-4 rounded-2xl font-bold bg-paper-warm text-ink-soft hover:bg-white border border-border transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={!isRegenerating}
                  onClick={handleRegenerate}
                  className="py-4 rounded-2xl font-bold bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-30 shadow-lg shadow-red-500/20"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
