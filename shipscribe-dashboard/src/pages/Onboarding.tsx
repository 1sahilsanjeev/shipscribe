import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { 
  Ship, 
  ArrowRight, 
  CheckCircle2, 
  Github, 
  Terminal, 
  Sparkles,
  Rocket,
  Loader2,
  Cpu,
  Zap,
  Copy,
  Check,
  Info
} from 'lucide-react';
import { detectOS, getConfigPath, getConfigBlock, getOneCommandInstall } from '../lib/utils';
import { ExternalLink } from 'lucide-react';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [os, setOs] = useState<'windows' | 'mac' | 'linux'>(detectOS());
  const [username, setUsername] = useState('');
  const [copied, setCopied] = useState(false);
  const [setupMode, setSetupMode] = useState<'command' | 'manual'>('command');
  const [showNodeCheck, setShowNodeCheck] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('api_key')
          .eq('id', user.id)
          .single();
        if (profile) setApiKey(profile.api_key);
      }
    };
    fetchProfile();
  }, []);

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);

      if (error) throw error;

      navigate('/dashboard');
      toast.success("You're all set!");
    } catch (error: any) {
      toast.error(error.message || "Finishing setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white border border-border rounded-[32px] overflow-hidden shadow-2xl flex flex-col relative">
        <div className="absolute top-0 left-0 h-1.5 bg-primary/10 w-full">
          <div 
            className="h-full bg-primary transition-all duration-700 ease-out" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-12 text-center">
          {step === 1 && (
            <div className="animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Ship className="text-primary" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-ink mb-4 italic font-serif">Welcome to Shipscribe</h1>
              <p className="text-ink-soft mb-12 max-w-sm mx-auto">Connecting your developer velocity to Supabase.</p>
              
              <div className="space-y-4 mb-12">
                {[
                  { icon: Terminal, text: "Connect your local editor" },
                  { icon: Github, text: "Sync your GitHub activity" },
                  { icon: Sparkles, text: "Generate daily progress posts" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-paper-warm/50 p-4 rounded-2xl border border-border/50">
                    <item.icon className="text-primary shrink-0" size={20} />
                    <span className="text-sm font-bold text-ink">{item.text}</span>
                    <CheckCircle2 className="ml-auto text-success" size={18} />
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full h-14 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold flex items-center justify-center gap-2 group"
              >
                Let's go
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Rocket className="text-primary" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-ink mb-4 font-serif">Connect Your Tools</h1>
              <p className="text-ink-soft mb-8 italic text-sm">Your API Key: <code className="bg-accent-light px-2 py-1 rounded text-primary font-mono">{apiKey || 'Loading...'}</code></p>
              
              <div className="flex bg-paper-warm p-1 rounded-xl border border-border mb-8 max-w-xs mx-auto">
                <button
                  onClick={() => setSetupMode('command')}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${
                    setupMode === 'command' ? 'bg-white text-primary shadow-sm' : 'text-ink-muted'
                  }`}
                >
                  Quick Setup
                </button>
                <button
                  onClick={() => setSetupMode('manual')}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${
                    setupMode === 'manual' ? 'bg-white text-primary shadow-sm' : 'text-ink-muted'
                  }`}
                >
                  Manual config
                </button>
              </div>

              {setupMode === 'command' ? (
                <div className="text-left space-y-6 mb-12">
                   <div className="bg-white border border-border rounded-3xl p-8 shadow-premium relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-5 -translate-y-4 translate-x-4">
                        <Terminal size={120} />
                      </div>
                      
                      <div className="relative z-10">
                        <h3 className="text-lg font-bold text-ink mb-2">PRIMARY METHOD — One command (recommended)</h3>
                        <p className="text-ink-muted text-[13px] mb-6 font-medium">Run this in your terminal to auto-detect your editor and configure everything for you.</p>
                        
                        <div className="bg-ink rounded-2xl p-6 font-mono text-[13px] text-white/90 relative group/cmd mb-6 border border-white/5 shadow-2xl">
                          <pre className="leading-relaxed whitespace-pre-wrap">
                            {getOneCommandInstall(apiKey)}
                          </pre>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(getOneCommandInstall(apiKey));
                              toast.success('Command copied!');
                            }}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all opacity-0 group-hover/cmd:opacity-100"
                          >
                            <Copy size={16} />
                          </button>
                        </div>

                        <div className="space-y-4">
                           <div className="flex items-center gap-3 text-ink-soft text-[12px] font-bold p-4 bg-paper rounded-2xl border border-border">
                             <Info size={16} className="text-primary flex-shrink-0" />
                             <span>Requires <strong>Node.js 18+</strong> to be installed first.</span>
                           </div>
                           
                           <div className="flex items-center gap-4 ml-1">
                             <button 
                               onClick={() => setShowNodeCheck(!showNodeCheck)}
                               className="text-primary text-[12px] font-bold hover:underline flex items-center gap-1.5"
                             >
                               {showNodeCheck ? 'Hide instructions' : 'How to check Node.js?'}
                             </button>
                             <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="text-ink-muted text-[12px] font-bold hover:text-ink flex items-center gap-1.5 border-l border-border pl-4">
                               Download Node.js <ExternalLink size={14} />
                             </a>
                           </div>

                           {showNodeCheck && (
                             <div className="bg-paper-warm border border-border rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                               <p className="text-[12px] text-ink-muted mb-2 font-bold uppercase tracking-wider">Run this in your terminal:</p>
                               <div className="bg-white border border-border rounded-xl px-3 py-2 font-mono text-[12px] text-ink mb-2">
                                 node --version
                               </div>
                               <p className="text-[11px] text-ink-muted italic">Expected output: <code className="text-ink font-bold">v18.0.0</code> or higher</p>
                             </div>
                           )}
                        </div>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  {/* OS Selector moved inside manual state if user prefers manual */}
                  <div className="flex bg-paper-warm p-1 rounded-xl border border-border mb-8 max-w-xs mx-auto">
                    {(['windows', 'mac', 'linux'] as const).map((o) => (
                      <button
                        key={o}
                        onClick={() => setOs(o)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          os === o 
                            ? 'bg-white text-primary shadow-sm' 
                            : 'text-ink-muted'
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>

                  {os === 'windows' && (
                    <div className="mb-8 text-left max-w-sm mx-auto">
                      <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2 ml-1">Windows Username</p>
                      <input 
                        type="text"
                        placeholder="e.g. sahil"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full h-12 bg-paper-warm border border-border rounded-xl px-4 font-mono text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-6 text-left mb-12">
                    <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                      <h3 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
                        <Terminal size={18} className="text-primary" />
                        1. Open Config File
                      </h3>
                      <div className="bg-paper-warm rounded-xl p-4 flex items-center justify-between border border-border mb-3 font-mono text-[12px]">
                        <span className="truncate max-w-[320px] text-ink-soft">{getConfigPath('antigravity', os, username)}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(getConfigPath('antigravity', os, username));
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                            toast.success('Path copied!');
                          }}
                          className="text-primary p-1 hover:scale-110 transition-transform"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                      
                      {os === 'windows' ? (
                        <div className="space-y-3">
                           <div className="bg-accent-light/30 border border-primary/10 rounded-xl p-4">
                             <p className="text-[12px] font-bold text-primary flex items-center gap-1.5 mb-2">
                               <Zap size={14} /> Antigravity Quickest Way:
                             </p>
                             <p className="text-[12px] text-ink-soft leading-relaxed">
                               Click <strong>...</strong> → <strong>MCP Servers</strong> → <strong>Manage MCP Servers</strong> → <strong>View raw config</strong>
                             </p>
                           </div>
                           <p className="text-[11px] text-ink-muted flex items-center gap-1.5 px-1">
                             <Info size={12} /> Press <strong>Win + R</strong> and paste: <code>%USERPROFILE%\.gemini\antigravity\mcp_config.json</code>
                           </p>
                        </div>
                      ) : (
                        <div className="bg-zinc-900 rounded-xl p-4 font-mono text-[12px] text-zinc-300">
                           <p className="mb-2 text-zinc-500"># Run this in terminal:</p>
                           <code className="text-primary italic">open ~/.gemini/antigravity/mcp_config.json</code>
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                      <h3 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
                        <Cpu size={18} className="text-primary" />
                        2. Paste Configuration
                      </h3>
                      <div className="bg-zinc-900 rounded-2xl p-6 font-mono text-[12px] text-zinc-300 relative group overflow-hidden">
                        <pre className="scrollbar-hide overflow-x-auto leading-relaxed">
                          {getConfigBlock(apiKey, os, 'antigravity').replace(/{username}/g, username || '{username}')}
                        </pre>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(getConfigBlock(apiKey, os, 'antigravity').replace(/{username}/g, username || '{username}'));
                            toast.success('Config copied!');
                          }}
                          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 h-14 bg-paper hover:bg-white text-ink-soft font-bold rounded-2xl">Back</button>
                <button onClick={() => setStep(3)} className="flex-[2] h-14 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold">Next step</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <CheckCircle2 className="text-success" size={48} />
              </div>
              <h1 className="text-3xl font-bold text-ink mb-4 font-serif italic">Ready for Launch!</h1>
              <p className="text-ink-soft mb-12">Your profile is synced with Supabase. We're ready to start tracking.</p>
              
              <button 
                onClick={completeOnboarding}
                disabled={loading}
                className="w-full h-14 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Join"}
                {!loading && <ArrowRight size={20} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
