'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface TimelineEvent {
  event: string;
  timestamp: string;
  updatedBy?: string;
}

interface Incident {
  incidentId: string;
  status: 'Open' | 'In Progress' | 'Escalated' | 'Resolved';
  category: string | null;
  priority: number;
  urgency: number;
  impact: number;
  conversationHistory: ConversationMessage[];
  timeline: TimelineEvent[];
  lastUpdatedBy: string;
  feedbackRating?: number;
  escalationReason?: string;
  assignedSupportGroup?: string;
  escalationTimestamp?: string;
  createdAt: string;
  updatedAt: string;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'Resolved': return 'bg-green-100 text-green-700 border-green-200';
    case 'Escalated': return 'bg-red-100 text-red-700 border-red-200';
    case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export default function IncidentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/incidents/${id}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) { setNotFound(true); setLoading(false); return; }
        if (res.status === 401) { router.push('/login'); return; }
        const data = await res.json();
        if (!cancelled) { setIncident(data.incident); setLoading(false); }
      })
      .catch(() => { if (!cancelled) { setNotFound(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading incident…
      </div>
    );
  }

  if (notFound) {
    return (
      <div data-testid="incident-not-found" className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Incident not found</h1>
        <p className="text-gray-500">The incident you are looking for does not exist.</p>
        <button
          data-testid="back-to-incidents-btn"
          onClick={() => router.push('/incidents')}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Back to Incidents
        </button>
      </div>
    );
  }

  if (!incident) return null;

  const isClosed = incident.status === 'Resolved' || incident.status === 'Escalated';

  return (
    <div data-testid="incident-detail-page" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header data-testid="detail-header" className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <button
          data-testid="back-btn"
          onClick={() => router.push('/incidents')}
          className="text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 data-testid="detail-incident-id" className="font-mono font-bold text-gray-900">{incident.incidentId}</h1>
            <span
              data-testid="detail-status-badge"
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadgeClass(incident.status)}`}
            >
              {incident.status}
            </span>
            {incident.category && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {incident.category}
              </span>
            )}
          </div>
        </div>
        {!isClosed && (
          <button
            data-testid="resume-chat-btn"
            onClick={() => router.push(`/?resume=${incident.incidentId}`)}
            className="px-4 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
          >
            Resume Chat
          </button>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Escalation Banner */}
          {incident.status === 'Escalated' && (
            <div
              data-testid="escalation-banner"
              className="bg-red-50 border border-red-200 rounded-xl p-5"
            >
              <h2 data-testid="escalation-heading" className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                🚨 Escalated to Support
              </h2>
              {incident.assignedSupportGroup && (
                <p className="text-sm text-red-700">
                  <strong>Assigned to:</strong> {incident.assignedSupportGroup}
                </p>
              )}
              {incident.escalationReason && (
                <p className="text-sm text-red-700 mt-1">
                  <strong>Reason:</strong> {incident.escalationReason}
                </p>
              )}
              {incident.escalationTimestamp && (
                <p className="text-xs text-red-500 mt-1">
                  {new Date(incident.escalationTimestamp).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Conversation History */}
          <section data-testid="conversation-history" className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 data-testid="conversation-heading" className="font-semibold text-gray-900 mb-4">
              Conversation History
            </h2>
            {incident.conversationHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">No messages yet.</p>
            ) : (
              <div className="space-y-3">
                {incident.conversationHistory.map((msg, i) => (
                  <div
                    key={i}
                    data-testid={`history-message-${msg.role}`}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                        <span className="text-orange-700 text-xs font-bold">P</span>
                      </div>
                    )}
                    <div className={`max-w-md rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Timeline */}
          <section data-testid="incident-timeline" className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 data-testid="timeline-heading" className="font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
              {incident.timeline.map((event, i) => (
                <div key={i} data-testid="timeline-event" className="relative mb-4">
                  <div className="absolute -left-4 w-3 h-3 rounded-full bg-orange-400 border-2 border-white" />
                  <p className="text-sm text-gray-800">{event.event}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(event.timestamp).toLocaleString()}
                    {event.updatedBy ? ` · ${event.updatedBy}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <section data-testid="incident-details" className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 data-testid="details-heading" className="font-semibold text-gray-900 mb-3">Details</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd data-testid="detail-status" className="font-medium text-gray-900">{incident.status}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd data-testid="detail-category" className="font-medium text-gray-900">{incident.category || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Priority</dt>
                <dd data-testid="detail-priority" className="font-medium text-gray-900">{incident.priority}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Urgency</dt>
                <dd data-testid="detail-urgency" className="font-medium text-gray-900">{incident.urgency}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Impact</dt>
                <dd data-testid="detail-impact" className="font-medium text-gray-900">{incident.impact}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated By</dt>
                <dd data-testid="detail-updated-by" className="font-medium text-gray-900">{incident.lastUpdatedBy}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium text-gray-900">{new Date(incident.createdAt).toLocaleDateString()}</dd>
              </div>
              {incident.feedbackRating && (
                <div>
                  <dt className="text-gray-500">Feedback</dt>
                  <dd data-testid="detail-feedback" className="font-medium text-amber-500">
                    {'★'.repeat(incident.feedbackRating)}{'☆'.repeat(5 - incident.feedbackRating)}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {incident.status === 'Resolved' && (
            <section data-testid="resolution-section" className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h2 data-testid="resolution-heading" className="font-semibold text-green-800 mb-2">Resolved</h2>
              <p className="text-sm text-green-700">
                This incident was successfully resolved by Patch.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
