'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  conversationIndex?: number
  feedback?: { rating: number }
}

function MainPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [user, setUser] = useState<{ userId: string; email: string } | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<'VDI' | 'Printer' | null>(null)
  const [chatState, setChatState] = useState<'landing' | 'active'>('landing')
  const [messages, setMessages] = useState<Message[]>([])
  const [currentIncidentId, setCurrentIncidentId] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadCategory, setUploadCategory] = useState('VDI')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [incidentStatus, setIncidentStatus] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)

  async function loadIncident(id: string) {
    try {
      const res = await fetch(`/api/incidents/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setChatState('active')
      setMessages(
        (data.conversation || []).map((m: Message) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))
      )
      setCurrentIncidentId(id)
      setSelectedCategory(data.category)
      setIncidentStatus(data.status)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    async function init() {
      const meRes = await fetch('/api/auth/me')
      if (meRes.status === 401) {
        router.push('/login')
        return
      }
      const meData = await meRes.json()
      setUser(meData)

      const docsRes = await fetch('/api/documents')
      if (docsRes.ok) {
        const docsData = await docsRes.json()
        setAvailableCategories(docsData.categories || [])
      }

      const incidentParam = searchParams.get('incident')
      if (incidentParam) {
        await loadIncident(incidentParam)
      }
    }
    init()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!inputMessage.trim() || loading) return

    const userMsg: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    const msgText = inputMessage.trim()
    setInputMessage('')
    setLoading(true)

    try {
      let incidentId = currentIncidentId

      if (chatState === 'landing') {
        const incRes = await fetch('/api/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: selectedCategory, firstMessage: msgText }),
        })
        const incData = await incRes.json()
        incidentId = incData.incidentId || incData.id
        setCurrentIncidentId(incidentId)
        setChatState('active')
      }

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId, message: msgText, category: selectedCategory }),
      })
      const chatData = await chatRes.json()

      const assistantMsg: Message = {
        role: 'assistant',
        content: chatData.message || chatData.response || '',
        timestamp: new Date(),
        conversationIndex: chatData.conversationIndex,
      }
      setMessages((prev) => [...prev, assistantMsg])

      if (chatData.incident?.status) {
        setIncidentStatus(chatData.incident.status)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleNewChat() {
    setChatState('landing')
    setMessages([])
    setCurrentIncidentId(null)
    setSelectedCategory(null)
    setIncidentStatus(null)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadFile) return
    setUploadLoading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('category', uploadCategory)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        setUploadError(data.error || 'Upload failed')
      } else {
        setUploadSuccess('Document uploaded successfully!')
        setUploadFile(null)
        const docsRes = await fetch('/api/documents')
        if (docsRes.ok) {
          const docsData = await docsRes.json()
          setAvailableCategories(docsData.categories || [])
        }
      }
    } catch {
      setUploadError('Network error during upload.')
    } finally {
      setUploadLoading(false)
    }
  }

  async function handleFeedback(messageIndex: number, rating: number) {
    if (!currentIncidentId) return
    const msg = messages[messageIndex]
    const conversationIndex = msg.conversationIndex ?? messageIndex

    try {
      await fetch(`/api/incidents/${currentIncidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationIndex, feedback: { rating } }),
      })
      setMessages((prev) =>
        prev.map((m, i) => (i === messageIndex ? { ...m, feedback: { rating } } : m))
      )
    } catch {
      // ignore
    }
  }

  function toggleCategory(cat: 'VDI' | 'Printer') {
    setSelectedCategory((prev) => (prev === cat ? null : cat))
  }

  const isResolved = incidentStatus === 'Resolved'

  return (
    <div data-testid="main-page" className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header
        data-testid="header"
        className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm"
      >
        <span className="text-xl font-bold text-blue-600">Patch</span>
        <div className="flex items-center gap-3">
          <span data-testid="user-email" className="text-sm text-slate-600">
            {user?.email}
          </span>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-800 border border-slate-300 rounded-lg px-3 py-1 hover:bg-slate-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {chatState === 'landing' ? (
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-8 gap-6">
            {/* Welcome */}
            <div className="flex items-center justify-between">
              <h1 data-testid="welcome-heading" className="text-2xl font-semibold text-slate-800">
                Welcome back, {user?.email?.split('@')[0]}
              </h1>
              <div className="flex gap-2">
                <Link
                  href="/incidents"
                  data-testid="view-incidents-btn"
                  className="text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  View Incidents
                </Link>
                <button
                  data-testid="new-chat-btn"
                  onClick={handleNewChat}
                  className="text-sm bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition-colors"
                >
                  New Chat
                </button>
              </div>
            </div>

            {/* Category grid */}
            <div data-testid="category-grid" className="grid grid-cols-2 gap-4">
              {(['VDI', 'Printer'] as const).map((cat) => {
                const hasDoc = availableCategories.includes(cat)
                const isSelected = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    data-testid={`category-card-${cat.toLowerCase()}`}
                    onClick={() => toggleCategory(cat)}
                    className={`text-left p-5 bg-white rounded-xl border-2 shadow-sm hover:shadow-md transition-all ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="font-semibold text-slate-800 text-lg">{cat}</div>
                    <div className="text-slate-500 text-sm mt-0.5">
                      {cat === 'VDI' ? 'Virtual Desktop Infrastructure' : 'Printer Management'}
                    </div>
                    <div className="mt-3">
                      <span
                        data-testid={`doc-status-${cat.toLowerCase()}`}
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          hasDoc
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {hasDoc ? 'Doc Available' : 'Upload Needed'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Upload section */}
            <div
              data-testid="upload-section"
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
            >
              <h2 className="font-semibold text-slate-800 mb-4">Upload Documentation</h2>
              <form onSubmit={handleUpload} className="flex flex-col gap-3">
                <div className="flex gap-3 flex-wrap items-center">
                  <select
                    data-testid="upload-category-select"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="VDI">VDI</option>
                    <option value="Printer">Printer</option>
                  </select>
                  <input
                    type="file"
                    accept=".docx"
                    data-testid="upload-file-input"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  />
                  <button
                    type="submit"
                    data-testid="upload-submit-btn"
                    disabled={!uploadFile || uploadLoading}
                    className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploadLoading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
                {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}
                {uploadSuccess && <p className="text-green-600 text-sm">{uploadSuccess}</p>}
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pt-4 pb-2">
            {/* Status banners */}
            {incidentStatus === 'Escalated' && (
              <div
                data-testid="escalation-banner"
                className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-medium"
              >
                This incident has been escalated to Trusted Experts.
              </div>
            )}
            {incidentStatus === 'Resolved' && (
              <div
                data-testid="resolution-banner"
                className="mb-3 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm font-medium"
              >
                This incident is resolved.
              </div>
            )}

            {/* New chat button row */}
            <div className="flex justify-end mb-2">
              <button
                data-testid="new-chat-btn"
                onClick={handleNewChat}
                className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                New Chat
              </button>
            </div>

            {/* Chat thread */}
            <div
              data-testid="chat-thread"
              className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4"
              style={{ minHeight: 0, maxHeight: 'calc(100vh - 220px)' }}
            >
              {messages.map((msg, idx) => (
                <div key={idx} data-testid={`message-${idx}`}>
                  <div
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                  {msg.role === 'assistant' && (
                    <div
                      data-testid={`feedback-stars-${idx}`}
                      className="flex items-center gap-1 mt-1 ml-1"
                    >
                      <span className="text-xs text-slate-400 mr-1">
                        How was this response? Your feedback helps us improve the AI Agent.
                      </span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          data-testid={`star-${idx}-${star}`}
                          onClick={() => handleFeedback(idx, star)}
                          className={`text-lg leading-none transition-colors ${
                            msg.feedback && msg.feedback.rating >= star
                              ? 'text-yellow-400'
                              : 'text-slate-300 hover:text-yellow-300'
                          }`}
                          aria-label={`Rate ${star} star`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-500 shadow-sm border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm">
                    <span className="animate-pulse">Patch is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}
      </main>

      {/* Chat input - always visible */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 shadow-lg">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            data-testid="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isResolved}
            placeholder={
              isResolved
                ? 'This incident is resolved.'
                : selectedCategory
                ? `Ask about ${selectedCategory}...`
                : 'Describe your issue...'
            }
            className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            data-testid="chat-submit-btn"
            disabled={!inputMessage.trim() || loading || isResolved}
            className="bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default function MainPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>}>
      <MainPageInner />
    </Suspense>
  )
}
