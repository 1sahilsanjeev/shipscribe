import { useState, useEffect, useRef } from 'react'
import ClaudeChatInput from '../components/ui/claude-style-chat-input'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import ReactMarkdown from 'react-markdown'
import { 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw, 
  Pencil, 
  ChevronDown,
  Share2
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function Chat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [activeVoice, setActiveVoice] = useState<any>(null)
  const [primaryProject, setPrimaryProject] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentHour = new Date().getHours()
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 18
      ? 'Good afternoon'
      : 'Good evening'

  const firstName = (user?.email?.split('@')[0] || 'there')

  useEffect(() => {
    // Fetch active context
    api.get('/api/voice/active').then(res => setActiveVoice(res.data)).catch(() => {})
    api.get('/api/projects/primary').then(res => setPrimaryProject(res.data)).catch(() => {})
    api.get('/api/projects').then(res => setProjects(res.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSendMessage(data: {
    message: string
    model: string
    isThinkingEnabled: boolean
  }) {
    if (!data.message.trim()) return

    const userMessage: Message = {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      content: data.message,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      const res = await api.post('/api/chat', {
        message: data.message,
        history: messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        projectId: selectedProjectId
      })

      const assistantMessage: Message = {
        id: Math.random().toString(36).slice(2),
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const suggestedPrompts = [
    'What did I build today?',
    'Write my standup for tomorrow',
    'What should I work on next?',
    'Generate a tweet about today\'s work',
    'How productive was I this week?',
    'What tasks are still pending?',
  ]

  return (
    <div className="flex flex-col h-full bg-[#FAF9F5] relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-between z-10 bg-[#FAF9F5]/80 backdrop-blur-sm border-b border-border/10">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-[15px] font-medium text-ink-soft hover:bg-ink/5 px-2 py-1 rounded-lg transition-colors group">
            Good
            <ChevronDown size={14} className="text-ink-muted group-hover:text-ink-soft" />
          </button>
          
          <div className="h-4 w-[1px] bg-border/20" />
          
          <select
            className="bg-transparent border-none text-[13px] font-bold text-ink-soft focus:ring-0 cursor-pointer hover:text-primary transition-colors"
            value={selectedProjectId}
            title="Select project focus"
            onChange={e => setSelectedProjectId(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
        </div>

        <button title="Share chat" className="p-2 text-ink-muted hover:text-ink-soft transition-colors">
          <Share2 size={18} />
        </button>
      </div>

      {/* Messages area */}
      <div className={`flex-1 px-4 pt-16 flex flex-col ${messages.length === 0 ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col pb-[140px]">
          {messages.length === 0 ? (
            /* Empty state — greeting */
            <div className="flex flex-col items-center justify-center flex-1 text-center py-4">
              <div className="w-16 h-16 bg-[#1A3FE0] rounded-2xl flex items-center justify-center mb-6 text-white text-2xl font-bold shadow-lg">
                S
              </div>
              <h1 className="text-3xl font-serif font-light text-[#1F1E1D] mb-2">
                {greeting},{' '}
                <span className="relative inline-block">
                  {firstName}
                  <svg
                    className="absolute w-full h-[6px] -bottom-1 left-0 text-[#1A3FE0]"
                    viewBox="0 0 100 6"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 5 Q50 0 100 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
              <p className="text-[#73726C] text-lg mb-4">
                Ask me anything about your work
              </p>

              {/* Active Context Pills */}
              <div className="flex items-center gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                {activeVoice && (
                  <span className="px-3 py-1.5 bg-white border border-border rounded-full text-[11px] font-bold text-ink-soft shadow-sm flex items-center gap-1.5">
                    🎙️ {activeVoice.name}
                  </span>
                )}
                {primaryProject && (
                  <span className="px-3 py-1.5 bg-white border border-border rounded-full text-[11px] font-bold text-ink-soft shadow-sm flex items-center gap-1.5">
                    {primaryProject.emoji} {primaryProject.name}
                  </span>
                )}
                {(!activeVoice || !primaryProject) && (
                  <a href="/dashboard/voice" className="text-[11px] font-bold text-primary hover:underline bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
                    Set up voice & project for better responses →
                  </a>
                )}
              </div>

              {/* Suggested prompts */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      handleSendMessage({
                        message: prompt,
                        model: 'claude-sonnet-4-5',
                        isThinkingEnabled: false,
                      })
                    }
                    className="text-left px-4 py-3 bg-white border border-[#DDDDDD] rounded-xl text-sm text-[#3D3D3A] hover:border-[#1A3FE0] hover:text-[#1A3FE0] transition-all duration-150 shadow-sm hover:shadow-md font-sans"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-10">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col group ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`relative ${
                      message.role === 'user'
                        ? 'bg-[#F0EEE6] text-[#1F1E1D] rounded-2xl px-4 py-2.5 shadow-sm max-w-[85%]'
                        : 'w-full text-[#1F1E1D]'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="font-serif text-[18px] leading-relaxed prose prose-stone prose-serif max-w-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1 prose-code:rounded">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="text-[15px] font-sans leading-normal truncate block max-w-full">
                        {message.content}
                      </span>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className={`mt-2 flex items-center gap-3 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row pl-1'
                  }`}>
                    <span className="text-[10px] font-sans tracking-wide">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {message.role === 'assistant' ? (
                        <>
                          <button title="Copy" className="p-1 hover:text-ink-soft transition-colors"><Copy size={13} /></button>
                          <button title="Helpful" className="p-1 hover:text-success transition-colors"><ThumbsUp size={13} /></button>
                          <button title="Not helpful" className="p-1 hover:text-red-500 transition-colors"><ThumbsDown size={13} /></button>
                          <button title="Retry" className="p-1 hover:text-primary transition-colors"><RotateCcw size={13} /></button>
                        </>
                      ) : (
                        <>
                          <button title="Retry" className="p-1 hover:text-primary transition-colors"><RotateCcw size={13} /></button>
                          <button title="Edit" className="p-1 hover:text-ink-soft transition-colors"><Pencil size={13} /></button>
                          <button title="Copy" className="p-1 hover:text-ink-soft transition-colors"><Copy size={13} /></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex flex-col items-start">
                  <div className="flex gap-1 items-center h-5 py-4 pl-1">
                    <div className="w-1.5 h-1.5 bg-ink/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-ink/20 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-ink/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Floating Input area */}
      <div 
        className="fixed bottom-0 right-0 z-20 pointer-events-none transition-all duration-300"
        style={{ left: 'var(--sidebar-width)' }}
      >
        {/* Solid mask at the bottom to hide messages completely */}
        <div className="absolute inset-0 bg-[#FAF9F5] translate-y-24" />
        <div className="relative">
          {/* Transition gradient above the solid block */}
          <div className="h-24 bg-gradient-to-t from-[#FAF9F5] to-transparent" />
          
          <div className="bg-[#FAF9F5] px-4 pb-2 pointer-events-auto">
            <ClaudeChatInput onSendMessage={handleSendMessage} disabled={loading} />
          </div>
        </div>
      </div>
    </div>
  )
}
