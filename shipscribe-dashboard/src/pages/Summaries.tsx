import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import './Summaries.css'

// content might be string or object
const getContentText = (content: any): string => {
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content)
      return parsed.text || content
    } catch {
      return content
    }
  }
  return content?.text || ''
}

const getContentStats = (content: any) => {
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content)
      return parsed.stats || null
    } catch {
      return null
    }
  }
  return content?.stats || null
}

export default function Summaries() {
  const navigate = useNavigate()
  const [summaries, setSummaries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [format, setFormat] = useState('short')
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState('')

  const loadingMessages = [
    'Reading your activity...',
    'Analyzing your commits...',
    'Counting your tasks...',
    'Writing your summary...',
    'Almost done...'
  ]

  useEffect(() => {
    fetchSummaries()
  }, [])

  async function fetchSummaries() {
    setLoading(true)
    try {
      const res = await api.get('/api/summaries')
      setSummaries(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function generateSummary() {
    setGenerating(true)
    setError('')
    
    // Rotate loading messages
    let msgIndex = 0
    setLoadingMessage(loadingMessages[0])
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % loadingMessages.length
      setLoadingMessage(loadingMessages[msgIndex])
    }, 2000)

    try {
      const res = await api.post('/api/summaries/generate', {
        date,
        format
      })
      
      // The response has: res.data.summary AND res.data.text
      // Use res.data.summary for the list but make sure
      // content.text is populated
      const newSummary = {
        ...res.data.summary,
        content: {
          text: res.data.text,
          stats: res.data.stats
        }
      }

      // Add new summary to top of list
      setSummaries(prev => [newSummary, ...prev])
      
      // Show success toast
      toast.success('Summary generated!')

      // Scroll to new summary
      setTimeout(() => {
        document.querySelector('.summaries-list')
          ?.scrollIntoView({ behavior: 'smooth' })
      }, 100)

      // Optional: refetch to ensure we have exactly what DB has
      // fetchSummaries()
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Generation failed')
    } finally {
      clearInterval(msgInterval)
      setGenerating(false)
      setLoadingMessage('')
    }
  }

  async function deleteSummary(id: string) {
    if (!confirm('Delete this summary?')) return
    await api.delete(`/api/summaries/${id}`)
    setSummaries(prev => prev.filter(s => s.id !== id))
    toast.success('Deleted')
  }

  function copySummary(summary: any) {
    const text = getContentText(summary.content)
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  function formatDate(dateStr: string): string {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString().split('T')[0]
    if (dateStr === today) return 'Today'
    if (dateStr === yesterday) return 'Yesterday'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric'
    })
  }

  const formatDescriptions: Record<string, string> = {
    short: '5 bullets, quick read',
    deep: 'Full narrative, 3-4 paragraphs',
    standup: 'Yesterday / Today / Blockers',
    weekly: 'Week in review (Pro)'
  }

  return (
    <div className="summaries-page animate-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Generate section */}
      <div className="generate-card bg-white border border-border shadow-premium rounded-2xl p-6 mb-8">
        <h2 className="text-2xl font-serif text-ink tracking-tight mb-6">Generate <em>Summary</em></h2>
        
        {/* Date / Format rows container */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Date picker */}
          <div className="date-row flex-1">
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Date</label>
            <input 
              type="date" 
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-paper border border-border rounded-xl px-4 py-3 text-sm font-medium text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Format selector */}
          <div className="format-row flex-[2]">
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
              Format <span className="text-ink-muted/50 font-normal normal-case ml-2">- {formatDescriptions[format]}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {['short', 'deep', 'standup', 'weekly'].map(f => (
                <button
                  key={f}
                  className={`px-4 py-3 rounded-xl text-sm font-bold capitalize transition-all active:scale-95 ${
                    format === f 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-paper text-ink border border-border hover:bg-border/50'
                  }`}
                  onClick={() => setFormat(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate button */}
        {generating ? (
          <div className="generating-state flex items-center justify-center gap-3 w-full py-4 bg-paper-warm rounded-xl border border-border text-ink font-bold text-sm">
            <div className="spinner animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            <span className="animate-pulse">{loadingMessage}</span>
          </div>
        ) : (
          <button 
            className="generate-btn w-full py-4 bg-ink text-paper rounded-xl font-bold text-sm hover:bg-primary transition-colors shadow-premium active:scale-[0.98]"
            onClick={generateSummary}
          >
            ✨ Generate Summary
          </button>
        )}

        {error && (
          <div className="error-message mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center justify-between text-sm font-medium">
            <span>⚠️ {error}</span>
            <button onClick={generateSummary} className="px-3 py-1 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors shadow-sm">Retry</button>
          </div>
        )}
      </div>

      {/* Summaries list */}
      <h3 className="text-lg font-bold text-ink mb-4 px-1">Past Summaries</h3>
      
      {loading ? (
        <div className="loading-skeletons space-y-6">
          {[1,2,3].map(i => (
            <div key={i} className="skeleton-card h-48 bg-paper/50 rounded-2xl animate-pulse border border-border" />
          ))}
        </div>
      ) : summaries.length === 0 ? (
        <div className="empty-state py-16 text-center bg-white border border-dashed border-border rounded-3xl shadow-sm">
          <span className="empty-icon text-4xl mb-4 block">📝</span>
          <h3 className="text-lg font-bold text-ink mb-2">No summaries yet</h3>
          <p className="text-sm text-ink-muted mb-6">Generate your first summary to see what you built today.</p>
          <button 
            onClick={generateSummary}
            className="px-6 py-2.5 bg-white border border-border rounded-xl font-bold text-sm text-ink hover:bg-paper-warm transition-colors shadow-sm"
          >
            Generate my first summary
          </button>
        </div>
      ) : (
        <div className="summaries-list space-y-6">
          {summaries.map((summary: any) => (
            <div key={summary.id} className="summary-card bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-premium transition-shadow group relative overflow-hidden">
              
              <div className="summary-header flex items-center justify-between mb-4 border-b border-border/50 pb-4">
                <div className="summary-date font-bold text-ink text-lg flex items-center gap-2">
                  <span className="text-xl">📅</span> {formatDate(summary.date)}
                  {summary.date !== new Date(summary.date).toISOString().split('T')[0] && (
                     <span className="text-xs font-normal text-ink-muted bg-paper px-2 py-0.5 rounded ml-2">
                       {new Date(summary.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                     </span>
                  )}
                </div>
                <span className={`format-badge whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider format-${summary.format}`}>
                  {summary.format}
                </span>
              </div>

              <div className="summary-content prose prose-sm prose-gray max-w-none text-ink-soft mb-6 prose-p:leading-relaxed prose-li:my-1">
                <ReactMarkdown>
                  {getContentText(summary.content)}
                </ReactMarkdown>
              </div>

              {getContentStats(summary.content) && (
                <div className="summary-stats flex flex-wrap items-center gap-4 py-3 px-4 bg-paper-warm/50 rounded-xl border border-border/50 mb-6 text-xs font-bold text-ink-muted">
                  <span className="flex items-center gap-1"><span className="text-base leading-none">⏱</span> {getContentStats(summary.content).hours}h coded</span>
                  <span className="flex items-center gap-1"><span className="text-base leading-none">✅</span> {getContentStats(summary.content).tasks_completed} tasks</span>
                  <span className="flex items-center gap-1"><span className="text-base leading-none">⚡</span> {(getContentStats(summary.content).files_edited || 0) + (getContentStats(summary.content).github_events || 0)} events</span>
                  <div className="flex flex-wrap gap-1.5 ml-auto">
                    {getContentStats(summary.content).projects?.map((p: string) => (
                      <span key={p} className="project-tag px-2 py-0.5 bg-white border border-border rounded shadow-sm text-[10px] uppercase tracking-wider">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="summary-actions flex items-center gap-2 pt-2 border-t border-border/50">
                <button 
                  onClick={() => copySummary(summary)}
                  className="px-4 py-2 text-xs font-bold text-ink bg-paper hover:bg-border rounded-lg transition-colors border border-transparent shadow-sm flex items-center gap-2"
                >
                  <span className="text-sm">📋</span> Copy
                </button>
                <button 
                  onClick={() => {
                    const data = {
                      summaryId: summary.id,
                      summaryText: getContentText(summary.content),
                      summaryDate: summary.date,
                      summaryFormat: summary.format,
                      stats: getContentStats(summary.content)
                    }
                    
                    console.log('Storing summary context:', data)
                    sessionStorage.setItem('generatePostFrom', JSON.stringify(data))
                    console.log('Stored. Navigating to posts...')
                    
                    // The correct dashboard route is /dashboard/posts
                    const postsPath = '/dashboard/posts'
                    console.log('Navigating to:', postsPath)
                    navigate(postsPath)
                  }}
                  className="px-4 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors border border-transparent shadow-sm flex items-center gap-2"
                >
                  <span className="text-sm">🐦</span> Generate Post
                </button>
                <button 
                  className="delete-btn ml-auto w-8 h-8 flex items-center justify-center text-ink-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  onClick={() => deleteSummary(summary.id)}
                  title="Delete summary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
              </div>

              {/* Model Footer */}
              <div className="summary-model text-right text-[10px] text-ink-muted italic mt-3 pr-2">
                Generated by {summary.model || 'claude-sonnet-4-20250514'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
