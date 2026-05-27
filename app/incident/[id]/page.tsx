'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface ConversationMessage {
  role: string
  content: string
  timestamp?: string
}

interface TimelineEvent {
  event: string
  timestamp: string
  by: string
}

interface Incident {
  incidentId: string
  status: string
  category: string | null
  conversation: ConversationMessage[]
  timeline: TimelineEvent[]
  metadata: {
    type?: string
    subCategory?: string
    priority?: number
    urgency?: number
    impact?: number
  }
  escalationDetails?: {
    reason: string
    group: string
    timestamp: string
  }
  lastupdatedby?: string
  feedbackRating?: number
  feedbackTimestamp?: string
  createdAt?: string
  updatedAt?: string
}

const CATEGORY_MAP: Record<string, { type: string; subCategory: string; priority: number; urgency: number; impact: number }> = {
  VDI: { type: 'Software', subCategory: 'VDI', priority: 5, urgency: 3, impact: 3 },
  Printer: { type: 'Software', subCategory: 'Printer', priority: 5, urgency: 3, impact: 3 },
  Scanner: { type: 'Hardware', subCategory: 'Scanner', priority: 5, urgency: 3, impact: 3 },
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Open: 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-yellow-100 text-yellow-700',
    Escalated: 'bg-orange-100 text-orange-700',
    Resolved: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-slate-100 text-slate-600'}`} data-testid="incident-status">
      {status}
    </span>
  )
}

export default function IncidentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const sessionRes = await fetch('/api/session')
      const sessionData = await sessionRes.json()
      if (!sessionData.user) { router.replace('/login'); return }

      const res = await fetch(`/api/incident/${id}`)
      if (res.ok) {
        setIncident(await res.json())
      }
      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="incident-loading">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="incident-not-found">
        <p className="text-slate-500">Incident not found.</p>
      </div>
    )
  }

  const catInfo = incident.category ? CATEGORY_MAP[incident.category] : null

  return (
    <div className="min-h-screen bg-slate-50" data-testid="incident-page">
      <header className="bg-white border-b border-slate-200 px-6 py-4" data-testid="incident-header">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-600" data-testid="back-home-link">←</Link>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-slate-900" data-testid="incident-id-heading">
                Incident: {incident.incidentId}
              </h1>
              {incident.createdAt && (
                <p className="text-xs text-slate-500" data-testid="incident-created-at">
                  Created: {new Date(incident.createdAt).toLocaleString()}
                </p>
              )}
            </div>
            <StatusBadge status={incident.status} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Details Table */}
        <section data-testid="incident-details-section">
          <h2 className="text-lg font-semibold text-slate-900 mb-4" data-testid="details-heading">Incident Details</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm" data-testid="details-table">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-500 w-40" data-testid="detail-label-category">Category</td>
                  <td className="px-4 py-3 text-slate-900" data-testid="detail-value-category">{incident.category || 'N/A'}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-500" data-testid="detail-label-type">Type</td>
                  <td className="px-4 py-3 text-slate-900" data-testid="detail-value-type">{catInfo?.type || 'N/A'}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-500" data-testid="detail-label-subcategory">Sub-category</td>
                  <td className="px-4 py-3 text-slate-900" data-testid="detail-value-subcategory">{catInfo?.subCategory || 'N/A'}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-500" data-testid="detail-label-priority">Priority</td>
                  <td className="px-4 py-3 text-slate-900" data-testid="detail-value-priority">{catInfo?.priority ?? 'N/A'}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-500" data-testid="detail-label-urgency">Urgency</td>
                  <td className="px-4 py-3 text-slate-900" data-testid="detail-value-urgency">{catInfo?.urgency ?? 'N/A'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-500" data-testid="detail-label-impact">Impact</td>
                  <td className="px-4 py-3 text-slate-900" data-testid="detail-value-impact">{catInfo?.impact ?? 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Escalation Details */}
        {incident.escalationDetails && (
          <section data-testid="escalation-section">
            <h2 className="text-lg font-semibold text-slate-900 mb-4" data-testid="escalation-heading">Escalation Details</h2>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-2" data-testid="escalation-details">
              <div className="flex gap-2">
                <span className="font-medium text-orange-700 w-32">Reason:</span>
                <span className="text-orange-900" data-testid="escalation-reason">{incident.escalationDetails.reason}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-orange-700 w-32">Group:</span>
                <span className="text-orange-900" data-testid="escalation-group">{incident.escalationDetails.group}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-orange-700 w-32">Timestamp:</span>
                <span className="text-orange-900" data-testid="escalation-timestamp">
                  {new Date(incident.escalationDetails.timestamp).toLocaleString()}
                </span>
              </div>
              {incident.lastupdatedby && (
                <div className="flex gap-2">
                  <span className="font-medium text-orange-700 w-32">Updated by:</span>
                  <span className="text-orange-900" data-testid="escalation-updatedby">{incident.lastupdatedby}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Resolution Details */}
        {incident.status === 'Resolved' && (
          <section data-testid="resolution-section">
            <h2 className="text-lg font-semibold text-slate-900 mb-4" data-testid="resolution-heading">Resolution</h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5" data-testid="resolution-details">
              <div className="flex gap-2">
                <span className="font-medium text-green-700 w-32">Resolved by:</span>
                <span className="text-green-900" data-testid="resolution-by">{incident.lastupdatedby || 'Patch'}</span>
              </div>
              {incident.updatedAt && (
                <div className="flex gap-2 mt-2">
                  <span className="font-medium text-green-700 w-32">Resolved at:</span>
                  <span className="text-green-900" data-testid="resolution-timestamp">
                    {new Date(incident.updatedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Conversation */}
        <section data-testid="conversation-section">
          <h2 className="text-lg font-semibold text-slate-900 mb-4" data-testid="conversation-heading">Conversation History</h2>
          <div className="space-y-3" data-testid="conversation-list">
            {incident.conversation.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`conversation-msg-${i}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                  }`}
                  data-testid={`conversation-bubble-${i}`}
                >
                  <p className="text-xs opacity-70 mb-1" data-testid={`conversation-role-${i}`}>
                    {msg.role === 'user' ? 'User' : 'Patch'}
                    {msg.timestamp && ` · ${new Date(msg.timestamp).toLocaleTimeString()}`}
                  </p>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section data-testid="timeline-section">
          <h2 className="text-lg font-semibold text-slate-900 mb-4" data-testid="timeline-heading">Timeline</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-5" data-testid="timeline-list">
            {incident.timeline.map((event, i) => (
              <div key={i} className="flex gap-4 items-start" data-testid={`timeline-event-${i}`}>
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 shrink-0" />
                  {i < incident.timeline.length - 1 && <div className="w-0.5 h-8 bg-slate-200 my-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-slate-800" data-testid={`timeline-event-text-${i}`}>{event.event}</p>
                  <p className="text-xs text-slate-400 mt-0.5" data-testid={`timeline-event-time-${i}`}>
                    {new Date(event.timestamp).toLocaleString()} · {event.by}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feedback */}
        {incident.feedbackRating && (
          <section data-testid="feedback-section">
            <h2 className="text-lg font-semibold text-slate-900 mb-4" data-testid="feedback-heading">User Feedback</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-5" data-testid="feedback-details">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium" data-testid="feedback-rating-label">Rating:</span>
                <div className="flex gap-0.5" data-testid="feedback-stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`text-xl ${n <= incident.feedbackRating! ? 'text-yellow-400' : 'text-slate-200'}`}
                      data-testid={`feedback-star-${n}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-slate-500 text-sm" data-testid="feedback-rating-value">({incident.feedbackRating}/5)</span>
              </div>
              {incident.feedbackTimestamp && (
                <p className="text-xs text-slate-400 mt-2" data-testid="feedback-timestamp">
                  Submitted: {new Date(incident.feedbackTimestamp).toLocaleString()}
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
