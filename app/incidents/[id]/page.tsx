"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import ReactMarkdown from "react-markdown";

interface ConvMessage {
  role: "user" | "assistant";
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
  incidentId: string;
  status: "Open" | "Escalated" | "Resolved";
  category: string;
  subCategory: string;
  priority: number;
  urgency: number;
  impact: number;
  conversationHistory: ConvMessage[];
  timeline: TimelineEntry[];
  escalationDetails?: Record<string, unknown>;
  resolutionDetails?: Record<string, unknown>;
  feedback?: { rating: number; comment: string };
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  Open: "bg-yellow-100 text-yellow-700",
  Escalated: "bg-red-100 text-red-700",
  Resolved: "bg-green-100 text-green-700",
};

function formatDate(d: string) {
  return new Date(d).toLocaleString();
}

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/incidents/${id}`)
      .then(r => r.json())
      .then(data => { setIncident(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  function handleResume() {
    router.push(`/?resume=${id}`);
  }

  if (loading) return (
    <div data-testid="incident-detail-page" className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center pt-14 text-gray-500">Loading...</div>
    </div>
  );

  if (!incident) return (
    <div data-testid="incident-detail-page" className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center pt-14 text-gray-500">Incident not found.</div>
    </div>
  );

  return (
    <div data-testid="incident-detail-page" className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-1 pt-14 px-4 py-6 max-w-6xl mx-auto w-full">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 data-testid="incident-detail-id" className="text-xl font-bold text-gray-900">#{incident.incidentId}</h1>
            <span
              data-testid="incident-detail-status"
              className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[incident.status]}`}
            >
              {incident.status}
            </span>
          </div>
          {incident.status === "Open" && (
            <button
              data-testid="resume-chat-btn"
              onClick={handleResume}
              className="bg-red-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Resume Chat
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Conversation History */}
          <div data-testid="conversation-section" className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 text-sm">Conversation History</h2>
            </div>
            <div
              data-testid="conversation-history"
              className="overflow-y-auto p-4 space-y-3"
              style={{ maxHeight: "520px" }}
            >
              {incident.conversationHistory?.map((msg, i) => (
                <div key={i} data-testid={`detail-message-${i}`}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-red-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%] text-xs leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex">
                      <div
                        className="bg-gray-50 border-l-2 border-red-500 rounded-xl px-3 py-2 max-w-[80%] text-xs leading-relaxed prose prose-sm"
                        style={{ borderLeftWidth: "2px", borderLeftColor: "#DC2626" }}
                      >
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  <div className={`text-xs text-gray-400 mt-0.5 ${msg.role === "user" ? "text-right" : ""}`}>
                    {formatDate(msg.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Metadata */}
          <div className="space-y-4">
            {/* Details card */}
            <div data-testid="details-section" className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="font-semibold text-gray-800 text-sm mb-3">Details</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-gray-500">Category</span><div className="font-medium text-gray-800">{incident.category}</div></div>
                <div><span className="text-xs text-gray-500">Sub-Category</span><div className="font-medium text-gray-800">{incident.subCategory}</div></div>
                <div><span className="text-xs text-gray-500">Priority</span><div className="font-medium text-gray-800">{incident.priority}</div></div>
                <div><span className="text-xs text-gray-500">Urgency</span><div className="font-medium text-gray-800">{incident.urgency}</div></div>
                <div><span className="text-xs text-gray-500">Impact</span><div className="font-medium text-gray-800">{incident.impact}</div></div>
                <div><span className="text-xs text-gray-500">Created</span><div className="font-medium text-gray-800">{formatDate(incident.createdAt)}</div></div>
              </div>
            </div>

            {/* Timeline */}
            <div data-testid="timeline-section" className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="font-semibold text-gray-800 text-sm mb-3">Timeline</h2>
              <div className="space-y-3">
                {incident.timeline?.map((entry, i) => (
                  <div key={i} data-testid={`timeline-entry-${i}`} className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                      entry.status === "Open" ? "bg-yellow-400" :
                      entry.status === "Escalated" ? "bg-red-500" :
                      "bg-green-500"
                    }`} />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{entry.status}</div>
                      <div className="text-xs text-gray-400">{formatDate(entry.timestamp)} · {entry.actor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Escalation details */}
            {incident.escalationDetails && (
              <div data-testid="escalation-section" className="bg-white rounded-xl shadow-sm border border-red-100 p-4">
                <h2 className="font-semibold text-red-700 text-sm mb-2">Escalation Details</h2>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(incident.escalationDetails, null, 2)}</pre>
              </div>
            )}

            {/* Resolution details */}
            {incident.resolutionDetails && (
              <div data-testid="resolution-section" className="bg-white rounded-xl shadow-sm border border-green-100 p-4">
                <h2 className="font-semibold text-green-700 text-sm mb-2">Resolution Details</h2>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(incident.resolutionDetails, null, 2)}</pre>
              </div>
            )}

            {/* Feedback */}
            {incident.feedback && (
              <div data-testid="feedback-section" className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h2 className="font-semibold text-gray-800 text-sm mb-2">Feedback</h2>
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className={s <= incident.feedback!.rating ? "text-yellow-400" : "text-gray-200"}>★</span>
                  ))}
                </div>
                {incident.feedback.comment && (
                  <p className="text-xs text-gray-600 mt-1">{incident.feedback.comment}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
