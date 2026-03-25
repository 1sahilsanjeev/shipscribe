import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { waitlistActions } from '../lib/api';
import toast from 'react-hot-toast';
import { Github, Cursor, Claude, Antigravity, Windsurf, Notion } from '@lobehub/icons';
import { Loader2, Layers, Twitter, Code2, Slack, MessageSquare, Linkedin, Mic, Radio, PenTool, Lock, BarChart3, Terminal, Orbit, Sparkles, Rocket, Check, Mail } from 'lucide-react';
import './Landing.css';
import { Header } from '../components/ui/header-2';

const Landing: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bottomEmail, setBottomEmail] = useState('');
  const [isAnnual, setIsAnnual] = useState(true);


  const submitToWaitlist = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bottomEmail || !bottomEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setSubmitting(true);
    try {
      await waitlistActions.join({
        email: bottomEmail,
        source: 'bottom_form',
        referred_by: searchParams.get('ref') || null
      });

      setSubmitted(true);
    } catch (err: any) {
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        toast.error('API server unreachable. Is it running?');
      } else {
        toast.error(err.response?.data?.error || 'Failed to join waitlist');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toolsLogos = [
    { icon: <Claude size={16} />, name: 'Claude' },
    { icon: <Cursor size={16} />, name: 'Cursor' },
    { icon: <Antigravity size={16} />, name: 'Antigravity' },
    { icon: <Github size={16} />, name: 'GitHub' },
    { icon: <Code2 size={16} />, name: 'VS Code' },
    { icon: <Windsurf size={16} />, name: 'Windsurf' },
    { icon: <Twitter size={16} />, name: 'X' },
    { icon: <Slack size={16} />, name: 'Slack' },
    { icon: <Notion size={16} />, name: 'Notion' },
    { icon: <MessageSquare size={16} />, name: 'Reddit' },
    { icon: <Linkedin size={16} />, name: 'LinkedIn' },
    { icon: <Layers size={16} />, name: 'Linear' }
  ];

  const LogoItem = ({ icon, name }: { icon: React.ReactNode, name: string }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      padding: '0 24px',
      color: 'rgba(255,255,255,0.35)',
      whiteSpace: 'nowrap',
      transition: 'color 0.2s',
      cursor: 'default',
      flexShrink: 0
    }}
    onMouseEnter={e => {
      e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
    }}
    >
      <div style={{
        width: '3px',
        height: '3px', 
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        flexShrink: 0
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>
        <span style={{ fontFamily: 'monospace', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>{name}</span>
      </div>
    </div>
  );

  return (
    <div className="bg-zinc-950 text-zinc-300 font-body selection:bg-landing-primary/30 selection:text-landing-primary dark overflow-x-hidden min-h-screen landing-page">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@300;400;500;600&display=swap');
        .landing-page h1, .landing-page h2, .landing-page h3, .landing-page .font-instrument-force, .landing-page .font-headline, .landing-page .font-body {
          font-family: 'Instrument Sans', sans-serif !important;
        }
      `}} />
      
      <div className="relative z-10">
        <Header />

        {/* Section 2: Hero */}
        <section className="relative w-full aspect-video flex flex-col items-center justify-center overflow-hidden">
          {/* Hero Background Video */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <video 
              autoPlay 
              muted 
              loop
              playsInline 
              className="w-full h-full object-cover"
            >
              <source src="/hero-bg-2.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="absolute inset-0 z-0 pointer-events-none bg-black/20 mix-blend-multiply"></div>

          <div className="relative z-10 max-w-5xl text-center flex flex-col items-center -translate-y-24">
            <h1 className="text-6xl md:text-8xl tracking-tight mb-8 drop-shadow-2xl overflow-visible flex flex-wrap justify-center gap-x-3 gap-y-2">
              <span className="font-instrument-force text-white font-normal" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>Your</span>
              <span className="font-body text-zinc-400 font-light tracking-normal" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>work,</span>
              <span className="font-instrument-force text-white font-normal" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>out</span>
              <span className="font-body text-zinc-400 font-light tracking-normal" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>loud.</span>
            </h1>
            <p className="text-sm md:text-[15px] text-zinc-300/80 max-w-2xl mb-12 font-body leading-relaxed drop-shadow-md tracking-wide">
              Shipscribe watches your dev activity, understands what you built, and writes your <br className="hidden md:block" /> build-in-public content — automatically, in your voice.
            </p>
            <div className="flex flex-col md:flex-row items-center gap-6 mb-16">
              <a href="#waitlist" className="bg-white/10 border border-white/20 backdrop-blur-md text-white/90 px-8 h-[37px] flex items-center justify-center rounded-full font-body text-xs tracking-wide hover:bg-white/20 transition-all shadow-xl">Get Started</a>
            </div>
          </div>
        </section>

        {/* Section 3: Tools */}
        <section className="bg-black/40 backdrop-blur-md" style={{
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          padding: '24px 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          gap: '0',
          position: 'relative'
        }}>

          {/* LEFT — Fixed label, never scrolls */}
          <div style={{
            flexShrink: 0,
            paddingLeft: '48px',
            paddingRight: '48px',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            whiteSpace: 'nowrap',
            zIndex: 2
          }} className="hidden md:block">
            <span style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
              lineHeight: '1.6',
              display: 'block'
            }}>
              Works natively
            </span>
          </div>

          {/* RIGHT — Scrolling logos container */}
          <div style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative'
          }}>

            {/* LEFT fade gradient (now inside scrolling container to perfectly align with clipping edge) */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '60px',
              background: 'linear-gradient(to right, #050507, transparent)',
              zIndex: 2,
              pointerEvents: 'none'
            }} className="hidden md:block" />

            {/* RIGHT fade gradient */}
            <div style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '80px',
              background: 'linear-gradient(to left, #050507, transparent)',
              zIndex: 2,
              pointerEvents: 'none'
            }} />

            {/* Scrolling track — duplicate logos for seamless loop */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              width: 'max-content'
            }} className="logos-track animate-scroll-left">
              {/* First set of logos */}
              {toolsLogos.map((logo, i) => (
                <LogoItem key={i} icon={logo.icon} name={logo.name} />
              ))}
              {/* Duplicate set for seamless loop */}
              {toolsLogos.map((logo, i) => (
                <LogoItem key={`dup-${i}`} icon={logo.icon} name={logo.name} />
              ))}
            </div>

          </div>
        </section>

        {/* Section 4: How It Works */}
        <section className="py-32 px-8" id="how">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <div className="font-label text-[10px] uppercase tracking-[0.4em] text-blue-400 mb-6 drop-shadow-md">HOW IT WORKS</div>
              <h2 className="text-5xl md:text-6xl font-instrument-force font-light tracking-tight text-white drop-shadow-2xl overflow-visible mb-6">
                Ship. <span className="italic text-blue-400">Scribe</span> handles the rest.
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
                Zero new habits. Zero blank posts. Shipscribe lives inside the tools you already use and documents everything in the background.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
              {/* Card 1: You code */}
              <div className="flex flex-col bg-zinc-900/50 backdrop-blur-sm rounded-[32px] p-10 border border-white/5 group hover:border-white/10 transition-all duration-500 min-h-[450px]">
                <p className="text-zinc-500 text-sm leading-relaxed mb-auto group-hover:text-zinc-400 transition-colors">
                  Work normally in Cursor, Claude Code, or any editor. Shipscribe watches silently — no tabs to open, no commands to run.
                </p>
                <div className="py-12 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-emerald-500/5 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 border border-white/5 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute inset-2 border border-emerald-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                    <Terminal size={36} className="text-emerald-400 relative z-10 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]" />
                  </div>
                </div>
                <h3 className="text-3xl font-instrument-force text-white mt-auto tracking-tight">You<br />code</h3>
              </div>

              {/* Card 2: We understand */}
              <div className="flex flex-col bg-zinc-900/50 backdrop-blur-sm rounded-[32px] p-10 border border-white/5 group hover:border-white/10 transition-all duration-500 min-h-[450px]">
                <p className="text-zinc-500 text-sm leading-relaxed mb-auto group-hover:text-zinc-400 transition-colors">
                  Commits, sessions, files, tasks, and time all flow in. AI filters the noise and surfaces what actually matters.
                </p>
                <div className="py-12 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-blue-500/5 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 border-t border-blue-500/20 rounded-full animate-[spin_8s_linear_infinite]"></div>
                    <div className="absolute inset-4 border-b border-blue-500/10 rounded-full animate-[spin_12s_linear_infinite_reverse]"></div>
                    <Orbit size={36} className="text-blue-400 relative z-10 drop-shadow-[0_0_15px_rgba(96,165,250,0.3)]" />
                  </div>
                </div>
                <h3 className="text-3xl font-instrument-force text-white mt-auto tracking-tight">We<br />understand</h3>
              </div>

              {/* Card 3: Content is drafted */}
              <div className="flex flex-col bg-zinc-900/50 backdrop-blur-sm rounded-[32px] p-10 border border-white/5 group hover:border-white/10 transition-all duration-500 min-h-[450px]">
                <p className="text-zinc-500 text-sm leading-relaxed mb-auto group-hover:text-zinc-400 transition-colors">
                  Three post variants, in your voice, for X and LinkedIn. Thread format, milestone post, or daily update — your call.
                </p>
                <div className="py-12 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-amber-500/5 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 border border-amber-500/10 rounded-md rotate-45 animate-[spin_12s_linear_infinite]"></div>
                    <div className="absolute inset-3 border border-white/5 rounded-full"></div>
                    <Sparkles size={36} className="text-amber-400 relative z-10 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]" />
                  </div>
                </div>
                <h3 className="text-3xl font-instrument-force text-white mt-auto tracking-tight">Content is<br />drafted</h3>
              </div>

              {/* Card 4: You approve in 30s */}
              <div className="flex flex-col bg-zinc-900/50 backdrop-blur-sm rounded-[32px] p-10 border border-white/5 group hover:border-white/10 transition-all duration-500 min-h-[450px]">
                <p className="text-zinc-500 text-sm leading-relaxed mb-auto group-hover:text-zinc-400 transition-colors">
                  Review in the dashboard or straight from your editor. Edit, regenerate, or approve with one click. Nothing posts without you.
                </p>
                <div className="py-12 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-white/5 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 border border-white/10 rounded-full scale-110 animate-pulse"></div>
                    <div className="absolute inset-6 border border-white/5 rounded-full"></div>
                    <Rocket size={36} className="text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                  </div>
                </div>
                <h3 className="text-3xl font-instrument-force text-white mt-auto tracking-tight">You approve<br />in 30s</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Features (Bento Grid) */}
        <section className="py-32 px-8 bg-black/40 backdrop-blur-md border-y border-white/10" id="features">
          <div className="max-w-7xl mx-auto">
            <div className="text-left mb-20">
              <div className="font-label text-[10px] uppercase tracking-[0.4em] text-blue-300 mb-4 drop-shadow-md">Features</div>
              <h2 className="text-5xl md:text-6xl font-instrument-force font-light tracking-tight text-white drop-shadow-2xl overflow-visible">
                Everything a builder needs. <br/><span className="italic opacity-80 text-blue-200">Nothing extra.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Voice training (PRO) */}
              <div className="md:col-span-2 relative p-10 bg-black/60 backdrop-blur-md rounded-2xl border border-blue-500/30 overflow-hidden flex flex-col min-h-[320px] shadow-xl group">
                <div className="absolute top-6 right-6 bg-blue-500/20 text-blue-400 text-[10px] font-label font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/30 backdrop-blur-md z-20">PRO</div>
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 blur-[80px] rounded-full"></div>
                
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-8 relative z-10 shadow-md group-hover:border-blue-500/50 transition-colors">
                  <Mic size={24} className="text-zinc-400 group-hover:text-blue-400 transition-colors" />
                </div>
                
                <h3 className="text-2xl font-instrument-force mb-4 text-white relative z-10">Voice training</h3>
                <p className="text-zinc-400 max-w-xl leading-relaxed z-10 text-[15px] group-hover:text-zinc-200 transition-colors">
                  Upload your tweets and Shipscribe learns how you write. RAG-based fingerprinting works instantly. Fine-tuned Llama 3.1 models trained per creator profile deliver the deepest voice match — your posts will sound indistinguishable from you writing them yourself.
                </p>
              </div>

              {/* Card 2: Activity tracking (FREE) */}
              <div className="p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col group hover:bg-black/50 transition-all shadow-lg">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
                    <Radio size={24} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <span className="text-[8px] font-label px-2 py-0.5 border border-emerald-500/30 text-emerald-400 rounded uppercase bg-emerald-500/10">FREE</span>
                </div>
                <h3 className="text-xl font-instrument-force text-white mb-4">Activity tracking</h3>
                <p className="text-zinc-400 text-[14px] leading-relaxed group-hover:text-zinc-300 transition-colors">
                  GitHub, Cursor, and Claude Code tracked automatically. Every commit, session, and file change captured without lifting a finger.
                </p>
              </div>              {/* Card 3: Post Generation & Publishing (PRO) */}
              <div className="p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-blue-500/30 flex flex-col group hover:bg-black/50 transition-all shadow-lg relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 transition-colors relative z-10">
                    <PenTool size={24} className="text-zinc-400 group-hover:text-blue-400 transition-colors relative z-10" />
                  </div>
                  <span className="text-[8px] font-label px-2 py-0.5 border border-blue-500/30 text-blue-400 rounded uppercase bg-blue-500/10 relative z-10">PRO</span>
                </div>
                <h3 className="text-xl font-instrument-force text-white mb-4 relative z-10">Creative Studio</h3>
                <p className="text-zinc-400 text-[14px] leading-relaxed group-hover:text-zinc-300 transition-colors relative z-10">
                  Generate high-quality threads and articles from your activity. Schedule and publish directly to X and LinkedIn from your dashboard.
                </p>
              </div>

              {/* Card 4: Local-first privacy (FREE) */}
              <div className="p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col group hover:bg-black/50 transition-all shadow-lg">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
                    <Lock size={24} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <span className="text-[8px] font-label px-2 py-0.5 border border-emerald-500/30 text-emerald-400 rounded uppercase bg-emerald-500/10">FREE</span>
                </div>
                <h3 className="text-xl font-instrument-force text-white mb-4">Local-first privacy</h3>
                <p className="text-zinc-400 text-[14px] leading-relaxed group-hover:text-zinc-300 transition-colors">
                  Raw code never leaves your machine. Only activity metadata is sent for AI processing. Secrets are auto-redacted before anything moves.
                </p>
              </div>

              {/* Card 5: Analytics & insights (PRO) */}
              <div className="p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col group hover:bg-black/50 transition-all shadow-lg">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
                    <BarChart3 size={24} className="text-zinc-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <span className="text-[8px] font-label px-2 py-0.5 border border-blue-500/30 text-blue-400 rounded uppercase bg-blue-500/10">PRO</span>
                </div>
                <h3 className="text-xl font-instrument-force text-white mb-4">Analytics & insights</h3>
                <p className="text-zinc-400 text-[14px] leading-relaxed group-hover:text-zinc-300 transition-colors">
                  Activity heatmaps, productivity scores, focus session tracking. See your patterns and understand when you do your best work.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Voice Training Detail */}
        <section className="py-32 px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
            {/* Left Column */}
            <div className="flex-1 w-full max-w-lg">
              <div className="font-label text-[10px] uppercase tracking-[0.4em] text-blue-400 mb-6 drop-shadow-md">VOICE TRAINING</div>
              <h2 className="text-5xl font-instrument-force font-light leading-tight mb-8 text-white drop-shadow-xl overflow-visible">Posts that sound like <br className="hidden md:block"/><span className="italic text-blue-400">you wrote them.</span></h2>
              <p className="text-zinc-200 text-[15px] leading-relaxed mb-10 drop-shadow-md">
                Upload your past tweets. Shipscribe builds a voice fingerprint — your tone, hooks, vocabulary, and style. Then every post it generates is trained on how you actually write.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex-1 w-full shadow-lg h-full">
                  <div className="text-[10px] font-label text-zinc-500 uppercase tracking-widest mb-2">LAYER 1</div>
                  <div className="text-sm font-bold text-white mb-2">RAG fingerprinting</div>
                  <div className="text-xs text-zinc-400">Works instantly on upload</div>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex-1 w-full shadow-lg h-full">
                  <div className="text-[10px] font-label text-zinc-500 uppercase tracking-widest mb-2">LAYER 2</div>
                  <div className="text-sm font-bold text-white mb-2">Fine-tuned model</div>
                  <div className="text-xs text-zinc-400">Deep match · 85 to train</div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex-1 w-full relative">
              <div className="flex flex-col gap-6 w-full max-w-lg mx-auto md:mx-0 md:ml-auto">
                {/* Card 1 (@akshay_k) */}
                <div className="bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl relative">
                  <div className="flex items-start gap-4">
                    <img className="w-10 h-10 rounded-full object-cover shrink-0 shadow-lg border border-white/10" src="https://randomuser.me/api/portraits/men/32.jpg" alt="@akshay_k avatar" />
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">@akshay_k</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-label text-zinc-400 uppercase tracking-wider mb-4">
                        <span>Voice profile</span> <span className="w-1 h-1 rounded-full bg-zinc-600"></span> <span>1,240 tweets trained</span> <span className="w-1 h-1 rounded-full bg-zinc-600"></span> <span><span className="text-emerald-400">★</span> 94% quality</span>
                      </div>
                      <div className="pl-4 py-1 border-l-2 border-blue-500/50">
                        <p className="text-xs text-zinc-300 italic leading-relaxed hover:text-white transition-colors">"finally shipped the realtime collab feature. took 3x longer than expected but the outcome is clean. sometimes slow is fast."</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2 (@sara_r_builds) */}
                <div className="bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl relative">
                  <div className="flex items-start gap-4">
                    <img className="w-10 h-10 rounded-full object-cover shrink-0 shadow-lg border border-white/10" src="https://randomuser.me/api/portraits/women/44.jpg" alt="@sara_r_builds avatar" />
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">@sara_r_builds</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-label text-zinc-400 uppercase tracking-wider mb-4">
                        <span>Voice profile</span> <span className="w-1 h-1 rounded-full bg-zinc-600"></span> <span>847 tweets trained</span> <span className="w-1 h-1 rounded-full bg-zinc-600"></span> <span><span className="text-emerald-400">★</span> 91% quality</span>
                      </div>
                      <div className="pl-4 py-1 border-l-2 border-emerald-500/50">
                        <p className="text-xs text-zinc-300 italic leading-relaxed hover:text-white transition-colors">"Week 6 of building in public. Shipped auth, onboarding, and billing. The business is starting to feel real. Terrifying and exciting at the same time."</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3 (Add voice profile button) */}
                <a href="#waitlist" className="w-full bg-black/20 backdrop-blur-xl p-6 rounded-2xl border border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 transition-all shadow-xl group flex flex-col items-center justify-center gap-2 cursor-pointer h-32 no-underline">
                  <span className="material-symbols-outlined text-zinc-500 group-hover:text-white transition-colors">add</span>
                  <span className="text-xs text-zinc-500 font-label uppercase tracking-widest group-hover:text-white transition-colors">Add your voice profile</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Pricing */}
        <section className="py-32 px-8 bg-black/60 backdrop-blur-lg border-y border-white/10" id="pricing">
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <div className="font-label text-[10px] uppercase tracking-[0.4em] text-blue-300 mb-6 drop-shadow-md">Pricing</div>
            <h2 className="text-5xl font-instrument-force font-light mb-12 text-white drop-shadow-xl">Simple. <span className="italic text-blue-300">Fair.</span> No surprises.</h2>
            <div className="flex items-center justify-center gap-6 mb-16">
              <span className={`text-xs font-label uppercase transition-colors duration-300 ${!isAnnual ? 'text-white font-bold' : 'text-zinc-500'}`}>Monthly</span>
              <div 
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-12 h-6 bg-white/5 backdrop-blur-sm rounded-full p-1 cursor-pointer flex items-center border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className={`w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(146,221,187,0.5)] transition-all duration-300 transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-label uppercase transition-colors duration-300 ${isAnnual ? 'text-white font-bold' : 'text-zinc-500'}`}>Annual</span>
                <span className="text-[9px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">SAVE 17%</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Free Card */}
              <div className="p-8 bg-zinc-900/50 backdrop-blur-sm rounded-[32px] border border-white/5 hover:border-white/10 transition-all duration-500 flex flex-col h-full group">
                <div className="font-sans text-xs font-normal uppercase tracking-[0.2em] text-zinc-400 mb-2">FREE</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-inter font-light text-white tracking-tight">$0</span>
                </div>
                <div className="text-xs text-zinc-500 uppercase font-label mb-8">forever</div>
                
                <div className="h-px bg-white/5 w-full mb-8"></div>
                
                <ul className="space-y-4 mb-10 text-sm text-zinc-400 flex-grow">
                  <li className="flex items-center gap-3"><Check size={16} className="text-emerald-400 shrink-0" /> GitHub + Cursor tracking</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-emerald-400 shrink-0" /> Manual task management</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-emerald-400 shrink-0" /> Daily one-liner + short summary</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-emerald-400 shrink-0" /> X posts — 3 variants / day</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-emerald-400 shrink-0" /> 50 generations / month</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-emerald-400 shrink-0" /> 7-day history</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-emerald-400 shrink-0" /> Basic privacy filter</li>
                </ul>
                <a href="#waitlist" className="w-full py-4 border border-white/10 rounded-full font-label text-xs uppercase tracking-widest hover:bg-white/5 transition-all text-white backdrop-blur-sm font-bold mt-auto flex items-center justify-center no-underline">Get started free</a>
              </div>

              {/* Pro Card */}
              <div className="p-8 bg-zinc-950 backdrop-blur-sm rounded-[32px] border border-blue-500/20 relative flex flex-col h-full group hover:border-blue-400/30 transition-all duration-500">
                {/* Background Glow Container */}
                <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full"></div>
                </div>
                
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-label font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_4px_20px_rgba(37,99,235,0.4)] z-20 flex items-center whitespace-nowrap whitespace-nowrap border border-blue-400/20">Launch price · locked in</div>
                
                <div className="font-sans text-xs font-normal uppercase tracking-[0.2em] text-zinc-500 mb-2 mt-4 relative z-10">PRO</div>
                <div className="flex items-baseline gap-2 mb-2 relative z-10">
                  <span className="text-5xl font-inter font-light text-white tracking-tight">{isAnnual ? '$7.50' : '$9'}</span>
                </div>
                <div className="text-xs text-zinc-500 uppercase font-label mb-8 relative z-10">{isAnnual ? 'per month · $90/yr (2 months free)' : 'per month'}</div>
                
                <div className="h-px bg-white/5 w-full mb-8 relative z-10"></div>
                
                <ul className="space-y-4 mb-10 text-sm text-zinc-300 relative z-10 flex-grow">
                  <li className="flex items-center gap-3"><Check size={16} className="text-blue-400 shrink-0 drop-shadow-md" /> Everything in Free</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-blue-400 shrink-0 drop-shadow-md" /> Claude Code + Slack + Linear</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-blue-400 shrink-0 drop-shadow-md" /> All summary formats</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-blue-400 shrink-0 drop-shadow-md" /> LinkedIn, Reddit, Newsletter</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-blue-400 shrink-0 drop-shadow-md" /> Unlimited generations</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-blue-400 shrink-0 drop-shadow-md" /> Voice training (3 profiles)</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-blue-400 shrink-0 drop-shadow-md" /> Fine-tuned model per profile</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-blue-400 shrink-0 drop-shadow-md" /> One-click posting</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-blue-400 shrink-0 drop-shadow-md" /> Full analytics dashboard</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-blue-400 shrink-0 drop-shadow-md" /> Focus sessions + streaks</li>
                </ul>
                <a href="#waitlist" className="w-full py-4 bg-white text-black rounded-full font-label text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all font-bold relative z-10 mt-auto shadow-lg hover:shadow-xl flex items-center justify-center no-underline">Join waitlist → get Pro price</a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Early Users */}
        <section className="py-32 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <div className="font-label text-[10px] uppercase tracking-[0.4em] text-blue-400 mb-6 drop-shadow-md">EARLY USERS</div>
              <h2 className="text-5xl font-instrument-force font-light mb-12 text-white drop-shadow-xl">What builders are saying.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="p-8 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-colors shadow-xl flex flex-col justify-between h-full group">
                <p className="text-[15px] leading-relaxed mb-8 italic text-zinc-300">
                  "I've tried every build-in-public tool. They all require me to <strong className="text-white font-bold">start from a blank page.</strong> Shipscribe is the first one that actually knows what I did that day."
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <img className="w-10 h-10 rounded-full object-cover shrink-0 shadow-lg border border-white/10 group-hover:border-blue-400/50 transition-colors" src="/testimonials/arjun.png" alt="@arjun_codes avatar" />
                  <div>
                    <div className="text-sm font-bold text-white">@arjun_codes</div>
                    <div className="text-[10px] font-label text-zinc-400 uppercase tracking-widest mt-1">Founder @ TechFlow · SF</div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-8 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-colors shadow-xl flex flex-col justify-between h-full group">
                <p className="text-[15px] leading-relaxed mb-8 italic text-zinc-300">
                  "The voice training is unreal. I uploaded 2 years of tweets and the posts it generates now are <strong className="text-white font-bold">indistinguishable from my own writing.</strong> My audience hasn't noticed a thing."
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <img className="w-10 h-10 rounded-full object-cover shrink-0 shadow-lg border border-white/10 group-hover:border-blue-400/50 transition-colors" src="/testimonials/elena.png" alt="@elena_builds avatar" />
                  <div>
                    <div className="text-sm font-bold text-white">@elena_builds</div>
                    <div className="text-[10px] font-label text-zinc-400 uppercase tracking-widest mt-1">Indie Hacker · Milan</div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-8 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-colors shadow-xl flex flex-col justify-between h-full group">
                <p className="text-[15px] leading-relaxed mb-8 italic text-zinc-300">
                  "I went from posting maybe once a week to <strong className="text-white font-bold">daily updates</strong> without any extra work. My GitHub activity is finally visible to the people who matter."
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <img className="w-10 h-10 rounded-full object-cover shrink-0 shadow-lg border border-white/10 group-hover:border-blue-400/50 transition-colors" src="/testimonials/kenji.png" alt="@kenji_dev avatar" />
                  <div>
                    <div className="text-sm font-bold text-white">@kenji_dev</div>
                    <div className="text-[10px] font-label text-zinc-400 uppercase tracking-widest mt-1">Fullstack Engineer · Tokyo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 9: Waitlist */}
        <section id="waitlist" className="relative w-full aspect-video flex flex-col items-center justify-center overflow-hidden">
          {/* Waitlist Background Video */}
          <div className="absolute inset-0 z-0 pointer-events-none bg-black">
            <video 
              autoPlay 
              muted 
              loop 
              playsInline 
              className="w-full h-full object-cover opacity-60"
            >
              <source src="/waitlist-bg.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none"></div>
          <div className="relative z-10 max-w-4xl mx-auto text-center px-6 -translate-y-[206px]">
            <div className="font-label text-[10px] uppercase tracking-[0.5em] text-emerald-400 mb-8 drop-shadow-md">Early Access</div>
            <h2 className="text-6xl md:text-7xl font-instrument-force font-light mb-12 text-white drop-shadow-sm tracking-tighter leading-[1.0] overflow-visible italic-none">Be <span className="text-zinc-500">first</span> to <span className="text-zinc-500">scribe.</span></h2>
            
            <form onSubmit={submitToWaitlist} className="max-w-xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 mb-12 mt-4">
              <div className="relative flex-1 w-full group transition-all duration-300">
                {/* Glow Effect */}
                <div className="absolute -inset-[1px] bg-gradient-to-r from-white/10 to-white/5 rounded-full blur-sm opacity-10 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-center bg-white/10 border border-white/20 rounded-full px-6 h-[37px] backdrop-blur-md hover:bg-white/[0.12] hover:border-white/30 transition-all">
                  <Mail className="text-zinc-500 mr-3 shrink-0" size={18} />
                  <input 
                    className="bg-transparent font-body text-white w-full h-full outline-none placeholder:text-zinc-500 text-sm" 
                    placeholder="Enter your email" 
                    type="email" 
                    value={bottomEmail}
                    onChange={(e) => setBottomEmail(e.target.value)}
                    disabled={submitting || submitted}
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={submitting || submitted}
                className="relative bg-white/10 border border-white/20 backdrop-blur-md text-white px-10 h-[37px] rounded-full font-instrument-force text-[15px] font-normal tracking-tight hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-full md:w-auto flex items-center justify-center shrink-0 group overflow-hidden"
              >
                <div className="relative z-10 flex items-center gap-2">
                  {submitting ? <Loader2 className="animate-spin text-black" size={16} /> : (submitted ? "✓ Joined" : "Join Waitlist")}
                </div>
                {/* Inner Glow Shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </button>
            </form>
          </div>

          {/* Transparent Footer Overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-20 pb-12 w-full">
            <div className="max-w-7xl mx-auto px-12 flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="text-lg font-instrument-force italic text-white mb-1 tracking-tight">shipscribe</div>
                <div className="font-instrument-force italic text-xs text-zinc-600">Built for the obsidian terminal.</div>
              </div>
              <div className="flex flex-wrap justify-center md:justify-end gap-x-12 gap-y-4">
                <a className="font-label text-xs uppercase tracking-widest text-zinc-500 hover:text-emerald-400 hover:drop-shadow-[0_0_5px_rgba(146,221,187,0.5)] transition-all" href="#">Documentation</a>
                <a className="font-label text-xs uppercase tracking-widest text-zinc-500 hover:text-emerald-400 hover:drop-shadow-[0_0_5px_rgba(146,221,187,0.5)] transition-all" href="#">Changelog</a>
                <a className="font-label text-xs uppercase tracking-widest text-zinc-500 hover:text-emerald-400 hover:drop-shadow-[0_0_5px_rgba(146,221,187,0.5)] transition-all" href="#">Privacy</a>
                <a className="font-label text-xs uppercase tracking-widest text-zinc-500 hover:text-emerald-400 hover:drop-shadow-[0_0_5_px_rgba(146,221,187,0.5)] transition-all" href="#">Terms</a>
              </div>
            </div>
          </div>
        </section>



      </div>
    </div>
  );
};

export default Landing;
