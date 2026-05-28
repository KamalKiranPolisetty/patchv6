'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChatContext } from '@/context/ChatContext'
import ChatMessage from '@/components/chat/ChatMessage'

interface User {
  userId: string
  username: string
  email: string
}

interface IncidentData {
  incidentId: string
  createdAt: string
  category: string
  status: 'Open' | 'Escalated' | 'Resolved'
  priority: number
  urgency: number
  impact: number
  escalationReason?: string
  assignedGroup?: string
  feedbackRating?: number
  feedbackComments?: string
}

export default function HomePage() {
  const router = useRouter()
  const {
    chatState,
    setChatState,
    messages,
    addMessage,
    incidentId,
    setIncidentId,
    category,
    setCategory,
    incidentStatus,
    setIncidentStatus,
    restoreSession,
  } = useChatContext()

  const [user, setUser] = useState<User | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [kbAvailable, setKbAvailable] = useState(false)
  const [incidentData, setIncidentData] = useState<IncidentData | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace('/login')
        } else {
          setUser(data.user)
          setAuthChecked(true)
          // Check for resume session from incidents page
          const restoreRaw = sessionStorage.getItem('patch_restore_incident')
          if (restoreRaw) {
            sessionStorage.removeItem('patch_restore_incident')
            try {
              const restore = JSON.parse(restoreRaw)
              restoreSession({
                messages: restore.messages,
                incidentId: restore.incidentId,
                category: restore.category,
                status: restore.status,
              })
              // fetch full incident data
              fetch(`/api/incidents/${restore.incidentId}`)
                .then((r) => r.json())
                .then((d) => { if (d.incident) setIncidentData(d.incident) })
                .catch(() => {})
            } catch {
              // ignore
            }
          }
        }
      })
      .catch(() => router.replace('/login'))
  }, [router, restoreSession])

  useEffect(() => {
    fetch('/api/kb-status')
      .then((r) => r.json())
      .then((d) => setKbAvailable(d.available))
      .catch(() => setKbAvailable(false))
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const createIncident = useCallback(async (cat: string) => {
    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: cat, subCategory: cat, priority: 5, urgency: 3, impact: 3 }),
    })
    const data = await res.json()
    if (data.incident) {
      setIncidentId(data.incident.incidentId)
      setIncidentData(data.incident)
      setIncidentStatus('Open')
      return data.incident
    }
    return null
  }, [setIncidentId, setIncidentStatus])

  const sendMessage = useCallback(async (text: string, cat?: string) => {
    if (!text.trim()) return
    setLoading(true)

    const activeCategory = cat || category || ''
    let activeIncidentId = incidentId

    if (!activeIncidentId) {
      const incident = await createIncident(activeCategory)
      if (!incident) {
        setLoading(false)
        return
      }
      activeIncidentId = incident.incidentId
    }

    addMessage({ role: 'user', content: text, timestamp: new Date() })
    setChatState('active')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId: activeIncidentId, message: text, category: activeCategory }),
      })
      const data = await res.json()
      if (data.message) {
        addMessage({ role: 'assistant', content: data.message, timestamp: new Date() })
        if (data.status && data.status !== incidentStatus) {
          setIncidentStatus(data.status)
        }
        // refresh incident data
        fetch(`/api/incidents/${activeIncidentId}`)
          .then((r) => r.json())
          .then((d) => { if (d.incident) setIncidentData(d.incident) })
          .catch(() => {})
      } else {
        addMessage({ role: 'assistant', content: 'Patch is having trouble thinking. Please try again.', timestamp: new Date() })
      }
    } catch {
      addMessage({ role: 'assistant', content: 'Patch is having trouble thinking. Please try again.', timestamp: new Date() })
    } finally {
      setLoading(false)
    }
  }, [category, incidentId, incidentStatus, createIncident, addMessage, setChatState, setIncidentStatus])

  function handleTileClick() {
    setCategory('VDI')
    sendMessage('I have a problem with my VDI', 'VDI')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const msg = input.trim()
    setInput('')
    sendMessage(msg)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!input.trim() || loading) return
      const msg = input.trim()
      setInput('')
      sendMessage(msg)
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    )
  }

  const isFinal = incidentStatus === 'Resolved' || incidentStatus === 'Escalated'

  return (
    <div className="flex flex-col h-screen bg-gray-50" data-testid="main-page">
      <div className="h-14" /> {/* header spacer */}

      {chatState === 'active' && (
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3" data-testid="chat-header">
          <div className="flex-1">
            {incidentId && (
              <span className="text-xs text-gray-500 font-medium mr-2" data-testid="chat-incident-id">
                #{incidentId}
              </span>
            )}
            {category && (
              <span className="text-xs text-gray-500 mr-2" data-testid="chat-category">
                {category}
              </span>
            )}
            {incidentStatus && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  incidentStatus === 'Open'
                    ? 'bg-yellow-100 text-yellow-800'
                    : incidentStatus === 'Escalated'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}
                data-testid="chat-status-badge"
              >
                {incidentStatus}
              </span>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto" data-testid="chat-area">
        {chatState === 'landing' ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center" data-testid="landing-state">
            <div className="mb-8">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6" data-testid="patch-mark">
                <span className="text-white font-bold text-2xl">P</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3 max-w-lg" data-testid="welcome-heading">
                Welcome to the Discount Tire Information Center, {user?.username}.
              </h1>
              <p className="text-lg text-gray-600" data-testid="welcome-subheading">
                My name is Patch. Let&apos;s get you taken care of.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center" data-testid="category-tiles">
              <button
                onClick={handleTileClick}
                className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-gray-200 hover:border-red-400 rounded-2xl shadow-sm hover:shadow-md transition-all w-44 cursor-pointer"
                data-testid="vdi-tile"
              >
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">VDI</span>
                </div>
                <span className="font-semibold text-gray-800">VDI</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    kbAvailable
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                  data-testid="kb-status-indicator"
                >
                  {kbAvailable ? 'KB Available' : 'KB Missing'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6" data-testid="messages-container">
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                role={msg.role}
                content={msg.content}
                onUIAction={(action) => sendMessage(action)}
                incidentId={incidentId || undefined}
                incidentStatus={incidentStatus}
                category={category || undefined}
                createdAt={incidentData?.createdAt}
                createdFor={user?.username}
                priority={incidentData?.priority}
                urgency={incidentData?.urgency}
                impact={incidentData?.impact}
                escalationReason={incidentData?.escalationReason}
                assignedGroup={incidentData?.assignedGroup}
                existingFeedbackRating={incidentData?.feedbackRating}
                existingFeedbackComments={incidentData?.feedbackComments}
              />
            ))}
            {loading && (
              <div className="flex gap-3 mb-4" data-testid="loading-indicator">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">P</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <div className="border-t border-gray-200 bg-white px-4 py-3" data-testid="chat-input-area">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isFinal ? 'This conversation has ended.' : 'Message Patch…'}
            disabled={isFinal || loading}
            rows={1}
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            data-testid="chat-input"
            style={{ maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || isFinal}
            className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl transition-colors text-sm font-semibold"
            data-testid="chat-send-btn"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
