import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { connectDB } from '@/lib/mongodb';
import Incident from '@/models/Incident';
import ProgressTimeline from '@/components/ProgressTimeline';
import FeedbackCard from '@/components/FeedbackCard';
import { formatDateTime, formatDate } from '@/lib/utils';

interface TimelineEvent {
  event: string;
  timestamp: Date | string;
}

interface MessageDoc {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date | string;
}

interface IncidentDoc {
  incidentId: string;
  category: string;
  status: 'Open' | 'Escalated' | 'Resolved';
  history: MessageDoc[];
  createdAt: Date | string;
  updatedAt: Date | string;
  priority: string;
  urgency: string;
  impact: string;
  storeNumber?: string;
  username: string;
  email: string;
  escalationData?: {
    reason?: string;
    group?: string;
    priority?: string;
    urgency?: string;
    impact?: string;
    timestamp?: Date | string;
  };
  resolutionData?: {
    timestamp?: Date | string;
    summary?: string;
  };
  feedback?: {
    rating?: number;
    comment?: string;
    submittedAt?: Date | string;
  };
  timeline?: TimelineEvent[];
}

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;

  await connectDB();
  const incident = await Incident.findOne({
    incidentId: id,
    email: session.email,
  }).lean() as unknown as IncidentDoc | null;

  if (!incident) notFound();

  const statusColors: Record<string, string> = {
    Open: 'bg-blue-100 text-blue-700',
    Escalated: 'bg-orange-100 text-orange-700',
    Resolved: 'bg-green-100 text-green-700',
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-4 py-8" data-testid="incident-detail">
      {/* Back link */}
      <Link href="/incidents" className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-flex items-center gap-1">
        ← Back to Incidents
      </Link>

      {/* Incident header */}
      <div
        data-testid="incident-header"
        className="bg-white border border-gray-200 rounded-xl px-6 py-4 mb-6 flex items-center gap-4"
      >
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Incident ID</p>
          <p className="font-mono font-bold text-gray-900">{incident.incidentId}</p>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Category</p>
          <p className="font-semibold text-gray-800 capitalize">{incident.category}</p>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Status</p>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
              statusColors[incident.status] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {incident.status}
          </span>
        </div>
        <div className="ml-auto">
          {incident.status === 'Open' && (
            <Link
              href={`/?incidentId=${incident.incidentId}`}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              data-testid="resume-chat-btn"
            >
              Resume Chat
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Conversation + Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conversation history */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Conversation</h2>
            </div>
            <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
              {incident.history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No messages yet.</p>
              ) : (
                incident.history.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start gap-2'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-red-600 text-white rounded-br-sm'
                          : 'bg-gray-50 border border-gray-200 border-l-2 border-l-red-500 text-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.timestamp && (
                        <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-red-200' : 'text-gray-400'}`}>
                          {formatDateTime(msg.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="bg-white border border-gray-200 rounded-xl px-6 py-4">
            <h2 className="font-semibold text-gray-900 mb-4">Progress</h2>
            <ProgressTimeline status={incident.status} timeline={incident.timeline} />

            {incident.timeline && incident.timeline.length > 0 && (
              <div className="mt-4 space-y-2">
                {incident.timeline.map((ev, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                    <span className="text-gray-700">{ev.event}</span>
                    <span className="text-gray-400 text-xs ml-auto">
                      {formatDateTime(ev.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback */}
          {(incident.status === 'Resolved' || incident.status === 'Escalated') && (
            <FeedbackCard
              incidentId={incident.incidentId}
              existingFeedback={incident.feedback}
            />
          )}
        </div>

        {/* Right: Case details */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm">Case Details</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Priority</dt>
                <dd className="text-gray-800">{incident.priority}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Urgency</dt>
                <dd className="text-gray-800">{incident.urgency}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Impact</dt>
                <dd className="text-gray-800">{incident.impact}</dd>
              </div>
              {incident.storeNumber && (
                <div>
                  <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Store #</dt>
                  <dd className="text-gray-800">{incident.storeNumber}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm">Identifiers</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Username</dt>
                <dd className="text-gray-800">{incident.username}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Email</dt>
                <dd className="text-gray-800 break-all">{incident.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Created</dt>
                <dd className="text-gray-800">{formatDate(incident.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Last Updated</dt>
                <dd className="text-gray-800">{formatDate(incident.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Escalation details */}
          {incident.escalationData && incident.status === 'Escalated' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-4">
              <h2 className="font-semibold text-orange-800 mb-3 text-sm">Escalation Details</h2>
              <dl className="space-y-2 text-sm">
                {incident.escalationData.reason && (
                  <div>
                    <dt className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-0.5">Reason</dt>
                    <dd className="text-orange-800">{incident.escalationData.reason}</dd>
                  </div>
                )}
                {incident.escalationData.group && (
                  <div>
                    <dt className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-0.5">Group</dt>
                    <dd className="text-orange-800">{incident.escalationData.group}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Resolution details */}
          {incident.resolutionData && incident.status === 'Resolved' && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
              <h2 className="font-semibold text-green-800 mb-3 text-sm">Resolution</h2>
              <p className="text-sm text-green-700 line-clamp-4">{incident.resolutionData.summary}</p>
              {incident.resolutionData.timestamp && (
                <p className="text-xs text-green-500 mt-2">{formatDateTime(incident.resolutionData.timestamp)}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
