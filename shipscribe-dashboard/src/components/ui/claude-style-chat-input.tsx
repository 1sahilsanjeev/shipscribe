import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Lightbulb } from 'lucide-react'

interface SendData {
  message: string
  model: string
  isThinkingEnabled: boolean
}

interface ClaudeChatInputProps {
  onSendMessage: (data: SendData) => void
  disabled?: boolean
}

const MODELS = [
  { id: 'claude-sonnet-4-5', label: 'Sonnet 4.5' },
  { id: 'claude-opus-4', label: 'Opus 4' },
  { id: 'claude-haiku-3-5', label: 'Haiku 3.5' },
]

export default function ClaudeChatInput({
  onSendMessage,
  disabled = false,
}: ClaudeChatInputProps) {
  const [message, setMessage] = useState('')
  const [model, setModel] = useState(MODELS[0].id)
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [message])

  function handleSend() {
    if (!message.trim() || disabled) return
    onSendMessage({ message: message.trim(), model, isThinkingEnabled })
    setMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = message.trim().length > 0 && !disabled

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className="relative rounded-2xl border border-[#DDDDDD] bg-white shadow-sm transition-shadow duration-200 focus-within:shadow-md focus-within:border-[#BBBBBB]"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Message Shipscribe…"
          rows={1}
          className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[14px] text-[#1F1E1D] placeholder-[#AAAAAA] outline-none leading-relaxed"
          style={{ maxHeight: '200px', minHeight: '52px' }}
        />

        {/* Toolbar row */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
          {/* Left: model selector + thinking toggle */}
          <div className="flex items-center gap-2">
            {/* Model selector */}
            <select
              aria-label="Select AI model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="text-[12px] text-[#73726C] bg-[#F5F4F0] border border-[#E8E7E3] rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-[#EEECEA] transition-colors"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Thinking toggle */}
            <button
              type="button"
              onClick={() => setIsThinkingEnabled((v) => !v)}
              title="Extended thinking"
              className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg border transition-all duration-150 ${
                isThinkingEnabled
                  ? 'bg-[#1A3FE0]/10 border-[#1A3FE0]/30 text-[#1A3FE0] font-medium'
                  : 'bg-[#F5F4F0] border-[#E8E7E3] text-[#73726C] hover:bg-[#EEECEA]'
              }`}
            >
              <Lightbulb size={13} />
              Think
            </button>
          </div>

          {/* Right: send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            title="Send message"
            className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150 ${
              canSend
                ? 'bg-[#1A3FE0] text-white hover:bg-[#1535C8] shadow-sm'
                : 'bg-[#EEEEEE] text-[#BBBBBB] cursor-not-allowed'
            }`}
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-[#AAAAAA] mt-2">
        Shipscribe AI knows your real-time dev context · Shift+Enter for newline
      </p>
    </div>
  )
}
