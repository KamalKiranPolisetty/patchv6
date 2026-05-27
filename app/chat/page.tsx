'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

function StarRating({ onRate }: { onRate: (rating: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(0)

  function rate(n: number) {
    setSelected(n)
    onRate(n)
  }

  return (
    <div className="flex gap-1" data-testid="star-rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => rate(n)}
          className={`text-2xl transition-colors ${n <= (hovered || selected) ? 'text-yellow-400' : 'text-slate-300'}`}
          data-testid={`star-${n}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function FeedbackWidget({ incidentId, onDone }: { incidentId: string; onDone: () => void }) {
  const [submitted, setSubmitted] = useState(false)

  async function handleRate(rating: number) {
    await fetch(`/api/incident/${incidentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbackRating: rating }),
    })
    setSubmitted(true)
    onDone()
  }

  if (submitted) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center" data-testid="feedback-submitted">
        <p className="text-blue-700 font-medium">Thank you for your feedback!</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4" data-testid="feedback-widget">
      <p className="text-slate-700 font-medium mb-3" data-testid="feedback-prompt">
        How was this response? Your feedback helps us improve the AI Agent.
      </p>
      <StarRating onRate={handleRate} />
    </div>
  )
}

function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category')

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [incidentId, setIncidentId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('Open')
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackDone, setFeedbackDone] = useState(false)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch('/api/session')
      const data = await res.json()
      if (!data.user) {
        router.replace('/login')
      } else {
        setUser(data.user)
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return

    const userMsg = input.trim()
    setInput('')
    setSending(true)
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, incidentId, category }),
    })

    const data = await res.json()
    setSending(false)

    if (!res.ok) {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.error || 'Something went wrong.' }])
      return
    }

    if (!incidentId) setIncidentId(data.incidentId)
    setStatus(data.status)
    setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])

    if (data.isResolved || data.isEscalated) {
      setShowFeedback(true)
    }
  }

  const isResolved = status === 'Resolved'
  const isEscalated = status === 'Escalated'
  const isDisabled = isResolved || sending

  return (
    <div className="flex flex-col h-screen bg-slate-50" data-testid="chat-page">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3" data-testid="chat-header">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-slate-600" data-testid="back-to-home-link">←</Link>
            <div>
              <h1 className="font-semibold text-slate-900" data-testid="chat-title">
                Patch{category ? ` — ${category}` : ''}
              </h1>
              {user && <p className="text-xs text-slate-500" data-testid="chat-user">{user.email}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {incidentId && (
              <Link
                href={`/incident/${incidentId}`}
                className="text-xs text-blue-600 hover:underline"
                data-testid="view-incident-link"
              >
                View Incident
              </Link>
            )}
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                isResolved ? 'bg-green-100 text-green-700' :
                isEscalated ? 'bg-orange-100 text-orange-700' :
                status === 'Open' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}
              data-testid="incident-status-badge"
            >
              {status}
            </span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6" data-testid="chat-messages">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 py-12" data-testid="chat-empty">
              <div className="text-4xl mb-3">💬</div>
              <p>Describe your issue and Patch will help you resolve it.</p>
              {category && <p className="text-sm mt-1">Category: <strong>{category}</strong></p>}
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              data-testid={`message-${msg.role}-${i}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                }`}
                data-testid={`message-bubble-${i}`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start" data-testid="typing-indicator">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 text-slate-400 text-sm">
                Patch is thinking...
              </div>
            </div>
          )}

          {isResolved && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center" data-testid="resolved-banner">
              <p className="text-green-700 font-medium" data-testid="resolved-message">This incident is resolved</p>
            </div>
          )}

          {isEscalated && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4" data-testid="escalated-banner">
              <p className="text-orange-700 font-medium" data-testid="escalated-message">
                This incident has been escalated to our support team.
              </p>
            </div>
          )}

          {showFeedback && !feedbackDone && incidentId && (
            <FeedbackWidget incidentId={incidentId} onDone={() => setFeedbackDone(true)} />
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-4" data-testid="chat-input-area">
        <div className="max-w-3xl mx-auto">
          {isResolved ? (
            <p className="text-center text-slate-400 text-sm py-2" data-testid="resolved-input-message">
              This incident is resolved — chat is now read-only.
            </p>
          ) : (
            <form onSubmit={sendMessage} className="flex gap-3" data-testid="chat-form">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isDisabled}
                placeholder={isDisabled ? 'Chat disabled' : 'Describe your issue...'}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                data-testid="chat-input"
              />
              <button
                type="submit"
                disabled={isDisabled || !input.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                data-testid="chat-send-btn"
              >
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div data-testid="chat-loading" className="flex items-center justify-center h-screen text-slate-400">Loading...</div>}>
      <ChatContent />
    </Suspense>
  )
}
