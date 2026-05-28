"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import StarRating from "@/components/StarRating";

interface User { id: string; username: string; email: string; }
interface Message { role: string; content: string; timestamp: string; }
interface TimelineEntry { status: string; timestamp: string; actor: string; }
interface EscalationDetails { reason: string; group: string; timestamp: string; }

interface Incident {
  _id: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  conversationHistory: Message[];
  timeline: TimelineEntry[];
  escalationDetails?: EscalationDetails;
  resolutionDetails?: string;
  feedbackRating?: number;
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
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => { if (r.ok) { const d = await r.json(); setUser(d.user); } });
    fetch(`/api/incidents/${id}`).then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        setIncident(d.incident);
        if (d.incident.feedbackRating) {
          setFeedbackRating(d.incident.feedbackRating);
          setFeedbackSubmitted(true);
        }
      }
      setLoading(false);
    });
  }, [id]);

  async function handleFeedback(rating: number) {
    setFeedbackRating(rating);
    await fetch(`/api/incidents/${id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    setFeedbackSubmitted(true);
  }

  function handleResume() {
    localStorage.setItem("patch_resume_incident", id);
    router.push("/");
  }

  if (loading) return <div className="p-8 text-gray-500" data-testid="incident-detail-loading">Loading...</div>;
  if (!incident) return <div className="p-8 text-gray-500">Incident not found.</div>;

  const isResumable = incident.status === "Open" || incident.status === "In Progress";
  const isTerminal = incident.status === "Resolved" || incident.status === "Escalated";

  return (
    <div className="flex flex-col min-h-screen" data-testid="incident-detail-page">
      {user && <Header user={user} />}

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="mb-6">
          <button onClick={() => router.push("/incidents")} data-testid="back-to-incidents" className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Back to Incidents</button>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 data-testid="incident-detail-heading" className="text-2xl font-bold text-gray-900">
                Incident #{incident._id.slice(-8)}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Created {new Date(incident.createdAt).toLocaleString()}</p>
            </div>
            {isResumable && (
              <button
                onClick={handleResume}
                data-testid="resume-chat-btn"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Resume Chat
              </button>
            )}
          </div>
        </div>

        {incident.status === "Escalated" && (
          <div data-testid="escalation-banner" className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl text-red-700 font-medium">
            ⚠️ This incident has been escalated to Trusted Experts for hands-on support.
          </div>
        )}
        {incident.status === "Resolved" && (
          <div data-testid="resolution-banner" className="mb-6 p-4 bg-green-50 border border-green-300 rounded-xl text-green-700 font-medium">
            ✅ This incident is resolved and read-only.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="incident-detail-layout">
          {/* Left column */}
          <div className="space-y-6">
            <div data-testid="conversation-history-panel" className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 text-sm">Conversation History</h2>
              </div>
              <div className="p-5 max-h-96 overflow-y-auto space-y-3">
                {(incident.conversationHistory || []).map((msg, i) => (
                  <div key={i} data-testid={`detail-message-${i}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${msg.role === "user" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {incident.conversationHistory?.length === 0 && (
                  <p className="text-gray-400 text-sm text-center">No messages yet.</p>
                )}
              </div>
            </div>

            <div data-testid="status-timeline" className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 text-sm">Status Timeline</h2>
              </div>
              <div className="p-5 space-y-3">
                {(incident.timeline || []).map((entry, i) => (
                  <div key={i} data-testid={`timeline-entry-${i}`} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      entry.status === "Open" ? "bg-blue-500" :
                      entry.status === "In Progress" ? "bg-yellow-500" :
                      entry.status === "Escalated" ? "bg-red-500" : "bg-green-500"
                    }`} />
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[entry.status] || "bg-gray-100 text-gray-600"}`}>
                        {entry.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(entry.timestamp).toLocaleString()} · {entry.actor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div data-testid="incident-details-card" className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 text-sm">Incident Details</h2>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Category</span>
                  <span data-testid="detail-category" className="font-medium">{incident.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span data-testid="detail-status" className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[incident.status] || "bg-gray-100"}`}>
                    {incident.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span>{new Date(incident.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated</span>
                  <span>{new Date(incident.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {incident.escalationDetails && (
              <div data-testid="escalation-details-card" className="bg-white border border-red-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-red-100 bg-red-50">
                  <h2 className="font-semibold text-red-800 text-sm">Escalation Details</h2>
                </div>
                <div className="p-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reason</span>
                    <span className="font-medium text-right max-w-[60%]">{incident.escalationDetails.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assigned To</span>
                    <span className="font-medium">{incident.escalationDetails.group}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time</span>
                    <span>{new Date(incident.escalationDetails.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {incident.resolutionDetails && (
              <div data-testid="resolution-details-card" className="bg-white border border-green-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-green-100 bg-green-50">
                  <h2 className="font-semibold text-green-800 text-sm">Resolution Details</h2>
                </div>
                <div className="p-5 text-sm text-gray-700">{incident.resolutionDetails}</div>
              </div>
            )}

            {isTerminal && (
              <div data-testid="feedback-card" className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900 text-sm">Feedback</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-600 mb-3">How was this experience? Your feedback helps us improve the AI Agent.</p>
                  <StarRating onRate={handleFeedback} submitted={feedbackSubmitted} value={feedbackRating} />
                  {feedbackSubmitted && <p data-testid="feedback-thanks" className="text-xs text-green-600 mt-1">Thank you!</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
