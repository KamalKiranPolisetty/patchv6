"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import FeedbackBlock from "@/components/FeedbackBlock";
import type { Incident, Message } from "@/types";

function formatDate(d: Date | string | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-xs text-gray-400 hover:text-gray-600 ml-2"
      data-testid="copy-btn"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function ProgressTimeline({ incident }: { incident: Incident }) {
  const steps = ["Opened", "Escalated", "Resolved"];
  const activeStatuses = new Set(
    (incident.timeline || []).map((t: { event: string }) => t.event)
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm" data-testid="progress-card">
      <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Progress</h3>
      <div className="flex items-center gap-0">
        {steps.map((step, i) => {
          const isActive = activeStatuses.has(step) || (step === "Opened" && incident.createdAt);
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    isActive ? "bg-red-600 border-red-600" : "bg-white border-gray-300"
                  }`}
                  data-testid={`timeline-step-${step.toLowerCase()}`}
                />
                <span
                  className={`text-xs mt-1.5 font-medium ${
                    isActive ? "text-red-600" : "text-gray-400"
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 ${
                    isActive ? "bg-red-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function IncidentDetailClient({
  incidentId,
}: {
  incidentId: string;
  username?: string;
}) {
  const router = useRouter();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/incidents/${incidentId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setIncident(data))
      .catch(() => router.push("/incidents"))
      .finally(() => setLoading(false));
  }, [incidentId, router]);

  function handleResumeChat() {
    router.push(`/?resume=${incidentId}`);
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  if (!incident) return null;

  const isOpen = incident.status === "Open";

  return (
    <div className="flex flex-col h-screen" data-testid="incident-detail-page">
      <Header />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Top bar */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/incidents"
              className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
              data-testid="back-link"
            >
              ← Back
            </Link>
          </div>

          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1
                className="text-2xl font-bold text-gray-900"
                data-testid="incident-detail-heading"
              >
                {incident.incidentNumber}
              </h1>
              <StatusBadge status={incident.status} />
            </div>
            {isOpen && (
              <button
                onClick={handleResumeChat}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                data-testid="resume-chat-btn"
              >
                Resume Chat
              </button>
            )}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            {/* Left column */}
            <div className="space-y-5">
              {/* Conversation history */}
              <div
                className="bg-white border border-gray-200 rounded-xl shadow-sm"
                data-testid="conversation-history-card"
              >
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Conversation History
                  </h2>
                </div>
                <div
                  className="overflow-y-auto p-5 space-y-4"
                  style={{ maxHeight: "520px" }}
                  data-testid="conversation-scroll"
                >
                  {(incident.conversationHistory || []).length === 0 ? (
                    <p className="text-sm text-gray-400">No messages yet.</p>
                  ) : (
                    (incident.conversationHistory as Message[]).map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "flex-col"}`}
                        data-testid={`history-message-${i}`}
                      >
                        {msg.role === "user" ? (
                          <div className="bg-red-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-lg text-sm leading-relaxed">
                            {msg.content}
                          </div>
                        ) : (
                          <>
                            <span className="text-xs text-gray-400 mb-1 ml-1">Patch</span>
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xl shadow-sm border-l-2 border-l-red-500">
                              <MarkdownRenderer content={msg.content} />
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Progress */}
              <ProgressTimeline incident={incident} />

              {/* Details card */}
              {(incident.status === "Escalated" || incident.status === "Resolved") && (
                <div
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                  data-testid="details-card"
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                    {incident.status === "Escalated" ? "Escalation Details" : "Resolution Details"}
                  </h3>

                  {incident.status === "Escalated" && incident.escalationDetails && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
                      {[
                        ["Category", incident.escalationDetails.category],
                        ["Subcategory", incident.escalationDetails.subcategory],
                        ["Priority", incident.escalationDetails.priority],
                        ["Urgency", incident.escalationDetails.urgency],
                        ["Impact", incident.escalationDetails.impact],
                        ["Support Group", incident.escalationDetails.supportGroup || "VDI Infrastructure Team"],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
                            {label}
                          </p>
                          <p className="text-gray-900">{value || "—"}</p>
                        </div>
                      ))}
                      <div className="col-span-2">
                        <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
                          Reason
                        </p>
                        <p className="text-gray-900">{incident.escalationDetails.reason || "—"}</p>
                      </div>
                    </div>
                  )}

                  {incident.status === "Resolved" && incident.resolutionDetails && (
                    <div className="text-sm text-gray-700 mb-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">
                        Resolution Summary
                      </p>
                      <MarkdownRenderer content={incident.resolutionDetails.summary || "Resolved"} />
                    </div>
                  )}

                  {/* Feedback */}
                  <FeedbackBlock
                    incidentId={incident._id}
                    existingFeedback={incident.feedback}
                  />
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Case Details */}
              <div
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                data-testid="case-details-card"
              >
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Case Details
                </h3>
                <div className="space-y-3 text-sm">
                  {[
                    ["Status", <StatusBadge key="s" status={incident.status} />],
                    ["Category", incident.category],
                    ["Created For", incident.username],
                    ["Created", formatDate(incident.createdAt)],
                    ["Updated", formatDate(incident.updatedAt)],
                    ...(incident.escalationDetails
                      ? [
                          ["Priority", incident.escalationDetails.priority],
                          ["Urgency", incident.escalationDetails.urgency],
                          ["Impact", incident.escalationDetails.impact],
                        ]
                      : []),
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between items-start">
                      <span className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                        {label}
                      </span>
                      <span className="text-gray-900 text-right max-w-[60%]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Identifiers */}
              <div
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                data-testid="identifiers-card"
              >
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Identifiers
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">
                      Incident ID
                    </p>
                    <div className="flex items-center">
                      <code
                        className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 break-all"
                        data-testid="incident-id-value"
                      >
                        {incident.incidentNumber}
                      </code>
                      <CopyButton value={incident.incidentNumber} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">
                      Session ID
                    </p>
                    <div className="flex items-center">
                      <code
                        className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 break-all"
                        data-testid="session-id-value"
                      >
                        {incident._id}
                      </code>
                      <CopyButton value={incident._id} />
                    </div>
                  </div>
                </div>
              </div>

              {/* KB References */}
              {incident.kbReferences && incident.kbReferences.length > 0 && (
                <div
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                  data-testid="kb-references-card"
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    KB References
                  </h3>
                  <ul className="space-y-1">
                    {incident.kbReferences.map((ref, i) => (
                      <li key={i} className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
                        {ref}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
