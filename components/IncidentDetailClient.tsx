"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SimpleMarkdown from "@/components/SimpleMarkdown";
import FeedbackCard from "@/components/FeedbackCard";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ControlMetadata {
  type: "probable_options" | "select_list" | "structured_form";
  options?: string[];
  fieldDefinitions?: { key: string; label: string }[];
  totalCards?: number;
  partialValues?: Record<string, unknown>;
  completionStatus: "awaiting" | "completed";
}

interface HistoryMessage {
  _id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  controlMetadata?: ControlMetadata;
}

interface Feedback {
  stars: number;
  comment: string;
  submittedAt: string;
}

interface Incident {
  incidentId: string;
  sessionId: string;
  userId: string;
  status: "Open" | "Escalated" | "Resolved";
  category: string;
  history: HistoryMessage[];
  escalationDetails: Record<string, unknown> | null;
  resolutionDetails: Record<string, unknown> | null;
  feedback: Feedback | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

// PATCH-20: Open=yellow, Escalated=red, Resolved=green
const STATUS_STYLES: Record<string, string> = {
  Open: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Escalated: "bg-red-100 text-red-700 border-red-200",
  Resolved: "bg-green-100 text-green-700 border-green-200",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function str(obj: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!obj) return null;
  const v = obj[key];
  return typeof v === "string" && v ? v : null;
}

function CopyButton({ value, testId }: { value: string; testId: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
      title="Copy"
      data-testid={testId}
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8l4 4 6-6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

// ─── Progress Timeline ─────────────────────────────────────────────────────────

function ProgressTimeline({ status }: { status: Incident["status"] }) {
  const steps = [
    { key: "Opened", completed: true },
    { key: "Escalated", completed: status === "Escalated" },
    { key: "Resolved", completed: status === "Resolved" },
  ];

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5"
      data-testid="progress-card"
    >
      <h2 className="text-sm font-semibold text-gray-900 mb-4" data-testid="progress-heading">
        Progress
      </h2>
      <div className="flex items-center w-full" data-testid="progress-timeline">
        {steps.map((step, idx) => (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Circle + label */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                  step.completed
                    ? "bg-[#CC0000] border-[#CC0000]"
                    : "bg-white border-gray-300"
                }`}
                data-testid={`progress-step-${step.key.toLowerCase()}`}
              >
                {step.completed && (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8l4 4 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  step.completed ? "text-gray-800" : "text-gray-400"
                }`}
              >
                {step.key}
              </span>
            </div>

            {/* Connecting line (not after last) */}
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-5 rounded-full ${
                  steps[idx + 1].completed ? "bg-[#CC0000]" : "bg-gray-200"
                }`}
                data-testid={`progress-line-${idx}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Status Details Card (Escalation) ─────────────────────────────────────────

function EscalationDetailsCard({
  incident,
}: {
  incident: Incident;
}) {
  const esc = incident.escalationDetails;
  const reason = str(esc, "reason");
  const priority = str(esc, "priority");
  const urgency = str(esc, "urgency");
  const impact = str(esc, "impact");
  const group = str(esc, "group") ?? str(esc, "support_group") ?? str(esc, "assignment_group");

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      data-testid="escalation-details-card"
    >
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-red-50">
        <span
          className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200"
          data-testid="escalation-details-badge"
        >
          Escalated
        </span>
        <span className="text-xs text-red-600 font-medium">Escalation Details</span>
      </div>

      <div className="px-6 py-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {reason && (
            <>
              <dt className="text-gray-500 font-medium text-xs">Reason</dt>
              <dd className="text-gray-800 text-xs" data-testid="escalation-reason">{reason}</dd>
            </>
          )}
          {priority && (
            <>
              <dt className="text-gray-500 font-medium text-xs">Priority</dt>
              <dd className="text-gray-800 text-xs" data-testid="escalation-priority">{priority}</dd>
            </>
          )}
          {urgency && (
            <>
              <dt className="text-gray-500 font-medium text-xs">Urgency</dt>
              <dd className="text-gray-800 text-xs" data-testid="escalation-urgency">{urgency}</dd>
            </>
          )}
          {impact && (
            <>
              <dt className="text-gray-500 font-medium text-xs">Impact</dt>
              <dd className="text-gray-800 text-xs" data-testid="escalation-impact">{impact}</dd>
            </>
          )}
          {group && (
            <>
              <dt className="text-gray-500 font-medium text-xs">Support Group</dt>
              <dd className="text-gray-800 text-xs" data-testid="escalation-group">{group}</dd>
            </>
          )}
          {!reason && !priority && !urgency && !impact && !group && (
            <dd className="col-span-2 text-xs text-gray-400">
              No additional escalation details recorded.
            </dd>
          )}
        </dl>
      </div>

      {/* Integrated feedback section */}
      <div className="px-6 pb-5">
        <FeedbackCard
          incidentId={incident.incidentId}
          existingFeedback={incident.feedback}
          variant="inline"
        />
      </div>
    </div>
  );
}

// ─── Status Details Card (Resolution) ─────────────────────────────────────────

function ResolutionDetailsCard({
  incident,
}: {
  incident: Incident;
}) {
  const res = incident.resolutionDetails as { summary?: string; resolvedAt?: string } | null;
  const summary = res?.summary;
  const resolvedAt = res?.resolvedAt
    ? new Date(res.resolvedAt).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
      })
    : null;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      data-testid="resolution-details-card"
    >
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-green-50">
        <span
          className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200"
          data-testid="resolution-details-badge"
        >
          Resolved
        </span>
        <span className="text-xs text-green-600 font-medium">Resolution Details</span>
      </div>

      <div className="px-6 py-4">
        {resolvedAt && (
          <p className="text-xs text-gray-500 mb-2" data-testid="resolution-resolved-at">
            Resolved: {resolvedAt}
          </p>
        )}
        {summary && (
          <p className="text-xs text-gray-700 leading-relaxed" data-testid="resolution-summary">
            {summary}
          </p>
        )}
        {!summary && !resolvedAt && (
          <p className="text-xs text-gray-400">Issue resolved.</p>
        )}
      </div>

      {/* Integrated feedback section */}
      <div className="px-6 pb-5">
        <FeedbackCard
          incidentId={incident.incidentId}
          existingFeedback={incident.feedback}
          variant="inline"
        />
      </div>
    </div>
  );
}

// ─── Case Details Card ─────────────────────────────────────────────────────────

function PillBadge({ text }: { text: string }) {
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
      {text}
    </span>
  );
}

function CaseDetailsCard({ incident }: { incident: Incident }) {
  const esc = incident.escalationDetails;
  const priority = str(esc, "priority");
  const urgency = str(esc, "urgency");
  const impact = str(esc, "impact");

  const createdStr = new Date(incident.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const updatedStr = new Date(incident.updatedAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4"
      data-testid="case-details-card"
    >
      <h2 className="text-sm font-semibold text-gray-900 mb-4" data-testid="case-details-heading">
        Case Details
      </h2>
      <dl className="flex flex-col gap-3 text-xs">
        <div className="flex justify-between items-center">
          <dt className="text-gray-500 font-medium">Type</dt>
          <dd><PillBadge text={incident.category || "General"} /></dd>
        </div>
        <div className="flex justify-between items-center">
          <dt className="text-gray-500 font-medium">Priority</dt>
          <dd>
            {priority ? <PillBadge text={priority} /> : <span className="text-gray-400">—</span>}
          </dd>
        </div>
        <div className="flex justify-between items-center">
          <dt className="text-gray-500 font-medium">Urgency</dt>
          <dd className="text-gray-800">{urgency ?? "—"}</dd>
        </div>
        <div className="flex justify-between items-center">
          <dt className="text-gray-500 font-medium">Impact</dt>
          <dd className="text-gray-800">{impact ?? "—"}</dd>
        </div>
        <div className="flex justify-between items-center">
          <dt className="text-gray-500 font-medium">Store</dt>
          <dd className="text-gray-400">—</dd>
        </div>
        <div className="h-px bg-gray-100 my-1" />
        <div className="flex justify-between items-center">
          <dt className="text-gray-500 font-medium">Created</dt>
          <dd className="text-gray-800" data-testid="case-details-created">{createdStr}</dd>
        </div>
        <div className="flex justify-between items-center">
          <dt className="text-gray-500 font-medium">Updated</dt>
          <dd className="text-gray-800" data-testid="case-details-updated">{updatedStr}</dd>
        </div>
      </dl>
    </div>
  );
}

// ─── Identifiers Card ──────────────────────────────────────────────────────────

function IdentifiersCard({ incident }: { incident: Incident }) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4"
      data-testid="identifiers-card"
    >
      <h2 className="text-sm font-semibold text-gray-900 mb-4" data-testid="identifiers-heading">
        Identifiers
      </h2>
      <dl className="flex flex-col gap-3 text-xs">
        <div>
          <dt className="text-gray-500 font-medium mb-1">Incident ID</dt>
          <dd className="flex items-center gap-1">
            <span
              className="font-mono text-gray-700 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-0.5 truncate max-w-[180px]"
              title={incident.incidentId}
              data-testid="identifier-incident-id"
            >
              {incident.incidentId}
            </span>
            <CopyButton value={incident.incidentId} testId="copy-incident-id-btn" />
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 font-medium mb-1">Session ID</dt>
          <dd className="flex items-center gap-1">
            <span
              className="font-mono text-gray-700 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-0.5 truncate max-w-[180px]"
              title={incident.sessionId}
              data-testid="identifier-session-id"
            >
              {incident.sessionId}
            </span>
            <CopyButton value={incident.sessionId} testId="copy-session-id-btn" />
          </dd>
        </div>
      </dl>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function IncidentDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/incidents/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { incident: Incident }) => setIncident(data.incident))
      .catch((e) => setError(e === 404 ? "Incident not found." : "Failed to load incident."))
      .finally(() => setLoading(false));
  }, [id]);

  function handleResume() {
    router.push(`/?resume=${id}`);
  }

  if (loading) {
    return (
      <div className="min-h-full bg-[#FAFAF8] flex items-center justify-center" data-testid="incident-detail-loading">
        <div className="text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-full bg-[#FAFAF8] flex items-center justify-center" data-testid="incident-detail-error">
        <div className="text-sm text-red-500">{error ?? "Unknown error."}</div>
      </div>
    );
  }

  const isOpen = incident.status === "Open";
  const isTerminal = incident.status === "Escalated" || incident.status === "Resolved";

  return (
    <div className="min-h-full bg-[#FAFAF8] px-6 py-8" data-testid="incident-detail-page">
      <div className="max-w-6xl mx-auto">

        {/* Back link */}
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
          data-testid="incident-detail-back-link"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Incidents
        </Link>

        {/* ── Header card ── */}
        <div
          className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 mb-6"
          data-testid="incident-detail-header"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="text-xs font-mono text-gray-400"
                  data-testid="incident-detail-id"
                >
                  #{incident.incidentId.slice(0, 8)}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${STATUS_STYLES[incident.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                  data-testid="incident-detail-status"
                >
                  {incident.status}
                </span>
              </div>
              <h1
                className="text-xl font-bold text-gray-900 capitalize"
                data-testid="incident-detail-category"
              >
                {incident.category || "General"} Issue
              </h1>
              <p className="text-xs text-gray-400" data-testid="incident-detail-date">
                Created{" "}
                {new Date(incident.createdAt).toLocaleString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                  hour: "numeric", minute: "2-digit",
                })}
              </p>
            </div>

            {isOpen ? (
              <button
                onClick={handleResume}
                className="shrink-0 px-4 py-2 bg-[#CC0000] hover:bg-[#AA0000] text-white text-sm font-semibold rounded-lg transition-colors"
                data-testid="incident-detail-resume-btn"
              >
                Resume Chat
              </button>
            ) : (
              <div
                className="shrink-0 text-xs text-gray-400 italic"
                data-testid="incident-detail-readonly-label"
              >
                Read-only
              </div>
            )}
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex gap-6 items-start" data-testid="incident-detail-columns">

          {/* Left column (~70%) */}
          <div className="flex-1 min-w-0 flex flex-col gap-5" data-testid="incident-detail-left-col">

            {/* 1. Conversation History */}
            <div
              className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5"
              data-testid="incident-detail-history-card"
            >
              <h2
                className="text-sm font-semibold text-gray-900 mb-4"
                data-testid="history-heading"
              >
                Conversation History
              </h2>

              <div
                className="flex flex-col gap-3 overflow-y-auto pr-1"
                style={{ maxHeight: "520px" }}
                data-testid="incident-detail-history"
              >
                {incident.history.length === 0 && (
                  <div
                    className="text-sm text-gray-400 text-center py-10"
                    data-testid="incident-detail-empty-history"
                  >
                    No conversation history.
                  </div>
                )}

                {incident.history.map((msg, i) => (
                  <div
                    key={msg._id ?? i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`detail-message-${msg.role}-${i}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-[#CC0000] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 mr-2">
                        P
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "rounded-tr-sm bg-[#CC0000] text-white"
                          : "rounded-tl-sm bg-white border border-gray-200 shadow-sm text-gray-800 border-l-[3px] border-l-[#CC0000]"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <SimpleMarkdown content={msg.content} />
                      ) : (
                        <p>{msg.content}</p>
                      )}

                      {/* Disabled controls in history */}
                      {msg.role === "assistant" && msg.controlMetadata?.options && msg.controlMetadata.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3" data-testid={`detail-controls-${i}`}>
                          {msg.controlMetadata.options.map((opt, j) => (
                            <button
                              key={j}
                              disabled
                              className="text-xs border border-[#CC0000]/30 text-[#CC0000] bg-[#CC0000]/5 rounded-lg px-3 py-1.5 opacity-60 cursor-not-allowed"
                              data-testid={`detail-control-option-${i}-${j}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Progress Timeline */}
            <ProgressTimeline status={incident.status} />

            {/* 3. Status-specific Details Card (with integrated feedback) */}
            {isTerminal && (
              <>
                {incident.status === "Escalated" && (
                  <EscalationDetailsCard incident={incident} />
                )}
                {incident.status === "Resolved" && (
                  <ResolutionDetailsCard incident={incident} />
                )}
              </>
            )}
          </div>

          {/* Right column (~30%) */}
          <div className="w-72 shrink-0 flex flex-col gap-5" data-testid="incident-detail-right-col">
            <CaseDetailsCard incident={incident} />
            <IdentifiersCard incident={incident} />
          </div>
        </div>
      </div>
    </div>
  );
}
