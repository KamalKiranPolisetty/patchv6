'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  feedback?: { rating: number }
}

interface TimelineEvent {
  event: string
  timestamp: string
  details?: string
}

interface EscalationDetails {
  reason?: string
  assignedGroup?: string
  timestamp?: string
}

interface Incident {
  incidentId: string
  category: string
  status: 'Open' | 'In Progress' | 'Escalated' | 'Resolved'
  createdAt: string
  conversation: ConversationMessage[]
  metadata: { priority: string; urgency: string; impact: string }
  timeline?: TimelineEvent[]
  escalationDetails?: EscalationDetails
  documents?: string[]
}

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  Escalated: 'bg-red-100 text-red-700',
  Resolved: 'bg-green-100 text-green-700',
}

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-slate-700 capitalize">{value || '—'}</span>
    </div>
  )
}

export default function IncidentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const meRes = await fetch('/api/auth/me')
      if (meRes.status === 401) {
        router.push('/login')
        return
      }

      const res = await fetch(`/api/incidents/${id}`)
      if (res.ok) {
        setIncident(await res.json())
      }
      setLoading(false)
    }
    init()
  }, [id])

  function formatDate(dateStr?: string) {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Loading...
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Incident not found.</p>
          <Link href="/incidents" className="text-blue-600 hover:underline text-sm">
            Back to Incidents
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="incident-detail-page" className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header
        data-testid="incident-detail-header"
        className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 shadow-sm"
      >
        <Link
          href="/incidents"
          data-testid="back-to-incidents-btn"
          className="text-slate-500 hover:text-slate-800 text-sm border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
        >
          ← Incidents
        </Link>
        <span className="text-slate-400">/</span>
        <h1
          data-testid="incident-id-heading"
          className="font-mono font-semibold text-slate-800 text-base"
        >
          {incident.incidentId}
        </h1>
        <span
          data-testid="incident-status-badge"
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[incident.status] || 'bg-slate-100 text-slate-600'}`}
        >
          {incident.status}
        </span>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        {/* Metadata row */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetaBadge label="Category" value={incident.category} />
          <MetaBadge label="Priority" value={incident.metadata?.priority} />
          <MetaBadge label="Urgency" value={incident.metadata?.urgency} />
          <MetaBadge label="Impact" value={incident.metadata?.impact} />
        </div>

        {/* Resolution notice */}
        {incident.status === 'Resolved' && (
          <div
            data-testid="resolution-notice"
            className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-5 py-4 text-sm font-medium"
          >
            This incident is resolved.
          </div>
        )}

        {/* Escalation details */}
        {incident.escalationDetails && (
          <div
            data-testid="escalation-details"
            className="bg-red-50 border border-red-200 rounded-xl px-5 py-4"
          >
            <h2 className="text-sm font-semibold text-red-700 mb-3">Escalation Details</h2>
            <div className="flex flex-col gap-1 text-sm text-red-800">
              {incident.escalationDetails.reason && (
                <p><span className="font-medium">Reason:</span> {incident.escalationDetails.reason}</p>
              )}
              {incident.escalationDetails.assignedGroup && (
                <p><span className="font-medium">Assigned Group:</span> {incident.escalationDetails.assignedGroup}</p>
              )}
              {incident.escalationDetails.timestamp && (
                <p><span className="font-medium">Time:</span> {formatDate(incident.escalationDetails.timestamp)}</p>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        {incident.timeline && incident.timeline.length > 0 && (
          <div
            data-testid="timeline-section"
            className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5"
          >
            <h2 className="font-semibold text-slate-800 mb-4">Timeline</h2>
            <ol className="relative border-l border-slate-200 flex flex-col gap-4 pl-4">
              {incident.timeline.map((event, idx) => (
                <li key={idx} className="relative">
                  <div className="absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full bg-blue-400 border-2 border-white" />
                  <p className="text-sm font-medium text-slate-700">{event.event}</p>
                  {event.details && <p className="text-xs text-slate-500 mt-0.5">{event.details}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(event.timestamp)}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Documents */}
        {incident.documents && incident.documents.length > 0 && (
          <div
            data-testid="documents-section"
            className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5"
          >
            <h2 className="font-semibold text-slate-800 mb-3">Documents Used</h2>
            <ul className="flex flex-col gap-1">
              {incident.documents.map((doc, idx) => (
                <li key={idx} className="text-sm text-slate-600 font-mono bg-slate-50 rounded px-3 py-1.5 border border-slate-100">
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Conversation */}
        <div
          data-testid="conversation-section"
          className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5"
        >
          <h2 className="font-semibold text-slate-800 mb-4">Conversation</h2>
          {incident.conversation.length === 0 ? (
            <p className="text-sm text-slate-400">No messages yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {incident.conversation.map((msg, idx) => (
                <div
                  key={idx}
                  data-testid={`conversation-message-${idx}`}
                  className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs text-slate-400 capitalize">{msg.role}</span>
                    {msg.timestamp && (
                      <span className="text-xs text-slate-400">{formatDate(msg.timestamp)}</span>
                    )}
                    {msg.feedback?.rating !== undefined && (
                      <span className="text-xs text-yellow-500">
                        {'★'.repeat(msg.feedback.rating)}{'☆'.repeat(5 - msg.feedback.rating)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
