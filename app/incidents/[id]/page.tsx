"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import ChatBubble from "@/components/ChatBubble";
import FeedbackCard from "@/components/FeedbackCard";
import type { IncidentStatus, EscalationData, FeedbackData } from "@/lib/types";

interface IncidentDetail {
  _id: string;
  incidentId: string;
  userId: string;
  username: string;
  userEmail: string;
  category: string;
  status: IncidentStatus;
  history: Array<{ role: "user" | "assistant"; content: string; timestamp: string }>;
  escalation: EscalationData | null;
  resolution: { details: string; timestamp: string } | null;
  feedback: FeedbackData | null;
  createdAt: string;
  updatedAt: string;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>
        {label}
      </p>
      <p className="text-sm" style={{ color: "#111111" }}>
        {value || "—"}
      </p>
    </div>
  );
}

function ProgressTimeline({ status }: { status: IncidentStatus }) {
  const milestones = ["Opened", "Escalated", "Resolved"];
  const activeIndex =
    status === "Open" ? 0 : status === "Escalated" ? 1 : 2;

  return (
    <div className="flex items-center gap-2" data-testid="progress-timeline">
      {milestones.map((m, i) => (
        <div key={m} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div
              className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: i <= activeIndex ? "#DC2626" : "#D1D5DB",
                background: i <= activeIndex ? "#DC2626" : "#fff",
              }}
              data-testid={`timeline-${m.toLowerCase()}`}
            >
              {i <= activeIndex && (
                <svg width="8" height="8" viewBox="0 0 12 12" fill="white">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <span className="text-xs mt-1 font-medium" style={{ color: i <= activeIndex ? "#DC2626" : "#9CA3AF" }}>
              {m}
            </span>
          </div>
          {i < milestones.length - 1 && (
            <div
              className="h-0.5 w-12 mt-0 -mt-4"
              style={{ background: i < activeIndex ? "#DC2626" : "#E5E7EB" }}
              data-testid={`timeline-line-${i}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/incidents/${id}`)
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        if (r.status === 404) { router.push("/incidents"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setIncident(data);
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#F5F5F5" }}>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: "#6B7280" }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!incident) return null;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F5F5F5" }}>
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Back link */}
          <Link
            href="/incidents"
            className="text-xs hover:underline mb-3 block"
            style={{ color: "#9CA3AF" }}
            data-testid="back-to-incidents-link"
          >
            ← Back to Incidents
          </Link>

          {/* Status badge + title */}
          <div className="mb-6">
            <StatusBadge status={incident.status} testId="detail-status-badge" />
            <h1 className="text-xl font-bold mt-2" style={{ color: "#111111" }} data-testid="detail-incident-id">
              {incident.incidentId}
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }} data-testid="detail-category">
              {incident.category}
            </p>
          </div>

          {/* Two-column layout */}
          <div className="flex gap-6 items-start flex-col md:flex-row">
            {/* LEFT COLUMN (~70%) */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">

              {/* Conversation History */}
              <div
                className="bg-white rounded-xl p-6"
                style={{ border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                data-testid="conversation-history-card"
              >
                <h2 className="text-sm font-semibold mb-4" style={{ color: "#111111" }}>
                  Conversation History
                </h2>
                <div
                  className="overflow-y-auto"
                  style={{ maxHeight: "520px" }}
                  data-testid="conversation-history-scroll"
                >
                  {incident.history.length === 0 ? (
                    <p className="text-sm" style={{ color: "#9CA3AF" }}>No messages yet.</p>
                  ) : (
                    incident.history.map((msg, i) => (
                      <ChatBubble
                        key={i}
                        role={msg.role}
                        content={msg.content}
                        timestamp={msg.timestamp}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Progress Timeline */}
              <div
                className="bg-white rounded-xl p-6"
                style={{ border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                data-testid="progress-card"
              >
                <h2 className="text-sm font-semibold mb-4" style={{ color: "#111111" }}>
                  Progress
                </h2>
                <ProgressTimeline status={incident.status} />
              </div>

              {/* Status Details */}
              {(incident.status === "Escalated" || incident.status === "Resolved") && (
                <div
                  className="bg-white rounded-xl p-6"
                  style={{ border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                  data-testid="status-details-card"
                >
                  <h2 className="text-sm font-semibold mb-4" style={{ color: "#111111" }}>
                    {incident.status === "Escalated" ? "Escalation Details" : "Resolution Details"}
                  </h2>

                  {incident.status === "Escalated" && incident.escalation && (
                    <div className="grid grid-cols-2 gap-4 mb-4" data-testid="escalation-details-grid">
                      <Field label="Category" value={incident.escalation.category} />
                      <Field label="Subcategory" value={incident.escalation.subcategory} />
                      <Field label="Priority" value={incident.escalation.priority} />
                      <Field label="Urgency" value={incident.escalation.urgency} />
                      <Field label="Impact" value={incident.escalation.impact} />
                      <Field label="Support Group" value={incident.escalation.support_group} />
                      <Field label="Configuration Item" value={incident.escalation.configuration_item} />
                      <Field label="Reason" value={incident.escalation.reason} />
                    </div>
                  )}

                  {incident.status === "Resolved" && incident.resolution && (
                    <div className="mb-4" data-testid="resolution-details">
                      <Field label="Resolution Summary" value={incident.resolution.details} />
                      <div className="mt-3">
                        <Field
                          label="Resolved At"
                          value={new Date(incident.resolution.timestamp).toLocaleString()}
                        />
                      </div>
                    </div>
                  )}

                  {/* Divider + Feedback */}
                  <div style={{ borderTop: "1px solid #E5E7EB", marginTop: "16px", paddingTop: "16px" }}>
                    <FeedbackCard
                      incidentId={incident._id}
                      existingFeedback={incident.feedback}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN (~30%) */}
            <div className="flex flex-col gap-6" style={{ minWidth: "260px", width: "30%" }}>

              {/* Case Details */}
              <div
                className="bg-white rounded-xl p-5"
                style={{ border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                data-testid="case-details-card"
              >
                <h2 className="text-sm font-semibold mb-4" style={{ color: "#111111" }}>
                  Case Details
                </h2>
                <div className="flex flex-col gap-3">
                  <Field label="Category" value={incident.category} />
                  <Field label="Status" value={incident.status} />
                  {incident.escalation && (
                    <>
                      <Field label="Priority" value={incident.escalation.priority} />
                      <Field label="Urgency" value={incident.escalation.urgency} />
                      <Field label="Impact" value={incident.escalation.impact} />
                    </>
                  )}
                  <Field label="Created" value={new Date(incident.createdAt).toLocaleString()} />
                  <Field label="Updated" value={new Date(incident.updatedAt).toLocaleString()} />
                  <Field label="Created For" value={incident.username} />
                </div>
              </div>

              {/* Identifiers */}
              <div
                className="bg-white rounded-xl p-5"
                style={{ border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                data-testid="identifiers-card"
              >
                <h2 className="text-sm font-semibold mb-4" style={{ color: "#111111" }}>
                  Identifiers
                </h2>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#9CA3AF" }}>
                      Incident ID
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono" style={{ color: "#111111" }} data-testid="detail-incident-id-value">
                        {incident.incidentId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(incident.incidentId, "incidentId")}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: "#F3F4F6", color: "#6B7280" }}
                        data-testid="copy-incident-id-btn"
                      >
                        {copied === "incidentId" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#9CA3AF" }}>
                      Session ID
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono truncate" style={{ color: "#111111" }} data-testid="detail-session-id-value">
                        {incident._id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(incident._id, "sessionId")}
                        className="text-xs px-2 py-0.5 rounded flex-shrink-0"
                        style={{ background: "#F3F4F6", color: "#6B7280" }}
                        data-testid="copy-session-id-btn"
                      >
                        {copied === "sessionId" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resume Chat (only for Open incidents) */}
              {incident.status === "Open" && (
                <Link
                  href={`/?resume=${incident._id}`}
                  className="w-full text-center py-2.5 rounded-lg text-white font-semibold text-sm transition-colors block"
                  style={{ background: "#DC2626" }}
                  data-testid="resume-chat-btn"
                >
                  Resume Chat
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
