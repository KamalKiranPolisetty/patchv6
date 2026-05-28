'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import FeedbackCard from '@/components/chat/FeedbackCard'

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface TimelineEvent {
  status: string
  timestamp: string
  actor: string
}

interface IncidentDetail {
  incidentId: string
  status: 'Open' | 'Escalated' | 'Resolved'
  category: string
  subCategory: string
  priority: number
  urgency: number
  impact: number
  conversationHistory: ConversationMessage[]
  timeline: TimelineEvent[]
  escalationReason?: string
  assignedGroup?: string
  createdAt: string
  updatedAt: string
  feedbackRating?: number
  feedbackComments?: string
  feedbackSubmittedAt?: string
}

const statusBadgeClass: Record<string, string> = {
  Open: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Escalated: 'bg-red-100 text-red-800 border-red-200',
  Resolved: 'bg-green-100 text-green-800 border-green-200',
}

function stripJsonBlocks(content: string): string {
  return content.replace(/```json[\s\S]*?```/g, '').trim()
}

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [incident, setIncident] = useState<IncidentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => { if (!data.user) router.replace('/login') })
      .catch(() => router.replace('/login'))
  }, [router])

  useEffect(() => {
    fetch(`/api/incidents/${id}`)
      .then((r) => r.json())
      .then((data) => { if (data.incident) setIncident(data.incident) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  async function handleResumeChat() {
    if (!incident) return
    setRestoring(true)
    // Store restore data in sessionStorage for the main page to pick up
    sessionStorage.setItem('patch_restore_incident', JSON.stringify({
      incidentId: incident.incidentId,
      category: incident.category,
      status: incident.status,
      messages: incident.conversationHistory,
    }))
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="incident-detail-loading">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="incident-detail-not-found">
        <div className="text-gray-500 text-sm">Incident not found.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="incident-detail-page">
      <div className="h-14" />

      {incident.status === 'Escalated' && (
        <div className="bg-red-600 text-white px-6 py-3 text-sm font-medium flex items-center gap-2" data-testid="escalation-banner">
          ⚠ This incident has been escalated to the IT Support Team.
        </div>
      )}
      {incident.status === 'Resolved' && (
        <div className="bg-green-600 text-white px-6 py-3 text-sm font-medium flex items-center gap-2" data-testid="resolved-banner">
          ✓ This incident has been resolved.
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900" data-testid="detail-incident-id">{incident.incidentId}</h1>
          <span
            className={`text-sm font-medium px-3 py-1 rounded-full border ${statusBadgeClass[incident.status]}`}
            data-testid="detail-status-badge"
          >
            {incident.status}
          </span>
          {incident.status === 'Open' && (
            <button
              onClick={handleResumeChat}
              disabled={restoring}
              className="ml-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              data-testid="resume-chat-btn"
            >
              {restoring ? 'Resuming…' : 'Resume Chat'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: conversation + timeline */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Conversation History */}
            <section className="bg-white border border-gray-200 rounded-2xl p-5" data-testid="conversation-history-card">
              <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide" data-testid="conversation-heading">
                Conversation History
              </h2>
              {incident.conversationHistory.length === 0 ? (
                <p className="text-gray-400 text-sm" data-testid="conversation-empty">No messages yet.</p>
              ) : (
                <div className="flex flex-col gap-3" data-testid="conversation-messages">
                  {incident.conversationHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      data-testid={`conversation-message-${idx}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                          msg.role === 'user'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {stripJsonBlocks(msg.content)}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                        <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-red-200' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Timeline */}
            <section className="bg-white border border-gray-200 rounded-2xl p-5" data-testid="timeline-card">
              <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide" data-testid="timeline-heading">
                Timeline
              </h2>
              <div className="relative" data-testid="timeline-events">
                {incident.timeline.map((event, idx) => (
                  <div key={idx} className="flex gap-4 mb-4 last:mb-0" data-testid={`timeline-event-${idx}`}>
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                        event.status === 'Open' ? 'bg-yellow-400' :
                        event.status === 'Escalated' ? 'bg-red-500' :
                        'bg-green-500'
                      }`} />
                      {idx < incident.timeline.length - 1 && (
                        <div className="w-0.5 bg-gray-200 flex-1 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-semibold text-gray-800" data-testid={`timeline-status-${idx}`}>{event.status}</p>
                      <p className="text-xs text-gray-500" data-testid={`timeline-actor-${idx}`}>by {event.actor}</p>
                      <p className="text-xs text-gray-400" data-testid={`timeline-timestamp-${idx}`}>
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column: metadata */}
          <div className="flex flex-col gap-6">
            {/* Incident Details */}
            <section className="bg-white border border-gray-200 rounded-2xl p-5" data-testid="incident-details-card">
              <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">Details</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-gray-500">Category</dt>
                  <dd className="font-medium text-gray-800" data-testid="detail-category">{incident.category || 'VDI'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Sub-category</dt>
                  <dd className="font-medium text-gray-800" data-testid="detail-subcategory">{incident.subCategory}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Priority</dt>
                  <dd className="font-medium text-gray-800" data-testid="detail-priority">{incident.priority}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Urgency</dt>
                  <dd className="font-medium text-gray-800" data-testid="detail-urgency">{incident.urgency}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Impact</dt>
                  <dd className="font-medium text-gray-800" data-testid="detail-impact">{incident.impact}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Created</dt>
                  <dd className="font-medium text-gray-800" data-testid="detail-created-at">
                    {new Date(incident.createdAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Escalation Info */}
            {incident.status === 'Escalated' && (
              <section className="bg-white border border-red-200 rounded-2xl p-5" data-testid="escalation-card">
                <h2 className="font-semibold text-red-700 mb-4 text-sm uppercase tracking-wide">Escalation</h2>
                <dl className="space-y-3 text-sm">
                  {incident.escalationReason && (
                    <div>
                      <dt className="text-xs text-gray-500">Reason</dt>
                      <dd className="font-medium text-gray-800" data-testid="detail-escalation-reason">{incident.escalationReason}</dd>
                    </div>
                  )}
                  {incident.assignedGroup && (
                    <div>
                      <dt className="text-xs text-gray-500">Assigned Group</dt>
                      <dd className="font-medium text-gray-800" data-testid="detail-assigned-group">{incident.assignedGroup}</dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            {/* Resolution Info */}
            {incident.status === 'Resolved' && (
              <section className="bg-white border border-green-200 rounded-2xl p-5" data-testid="resolution-card">
                <h2 className="font-semibold text-green-700 mb-4 text-sm uppercase tracking-wide">Resolution</h2>
                <p className="text-sm text-gray-600" data-testid="detail-resolved-at">
                  Resolved on {new Date(incident.updatedAt).toLocaleString()}
                </p>
              </section>
            )}

            {/* Feedback */}
            {(incident.status === 'Resolved' || incident.status === 'Escalated') && (
              <section className="bg-white border border-gray-200 rounded-2xl p-5" data-testid="feedback-section">
                <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">Feedback</h2>
                <FeedbackCard
                  incidentId={incident.incidentId}
                  existingRating={incident.feedbackRating}
                  existingComments={incident.feedbackComments}
                />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
