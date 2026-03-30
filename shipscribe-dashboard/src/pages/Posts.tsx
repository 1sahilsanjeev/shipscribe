import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Copy, Plus } from 'lucide-react'
import './Posts.css'

export default function Posts() {
  const navigate = useNavigate()
  const [variants, setVariants] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [savedPosts, setSavedPosts] = useState<any[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [savedIndex, setSavedIndex] = useState<number | null>(null)
  const [summaryContext, setSummaryContext] = useState<any>(null)
  const [personas, setPersonas] = useState<any[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [lastUsedContext, setLastUsedContext] = useState<{
    voice: { name: string, username: string } | null,
    project: { name: string, emoji: string } | null
  } | null>(null)

  useEffect(() => {
    // Check if coming from Summaries page
    const stored = sessionStorage.getItem('generatePostFrom')
    let autoContext = null
    if (stored) {
      autoContext = JSON.parse(stored)
      setSummaryContext(autoContext)
      sessionStorage.removeItem('generatePostFrom')
    }
    
    // Fetch personas and current active
    api.get('/voice').then(res => {
      const data = Array.isArray(res.data) ? res.data : [];
      setPersonas(data);
      const active = data.find((p: any) => p.is_active);
      setSelectedVoice(active?.id || null);

      // Auto-generate if we have context
      if (autoContext) {
        generatePosts(autoContext.summaryText, autoContext.stats, autoContext.summaryId, active?.id);
      }
    });

    fetchSavedPosts()
  }, [])

  async function generatePosts(
    text?: string, 
    stats?: any,
    summaryId?: string,
    voiceId?: string
  ) {
    const summaryText = text || summaryContext?.summaryText
    if (!summaryText) {
      setError('No summary to generate posts from')
      return
    }

    const voicePersonaId = voiceId !== undefined ? voiceId : selectedVoice

    setGenerating(true)
    setError('')
    setVariants([])

    try {
      const res = await api.post('/api/posts/generate', {
        summaryText,
        stats,
        summaryId,
        voicePersonaId
      })
      setVariants(Array.isArray(res.data?.variants) ? res.data.variants : [])
      setLastUsedContext({
        voice: res.data.voice_used,
        project: res.data.project_used
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function fetchSavedPosts() {
    try {
      const res = await api.get('/posts')
      setSavedPosts(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoadingPosts(false)
    }
  }

  async function copyPost(text: string, index: number) {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  async function approvePost(variant: any, index: number) {
    try {
      await api.post('/api/posts/save', {
        text: variant.text,
        tone: variant.tone,
        platform: 'twitter',
        summary_id: summaryContext?.summaryId
      })
      setSavedIndex(index)
      setTimeout(() => setSavedIndex(null), 2000)
      fetchSavedPosts()
      toast.success('Post saved to history!')
    } catch (err) {
      toast.error('Failed to save post')
    }
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return
    try {
      await api.delete(`/api/posts/${id}`)
      setSavedPosts(prev => prev.filter(p => p.id !== id))
      toast.success('Deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const TONE_COLORS = {
    casual: '#10B981',
    technical: '#3B82F6',
    storytelling: '#8B5CF6'
  }

  const TONE_LABELS: Record<string, string> = {
    casual: '💬 Casual',
    technical: '⚙️ Technical',
    storytelling: '📖 Story'
  }

  return (
    <div className="posts-page animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="posts-header mb-8">
        <div>
          <h1 className="text-4xl font-serif text-ink tracking-tight mb-2">Post <em>Generator</em></h1>
          <p className="text-ink-muted font-medium">Generate X/Twitter posts from your summaries</p>
        </div>
      </div>

      {/* Summary context banner & Voice Selector */}
      <div className="flex flex-col gap-6 mb-8">
        {summaryContext && (
          <div className="context-banner bg-primary/5 border border-primary/10 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-premium">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-primary/10 text-xl">✍️</span>
              <div>
                <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest leading-none mb-1">Source Summary</p>
                <h3 className="text-sm font-bold text-ink">
                  {summaryContext.summaryDate === new Date().toISOString().split('T')[0] ? 'Today' : summaryContext.summaryDate}'s Recap
                </h3>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="voice-selector-mini bg-white border border-border p-1 rounded-2xl flex items-center gap-1 shadow-sm">
                <span className="text-[10px] font-bold text-ink-muted px-3 uppercase tracking-tighter">Style:</span>
                <button
                  onClick={() => setSelectedVoice(null)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${!selectedVoice ? 'bg-ink text-paper shadow-sm' : 'text-ink-soft hover:bg-paper'}`}
                >
                  Default
                </button>
                {personas.filter(p => p.status === 'ready').map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedVoice(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${selectedVoice === p.id ? 'bg-primary text-white shadow-sm' : 'text-ink-soft hover:bg-paper'}`}
                  >
                    @{p.x_username}
                  </button>
                ))}
                <button 
                  onClick={() => navigate('/dashboard/voice')}
                  className="px-2 py-1.5 text-ink-muted hover:text-primary transition-colors"
                  title="Add new voice"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button 
                onClick={() => generatePosts()}
                disabled={generating}
                className="px-6 py-2.5 bg-ink text-paper text-xs font-bold rounded-2xl hover:bg-primary transition-all active:scale-95 shadow-premium disabled:opacity-50"
              >
                {generating ? 'Generating...' : '✨ Generate Posts'}
              </button>
            </div>
          </div>
        )}

        {/* Global Voice Hint if none active */}
        {!selectedVoice && personas.length > 0 && !generating && (
          <div className="no-voice-hint bg-paper-warm/30 border border-dashed border-border p-3 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-medium text-ink-muted">
            <span>💡 No voice persona selected. Posts will use a generic builder style.</span>
            <a href="/dashboard/voice" className="text-primary font-bold hover:underline">Select a voice →</a>
          </div>
        )}
        {personas.length === 0 && !generating && (
          <div className="no-voice-hint bg-paper-warm/30 border border-dashed border-border p-3 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-medium text-ink-muted">
            <span>💡 Add a voice persona to generate posts in your own style.</span>
            <a href="/dashboard/voice" className="text-primary font-bold hover:underline">Add your X account →</a>
          </div>
        )}
      </div>

      {/* Context Info Bar (shown after generation) */}
      {!generating && lastUsedContext && variants.length > 0 && (
        <div className="context-info-bar mb-6 bg-white border border-border px-4 py-2 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-4 text-[11px] font-bold text-ink-soft">
            {lastUsedContext.voice && (
              <span className="flex items-center gap-1.5 bg-paper px-2.5 py-1 rounded-lg">
                🎙️ Voice: <span className="text-primary">{lastUsedContext.voice.name} (@{lastUsedContext.voice.username})</span>
              </span>
            )}
            {lastUsedContext.project && (
              <span className="flex items-center gap-1.5 bg-paper px-2.5 py-1 rounded-lg">
                {lastUsedContext.project.emoji} Project: <span className="text-ink">{lastUsedContext.project.name}</span>
              </span>
            )}
          </div>
          <button 
            onClick={() => navigate('/dashboard/voice')}
            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
          >
            Change Context →
          </button>
        </div>
      )}

      {/* Generated variants */}
      {generating ? (
        <div className="generating-state flex flex-col items-center justify-center py-20 bg-white border border-border rounded-3xl shadow-premium mb-12">
          <div className="spinner animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4" />
          <p className="text-ink-muted font-bold font-mono text-[10px] uppercase tracking-[0.2em] animate-pulse">Writing your posts...</p>
        </div>
      ) : variants.length > 0 ? (
        <div className="variants-section mb-12">
          <h2 className="text-lg font-bold text-ink mb-6 px-1">Choose a variant</h2>
          <div className="variants-grid grid grid-cols-1 md:grid-cols-3 gap-6">
            {variants.map((variant, i) => (
              <div key={i} className="variant-card bg-white border border-border rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-premium transition-all hover:border-primary/20 group">
                
                {/* Tone badge */}
                <div className="variant-header flex items-center justify-between mb-6">
                  <span 
                    className="tone-badge text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ 
                      background: (TONE_COLORS[variant.tone as keyof typeof TONE_COLORS] || '#666') + '15',
                      color: TONE_COLORS[variant.tone as keyof typeof TONE_COLORS] || '#666'
                    }}
                  >
                    {TONE_LABELS[variant.tone as keyof typeof TONE_LABELS]}
                  </span>
                  <span className={`char-count font-mono text-[10px] font-bold ${variant.chars > 280 ? 'text-red-500' : 'text-ink-muted'}`}>
                    {variant.chars}/280
                  </span>
                </div>

                {/* Post text */}
                <div className="variant-text text-[14px] leading-relaxed text-ink-soft mb-8 flex-1 italic font-medium">
                  "{variant.text}"
                </div>

                {/* Actions */}
                <div className="variant-actions flex items-center gap-2 pt-6 border-t border-border/50 mt-auto">
                  <button 
                    className="copy-btn flex-1 py-2.5 bg-paper rounded-xl text-ink font-bold text-xs hover:bg-border transition-all active:scale-[0.98] border border-transparent"
                    onClick={() => copyPost(variant.text, i)}
                  >
                    {copiedIndex === i ? '✓ Copied!' : '📋 Copy'}
                  </button>
                  <button
                    className="approve-btn flex-1 py-2.5 bg-ink text-paper rounded-xl text-xs font-bold hover:bg-primary transition-all active:scale-[0.98] shadow-premium"
                    onClick={() => approvePost(variant, i)}
                  >
                    {savedIndex === i ? '✓ Saved!' : '✅ Save'}
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Regenerate footer */}
          <div className="mt-8 text-center">
            <button 
              className="px-6 py-3 bg-white border border-border rounded-2xl text-sm font-bold text-ink hover:bg-paper-warm transition-all active:scale-95 shadow-sm"
              onClick={() => generatePosts()}
            >
              🔄 Generate new variations
            </button>
          </div>
        </div>
      ) : !summaryContext ? (
        <div className="empty-state py-20 text-center bg-white border border-dashed border-border rounded-3xl shadow-sm mb-12">
          <span className="text-4xl mb-4 block">🐦</span>
          <h3 className="text-xl font-bold text-ink mb-2">No posts generated yet</h3>
          <p className="text-sm text-ink-muted mb-8 italic">Go to Summaries and click "Generate Post" 
             on any summary to start.</p>
          <button 
            onClick={() => navigate('/summaries')}
            className="px-8 py-3 bg-ink text-paper rounded-xl font-bold text-sm hover:bg-primary transition-all shadow-premium"
          >
            Go to Summaries →
          </button>
        </div>
      ) : null}

      {error && (
        <div className="error-message p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium mb-8 flex items-center justify-between shadow-sm">
          <span>⚠️ {error}</span>
          <button 
            onClick={() => generatePosts()}
            className="px-4 py-1.5 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-all font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Saved posts history */}
      <div className="saved-posts-section pt-12 border-t border-border">
        <h2 className="text-2xl font-serif text-ink tracking-tight mb-8">Post <em>Archives</em></h2>
        
        {loadingPosts ? (
          <div className="loading-skeletons space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 bg-paper/50 rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="empty-history py-10 text-center bg-paper-warm/20 border border-dashed border-border rounded-2xl italic text-ink-muted text-sm">
            No approved posts in history. Save a variant above to see it here.
          </div>
        ) : (
          <div className="saved-posts-list space-y-4">
            {savedPosts.map(post => (
              <div key={post.id} className="saved-post-card bg-white border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between group hover:shadow-premium transition-all gap-4">
                <div className="flex items-center gap-5 flex-1">
                  <div className="p-3 bg-primary/5 rounded-xl text-primary border border-primary/10">
                    <Twitter size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="tone-badge-small text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {post.tone}
                      </span>
                      <span className="text-border-strong text-[10px]">•</span>
                      <span className="saved-post-date text-[10px] font-bold text-ink-muted uppercase">
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-[14px] text-ink-soft font-medium italic truncate max-w-2xl group-hover:text-ink transition-colors">
                      "{post.text}"
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => copyPost(post.text, -1)}
                    className="archive-action-btn copy-btn-archive flex items-center gap-2 px-3 py-2 bg-paper hover:bg-border rounded-xl text-ink-muted hover:text-ink border border-border shadow-sm transition-all text-[11px] font-bold"
                  >
                    <Copy size={14} /> Copy
                  </button>
                  <button 
                    className="archive-action-btn delete-btn-archive p-2.5 text-ink-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-transparent"
                    onClick={() => deletePost(post.id)}
                    title="Delete post"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function Twitter(props: any) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={props.size || 24} 
      height={props.size || 24} 
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
    </svg>
  )
}
