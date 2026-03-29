import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Zap, 
  Search, 
  Cpu, 
  ArrowRight, 
  X, 
  ExternalLink,
  Info,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { detectOS, getConfigPath, getConfigBlock } from '../lib/utils';

interface EditorCardProps {
  editor: 'antigravity' | 'cursor' | 'claude_code';
  connection: {
    connected: boolean;
    minutes_ago: number;
    status: 'connected' | 'idle' | 'disconnected';
    last_seen: string;
  } | null;
  apiKey: string;
}

const EditorCard: React.FC<EditorCardProps> = ({ editor, connection, apiKey }) => {
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'polling' | 'success' | 'failed'>('idle');
  const [os, setOs] = useState<'windows' | 'mac' | 'linux'>(detectOS());
  const [username, setUsername] = useState('');

  const editorInfo = {
    antigravity: {
      name: 'Antigravity',
      icon: <Zap size={18} className="text-[#00C2FF]" />,
      path: getConfigPath('antigravity', os, username)
    },
    cursor: {
      name: 'Cursor',
      icon: <Search size={18} className="text-[#3E7EFF]" />,
      path: getConfigPath('cursor', os, username)
    },
    claude_code: {
      name: 'Claude Code',
      icon: <Cpu size={18} className="text-[#9B7C72]" />,
      path: getConfigPath('claude_code', os, username)
    }
  }[editor];

  const apiUrl = 'https://www.shipscribe.pro/api';
  const configBlock = getConfigBlock(apiKey, apiUrl);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(editorInfo.path);
    toast.success('Path copied!');
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(configBlock);
    toast.success('Config copied!');
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const verifyConnection = async () => {
    setVerificationStatus('polling');
    
    let attempts = 0;
    const maxAttempts = 10; // 30 seconds (3s per attempt)
    
    const poll = async () => {
      try {
        const res = await api.get('/auth/mcp-status');
        const isNowConnected = res.data.connections?.some((c: any) => c.editor === editor && c.connected);
        
        if (isNowConnected) {
          setVerificationStatus('success');
          toast.success(`✓ Connected via ${editorInfo.name}!`);
          setTimeout(() => {
            setShowSetup(false);
            setVerificationStatus('idle');
          }, 2000);
          return;
        }
      } catch (err) {
        console.error('Polling error', err);
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 3000);
      } else {
        setVerificationStatus('failed');
      }
    };

    poll();
  };

  const getStatusDisplay = () => {
    if (!connection || connection.status === 'disconnected') {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-gray-400 bg-gray-400/10 text-[10px] font-bold uppercase tracking-tight">
          <div className="w-1.5 h-1.5 rounded-full border border-gray-400" />
          Not connected
        </div>
      );
    }
    if (connection.status === 'connected') {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-success bg-success/10 text-[10px] font-bold uppercase tracking-tight shadow-[0_0_8px_rgba(15,110,86,0.2)]">
          <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_4px_rgba(15,110,86,0.8)]" />
          Connected
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-yellow-500 bg-yellow-500/10 text-[10px] font-bold uppercase tracking-tight">
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
        Last seen {connection.minutes_ago} mins ago
      </div>
    );
  };

  return (
    <>
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-premium flex flex-col p-6 hover:translate-y-[-2px] transition-all group">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-paper-warm flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              {editorInfo.icon}
            </div>
            <span className="font-bold text-ink mr-2">{editorInfo.name}</span>
          </div>
          {getStatusDisplay()}
        </div>

        {/* OS Toggle */}
        <div className="flex bg-paper-warm p-1 rounded-xl border border-border mb-6">
          {(['windows', 'mac', 'linux'] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOs(o)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                os === o 
                  ? 'bg-white text-primary shadow-sm ring-1 ring-border' 
                  : 'text-ink-muted hover:text-ink-soft'
              }`}
            >
              {o}
            </button>
          ))}
        </div>

        {os === 'windows' && (
          <div className="mb-6">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted mb-2">Your Windows username:</p>
            <input 
              type="text"
              placeholder="e.g. sahil"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-paper-warm border border-border rounded-lg px-3 py-2 text-[11px] font-mono text-ink focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        )}

        <div className="space-y-4">
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted mb-2">Config file path:</p>
                <div className="flex items-center justify-between text-[11px] text-ink-muted bg-paper-warm rounded-lg px-3 py-2 border border-border group/path">
                  <span className="truncate max-w-[200px] font-mono" title={editorInfo.path}>{editorInfo.path}</span>
                  <button 
                    onClick={handleCopyPath} 
                    className="text-ink-muted hover:text-primary transition-colors p-1"
                    title="Copy path"
                  >
                    {copiedPath ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  <p className="text-[10px] font-medium text-ink-muted flex items-start gap-1.5">
                    <Info size={12} className="shrink-0 mt-0.5" />
                    <span>
                      File doesn't exist? Run: <br/>
                      <code className="bg-paper-warm px-1.5 py-0.5 rounded border border-border mt-1 block">
                        {os === 'windows' 
                          ? `mkdir "%USERPROFILE%\\.gemini\\antigravity"` 
                          : `mkdir -p ~/.gemini/antigravity`}
                      </code>
                    </span>
                  </p>
                  {editor === 'antigravity' && (
                    <div className="bg-accent-light/30 border border-primary/20 rounded-xl p-3">
                       <p className="text-[10px] font-bold text-primary flex items-center gap-1.5 mb-1">
                         <Zap size={10} /> 💡 Quickest Way:
                       </p>
                       <p className="text-[10px] text-ink-soft leading-relaxed">
                         Click <strong>...</strong> → <strong>MCP Servers</strong> → <strong>Manage MCP Servers</strong> → <strong>View raw config</strong>
                       </p>
                    </div>
                  )}
                  {editor === 'antigravity' && os === 'windows' && (
                    <p className="text-[9px] text-orange-600 font-bold flex items-center gap-1">
                      ⚠️ Use absolute paths only — no ~ shortcuts on Windows
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted mb-2">Paste this in your config file:</p>
                <div className="bg-ink rounded-xl p-4 font-mono text-[11px] text-white/90 overflow-x-auto scrollbar-hide border border-white/5 relative group/config">
                  <pre className="leading-relaxed">{configBlock}</pre>
                  <button 
                    onClick={handleCopyConfig}
                    className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all opacity-0 group-hover/config:opacity-100"
                    title="Copy config"
                  >
                    {copiedConfig ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button 
            onClick={handleCopyConfig}
            className="flex items-center justify-center gap-2 bg-paper-warm hover:bg-white border border-border text-ink-soft py-3 rounded-xl font-bold text-[12px] transition-all"
          >
            {copiedConfig ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            Copy JSON
          </button>
          <button 
            onClick={() => setShowSetup(true)}
            className="flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold text-[12px] hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
          >
            Setup Guide
          </button>
        </div>

        {connection && connection.status !== 'disconnected' && (
          <p className="mt-4 text-[10px] text-ink-muted text-center italic">
            Last seen: {connection.minutes_ago === 0 ? 'just now' : `${connection.minutes_ago} mins ago`}
          </p>
        )}
      </div>

      {/* Setup Guide Modal */}
      {showSetup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-premium-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-border">
            <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-paper-warm/30">
              <h4 className="text-xl font-serif text-ink tracking-tight font-medium">Setup Guide: <em>{editorInfo.name}</em></h4>
              <button 
                onClick={() => setShowSetup(false)} 
                className="p-2 hover:bg-paper-warm rounded-full transition-colors text-ink-muted"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto scrollbar-hide">
              <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-light text-primary flex items-center justify-center font-bold text-sm border border-primary/10 shadow-sm">
                    1
                  </div>
                  <div className="flex-1 pt-1">
                    <h5 className="font-bold text-ink-soft mb-2 text-base">Install Node.js 18+</h5>
                      The Shipscribe MCP server runs locally on your machine and securely sends your activity data to your Shipscribe dashboard. Your code never leaves your computer. Requires Node.js.
                    <div className="flex items-center gap-3">
                      <div className="bg-paper-warm border border-border px-3 py-1.5 rounded-lg font-mono text-[12px] text-ink-soft">
                        node --version
                      </div>
                      <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="text-primary text-[12px] font-bold inline-flex items-center gap-1 hover:underline">
                        Download Node.js <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-light text-primary flex items-center justify-center font-bold text-sm border border-primary/10 shadow-sm">
                    2
                  </div>
                  <div className="flex-1 pt-1">
                    <h5 className="font-bold text-ink-soft mb-2 text-base">Open your config file</h5>
                    
                    {/* OS Selector inside Modal */}
                    <div className="flex bg-paper p-1 rounded-lg border border-border mb-4 w-fit">
                      {(['windows', 'mac', 'linux'] as const).map((o) => (
                        <button
                          key={o}
                          onClick={() => setOs(o)}
                          className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                            os === o ? 'bg-white text-primary shadow-sm ring-1 ring-border' : 'text-ink-muted'
                          }`}
                        >
                          {o === 'windows' ? 'Windows' : 'Mac / Linux'}
                        </button>
                      ))}
                    </div>

                    {os === 'windows' ? (
                      <div className="space-y-4">
                        {editor === 'antigravity' && (
                          <div className="bg-accent-light/30 border border-primary/10 rounded-xl p-4">
                            <p className="text-[12px] font-bold text-primary flex items-center gap-1.5 mb-2">
                              <Zap size={14} /> Option A — Quickest:
                            </p>
                            <p className="text-[12px] text-ink-soft leading-relaxed">
                              In Antigravity click <strong>...</strong> (top right) → <strong>MCP Servers</strong> → <strong>Manage MCP Servers</strong> → <strong>View raw config</strong>
                            </p>
                          </div>
                        )}
                        <div className="bg-paper-warm border border-border rounded-xl p-4">
                          <p className="text-[12px] font-bold text-ink-muted mb-2 uppercase tracking-tight">Option B — Manual:</p>
                          <ol className="text-[12px] text-ink-soft space-y-2 list-decimal ml-4">
                            <li>Press <strong>Win + R</strong></li>
                            <li>Paste: <code className="bg-white px-1.5 py-0.5 rounded border border-border">%USERPROFILE%\.gemini\antigravity\mcp_config.json</code></li>
                            <li>Press <strong>Enter</strong></li>
                          </ol>
                        </div>
                        <p className="text-[12px] text-ink-muted flex items-start gap-1.5">
                          <Info size={14} className="shrink-0 mt-0.5" />
                          <span>
                            If it doesn't exist, create the folder: <br/>
                            <code className="bg-paper-warm px-2 py-1 rounded border border-border mt-1 block">mkdir "%USERPROFILE%\.gemini\antigravity"</code>
                          </span>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-[14px] text-ink-muted leading-relaxed">
                          Open terminal and run:
                        </p>
                        <div className="bg-zinc-900 rounded-xl p-4 font-mono text-[12px] text-zinc-300">
                          <code className="text-primary">open {editorInfo.path}</code>
                        </div>
                        <p className="text-[12px] text-ink-muted">
                          Or create it if it doesn't exist: <br/>
                          <code className="bg-paper-warm px-2 py-1 rounded border border-border mt-1 block">
                             mkdir -p ~/.gemini/antigravity <br/>
                             touch ~/.gemini/antigravity/mcp_config.json
                          </code>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-light text-primary flex items-center justify-center font-bold text-sm border border-primary/10 shadow-sm">
                    3
                  </div>
                  <div className="flex-1 pt-1">
                    <h5 className="font-bold text-ink-soft mb-2 text-base">Paste the config block</h5>
                    <p className="text-[14px] text-ink-muted leading-relaxed mb-3">
                      Paste this JSON block into your config file.
                    </p>
                    <div className="bg-ink rounded-xl p-5 font-mono text-[11px] text-white/90 overflow-x-auto scrollbar-hide border border-white/5 relative group/config-modal">
                      <pre className="leading-relaxed">{configBlock}</pre>
                      <button 
                        onClick={handleCopyConfig}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all"
                        title="Copy configuration"
                        aria-label="Copy configuration"
                      >
                        {copiedConfig ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-light text-primary flex items-center justify-center font-bold text-sm border border-primary/10 shadow-sm">
                    4
                  </div>
                  <div className="flex-1 pt-1">
                    <h5 className="font-bold text-ink-soft mb-2 text-base">Restart your editor</h5>
                    <p className="text-[14px] text-ink-muted leading-relaxed">
                      Close and reopen <strong>{editorInfo.name}</strong> completely to load the new MCP server configuration.
                    </p>
                  </div>
                </div>

                {/* Step 5: Verification */}
                <div className="pt-6 border-t border-border">
                  <div className="flex items-center gap-5 mb-5">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/20">
                      5
                    </div>
                    <h5 className="font-bold text-ink-soft text-base">Verify connection</h5>
                  </div>
                  
                  <div className="bg-paper-warm p-6 rounded-2xl border border-border text-center">
                    {verificationStatus === 'idle' && (
                      <button 
                        onClick={verifyConnection}
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 shadow-sm transition-all"
                      >
                        Check connection
                        <ArrowRight size={18} />
                      </button>
                    )}

                    {verificationStatus === 'polling' && (
                      <div className="py-2 flex flex-col items-center gap-3">
                        <RefreshCw size={24} className="text-primary animate-spin" />
                        <p className="font-bold text-ink-soft">Waiting for connection...</p>
                        <p className="text-[12px] text-ink-muted">Please restart your editor after saving the config.</p>
                      </div>
                    )}

                    {verificationStatus === 'success' && (
                      <div className="py-2 flex flex-col items-center gap-3 animate-in zoom-in-95 duration-500">
                        <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center text-white scale-110">
                          <Check size={28} strokeWidth={3} />
                        </div>
                        <p className="font-bold text-success text-lg">Connected via {editorInfo.name}!</p>
                      </div>
                    )}

                    {verificationStatus === 'failed' && (
                      <div className="space-y-4 animate-in fade-in duration-500 text-left">
                        <div className="flex items-center gap-2 text-red-500 font-bold mb-2">
                          <X size={20} className="p-0.5 bg-red-100 rounded-full" />
                          Still not connected?
                        </div>
                        <p className="text-[13px] text-ink-muted font-medium">Try these fixes:</p>
                        <ul className="text-[13px] space-y-2 text-ink-soft">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-success mt-0.5" />
                            Make sure you saved the config file
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-success mt-0.5" />
                            Make sure you fully restarted the editor
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-success mt-0.5" />
                            Make sure Node.js is installed: <code className="bg-white px-1 py-0.5 rounded border border-border font-mono text-[11px]">node --version</code>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-success mt-0.5" />
                            Check the config file path is correct
                          </li>
                        </ul>
                        <button 
                          onClick={verifyConnection}
                          className="w-full mt-4 bg-primary/10 text-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-all"
                        >
                          Retry Verification
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditorCard;
