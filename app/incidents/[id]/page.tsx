"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import FeedbackComponent from "@/components/FeedbackComponent";

interface Message {
  role: string;
  content: string;
  timestamp: string;
}

interface TimelineEntry {
  status: string;
  timestamp: string;
  actor: string;
}

interface Incident {
  _id: string;
  status: string;
  category: string;
  priority: number;
  urgency: number;
  impact: number;
  conversationHistory: Message[];
  timeline: TimelineEntry[];
  createdAt: string;
  escalationDetails?: { reason: string; group: string; timestamp: string };
  resolutionDetails?: { notes: string; timestamp: string };
  feedbackRating?: number;
}

interface User {
  userId: string;
  username?: string;
  email?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  Escalated: "bg-red-100 text-red-700",
  Resolved: "bg-green-100 text-green-700",
};

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) router.push("/login");
        else setUser(data.user);
      });

    fetch(`/api/incidents/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.incident) setIncident(data.incident);
        setLoading(false);
      });
  }, [id, router]);

  if (!user || loading) return null;
  if (!incident) return <div className="p-8 text-gray-500">Incident not found.</div>;

  const isEscalated = incident.status === "Escalated";
  const isResolved = incident.status === "Resolved";

  return (
    <div data-testid="incident-detail-page" className="flex flex-col min-h-screen bg-gray-50">
      <Header username={user.username} email={user.email} />

      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/incidents"
            data-testid="back-to-incidents"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Incidents
          </Link>
          <span className="text-gray-300">/</span>
          <h1 data-testid="incident-detail-heading" className="text-lg font-bold text-gray-900">
            Incident #{incident._id.slice(-8)}
          </h1>
          <span
            data-testid="incident-detail-status"
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[incident.status] || "bg-gray-100 text-gray-600"}`}
          >
            {incident.status}
          </span>
        </div>

        {/* Escalation Banner */}
        {isEscalated && (
          <div data-testid="escalation-banner" className="mb-6 bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
            <span className="text-red-500 text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-700">This incident has been escalated</p>
              {incident.escalationDetails && (
                <p className="text-sm text-red-600 mt-1">
                  Reason: {incident.escalationDetails.reason} · Assigned to: {incident.escalationDetails.group}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Resolved Banner */}
        {isResolved && (
          <div data-testid="resolved-banner" className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-green-500 text-xl">✓</span>
            <p className="font-semibold text-green-700">This incident is resolved</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Conversation */}
          <div data-testid="conversation-section" className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 data-testid="conversation-heading" className="font-semibold text-gray-800">Conversation History</h2>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {incident.conversationHistory.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No messages yet.</p>
                ) : (
                  incident.conversationHistory.map((msg, i) => (
                    <div
                      key={i}
                      data-testid={`detail-message-${i}`}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                          msg.role === "user" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Metadata */}
          <div data-testid="metadata-section" className="space-y-4">
            {/* Incident Details Card */}
            <div data-testid="details-card" className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 data-testid="details-heading" className="font-semibold text-gray-800 mb-3">Incident Details</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Category</dt>
                  <dd data-testid="detail-category" className="font-medium text-gray-900">{incident.category || "General"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Priority</dt>
                  <dd data-testid="detail-priority" className="font-medium text-gray-900">{incident.priority}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Urgency</dt>
                  <dd data-testid="detail-urgency" className="font-medium text-gray-900">{incident.urgency}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Impact</dt>
                  <dd data-testid="detail-impact" className="font-medium text-gray-900">{incident.impact}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Created</dt>
                  <dd data-testid="detail-created" className="font-medium text-gray-900">
                    {new Date(incident.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Timeline Card */}
            <div data-testid="timeline-card" className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 data-testid="timeline-heading" className="font-semibold text-gray-800 mb-3">Timeline</h2>
              <div data-testid="timeline-list" className="space-y-3">
                {incident.timeline.map((entry, i) => (
                  <div key={i} data-testid={`timeline-entry-${i}`} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{entry.status}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(entry.timestamp).toLocaleString()} · {entry.actor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Escalation Card */}
            {incident.escalationDetails && (
              <div data-testid="escalation-card" className="bg-white border border-red-200 rounded-xl p-5">
                <h2 data-testid="escalation-heading" className="font-semibold text-red-700 mb-3">Escalation Info</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Reason</dt>
                    <dd data-testid="escalation-reason" className="font-medium text-gray-900">{incident.escalationDetails.reason}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Assigned Group</dt>
                    <dd data-testid="escalation-group" className="font-medium text-gray-900">{incident.escalationDetails.group}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Timestamp</dt>
                    <dd data-testid="escalation-timestamp" className="font-medium text-gray-900">
                      {new Date(incident.escalationDetails.timestamp).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {/* Resolution Card */}
            {incident.resolutionDetails && (
              <div data-testid="resolution-card" className="bg-white border border-green-200 rounded-xl p-5">
                <h2 data-testid="resolution-heading" className="font-semibold text-green-700 mb-3">Resolution Info</h2>
                <p data-testid="resolution-notes" className="text-sm text-gray-700">{incident.resolutionDetails.notes}</p>
              </div>
            )}

            {/* Feedback Card */}
            <div data-testid="feedback-card" className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 data-testid="feedback-heading" className="font-semibold text-gray-800 mb-3">Feedback</h2>
              {incident.feedbackRating ? (
                <div data-testid="feedback-rating-display">
                  <p className="text-sm text-gray-600">Rating: {incident.feedbackRating}/5</p>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={s <= (incident.feedbackRating || 0) ? "text-orange-400" : "text-gray-200"}>★</span>
                    ))}
                  </div>
                </div>
              ) : (isResolved || isEscalated) ? (
                <FeedbackComponent incidentId={incident._id} onSubmitted={() => setIncident((prev) => prev ? { ...prev, feedbackRating: 1 } : prev)} />
              ) : (
                <p data-testid="feedback-pending" className="text-sm text-gray-400">Feedback available after resolution.</p>
              )}
            </div>

            {/* Resume button for non-resolved */}
            {!isResolved && !isEscalated && (
              <Link
                href={`/?resume=${incident._id}`}
                data-testid="resume-chat-detail-btn"
                className="block w-full text-center px-4 py-3 bg-red-500 hover:bg-orange-500 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Resume Chat
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
