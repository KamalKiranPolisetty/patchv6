"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import ChatMessage from "@/components/ChatMessage";

interface Incident {
  incidentId: string;
  sessionId: string;
  status: "Open" | "Escalated" | "Resolved";
  category: string;
  subCategory: string;
  priority: number;
  urgency: number;
  impact: number;
  configItem: string;
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>;
  timeline: Array<{ status: string; timestamp: string; actor: string }>;
  escalationDetails?: {
    reason: string;
    group: string;
    timestamp: string;
    category?: string;
    subcategory?: string;
    priority?: number;
    urgency?: number;
    impact?: number;
    configItem?: string;
  };
  resolutionDetails?: {
    timestamp: string;
    resolvedBy: string;
    summary?: string;
  };
  feedback?: { rating: number; comments: string };
  createdAt: string;
  updatedAt: string;
}

function formatDate(s: string) {
  return new Date(s).toLocaleString();
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1" data-testid="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          data-testid={`star-${star}`}
          onClick={() => onChange(star)}
          className={`text-xl ${star <= value ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-400 transition-colors`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/incidents/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setIncident(d.incident);
        if (d.incident?.feedback) setFeedbackSubmitted(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function submitFeedback() {
    if (!feedbackRating) return;
    setFeedbackLoading(true);
    await fetch(`/api/incidents/${id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: feedbackRating, comments: feedbackComment }),
    });
    setFeedbackSubmitted(true);
    setFeedbackLoading(false);
  }

  function handleResumeChat() {
    if (!incident) return;
    sessionStorage.setItem(
      "patch_resume",
      JSON.stringify({ incidentId: incident.incidentId, category: incident.subCategory || incident.category || "VDI" })
    );
    router.push("/");
  }

  if (loading) {
    return (
      <div data-testid="incident-detail-loading" className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div data-testid="incident-not-found" className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center text-gray-400">Incident not found.</div>
      </div>
    );
  }

  const timelineSteps = ["Open", "Escalated", "Resolved"];

  return (
    <div data-testid="incident-detail-page" className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 px-4 py-8" style={{ maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          {/* Header */}
          <div data-testid="incident-detail-header" className="mb-6">
            <Link
              href="/incidents"
              data-testid="back-to-incidents"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Incidents
            </Link>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <StatusBadge status={incident.status} />
                </div>
                <h1 data-testid="incident-title" className="text-2xl font-bold text-gray-900">
                  {incident.incidentId}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {incident.category || "—"} · Opened {formatDate(incident.createdAt)}
                </p>
              </div>
              {incident.status === "Open" && (
                <button
                  data-testid="resume-chat-btn"
                  onClick={handleResumeChat}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors flex-shrink-0"
                >
                  Resume Chat
                </button>
              )}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left column */}
            <div className="flex-1 space-y-4">
              {/* Conversation History */}
              <div
                data-testid="conversation-history-card"
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
              >
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Conversation History
                </h2>
                <div className="overflow-y-auto" style={{ maxHeight: "520px" }}>
                  {incident.conversationHistory.length === 0 ? (
                    <p className="text-sm text-gray-400">No messages yet.</p>
                  ) : (
                    incident.conversationHistory.map((msg, i) => (
                      <ChatMessage
                        key={i}
                        message={{ role: msg.role, content: msg.content, timestamp: msg.timestamp }}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Progress Timeline */}
              <div
                data-testid="progress-card"
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
              >
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Progress</h2>
                <div className="flex items-center gap-0">
                  {timelineSteps.map((step, i) => {
                    const reached = incident.timeline.some((t) => t.status === step);
                    const current = incident.status === step;
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div
                            data-testid={`timeline-step-${step.toLowerCase()}`}
                            className={`w-4 h-4 rounded-full border-2 ${
                              reached || current
                                ? "bg-red-600 border-red-600"
                                : "bg-white border-gray-300"
                            }`}
                          />
                          <span className={`text-xs mt-1 font-medium ${reached || current ? "text-red-600" : "text-gray-400"}`}>
                            {step}
                          </span>
                        </div>
                        {i < timelineSteps.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 mx-1 ${
                              incident.timeline.some((t) => t.status === timelineSteps[i + 1])
                                ? "bg-red-600"
                                : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Escalation / Resolution details */}
              {(incident.escalationDetails || incident.resolutionDetails) && (
                <div
                  data-testid="details-card"
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                >
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    {incident.escalationDetails ? "Escalation Details" : "Resolution Details"}
                  </h2>
                  {incident.escalationDetails && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">Reason</p>
                        <p className="text-gray-900 mt-0.5">{incident.escalationDetails.reason || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">Group</p>
                        <p className="text-gray-900 mt-0.5">{incident.escalationDetails.group || "IT Support"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">Timestamp</p>
                        <p className="text-gray-900 mt-0.5">{formatDate(incident.escalationDetails.timestamp)}</p>
                      </div>
                    </div>
                  )}
                  {incident.resolutionDetails && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">Resolved By</p>
                        <p className="text-gray-900 mt-0.5">{incident.resolutionDetails.resolvedBy || "Patch"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">Timestamp</p>
                        <p className="text-gray-900 mt-0.5">{formatDate(incident.resolutionDetails.timestamp)}</p>
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  {(incident.status === "Resolved" || incident.status === "Escalated") && (
                    <div
                      data-testid="feedback-section"
                      className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4"
                    >
                      <h3 className="text-xs font-bold text-gray-700 mb-3">How was your experience with Patch?</h3>
                      {feedbackSubmitted ? (
                        <p data-testid="feedback-submitted" className="text-sm text-green-600 font-medium">
                          Thank you for your feedback!
                          {incident.feedback && ` Rating: ${incident.feedback.rating}/5`}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <StarRating value={feedbackRating} onChange={setFeedbackRating} />
                          <textarea
                            data-testid="feedback-comment"
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            placeholder="Optional comment..."
                            rows={2}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-red-400 resize-none"
                          />
                          <div className="flex justify-end">
                            <button
                              data-testid="feedback-submit-btn"
                              onClick={submitFeedback}
                              disabled={!feedbackRating || feedbackLoading}
                              className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
                            >
                              {feedbackLoading ? "Submitting..." : "Submit"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="lg:w-72 space-y-4">
              {/* Case Details */}
              <div
                data-testid="case-details-card"
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
              >
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Case Details</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">Priority</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                      P{incident.priority}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">Type</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700">
                      {incident.category || "—"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">Urgency</p>
                    <p className="text-gray-900 mt-0.5">{incident.urgency || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">Impact</p>
                    <p className="text-gray-900 mt-0.5">{incident.impact || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">Config Item</p>
                    <p className="text-gray-900 mt-0.5">{incident.configItem || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">Created</p>
                    <p className="text-gray-900 mt-0.5 text-xs">{formatDate(incident.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">Updated</p>
                    <p className="text-gray-900 mt-0.5 text-xs">{formatDate(incident.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Identifiers */}
              <div
                data-testid="identifiers-card"
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
              >
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Identifiers</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide mb-1">Incident ID</p>
                    <div className="flex items-center gap-2">
                      <code data-testid="incident-id-code" className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded flex-1 truncate">
                        {incident.incidentId}
                      </code>
                      <button
                        data-testid="copy-incident-id-btn"
                        onClick={() => navigator.clipboard.writeText(incident.incidentId)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide mb-1">Session ID</p>
                    <div className="flex items-center gap-2">
                      <code data-testid="session-id-code" className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded flex-1 truncate">
                        {incident.sessionId}
                      </code>
                      <button
                        data-testid="copy-session-id-btn"
                        onClick={() => navigator.clipboard.writeText(incident.sessionId)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
