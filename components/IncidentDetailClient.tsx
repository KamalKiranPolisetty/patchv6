"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SimpleMarkdown from "@/components/SimpleMarkdown";

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

interface Incident {
  incidentId: string;
  status: "Open" | "Escalated" | "Resolved";
  category: string;
  history: HistoryMessage[];
  escalationDetails: Record<string, unknown> | null;
  resolutionDetails: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700 border-blue-200",
  Escalated: "bg-amber-50 text-amber-700 border-amber-200",
  Resolved: "bg-green-50 text-green-700 border-green-200",
};

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

  return (
    <div className="min-h-full bg-[#FAFAF8] px-6 py-10" data-testid="incident-detail-page">
      <div className="max-w-3xl mx-auto">
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

        {/* Header card */}
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
                  #{incident.incidentId}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[incident.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                  data-testid="incident-detail-status"
                >
                  {incident.status}
                </span>
              </div>
              <h1
                className="text-lg font-semibold text-gray-900 capitalize"
                data-testid="incident-detail-category"
              >
                {incident.category || "General"} Issue
              </h1>
              <p className="text-xs text-gray-400" data-testid="incident-detail-date">
                Created {new Date(incident.createdAt).toLocaleString("en-US", {
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

        {/* Conversation history */}
        <div className="flex flex-col gap-4" data-testid="incident-detail-history">
          {incident.history.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-10" data-testid="incident-detail-empty-history">
              No conversation history.
            </div>
          )}

          {incident.history.map((msg, i) => (
            <div
              key={msg._id ?? i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`detail-message-${msg.role}-${i}`}
            >
              {/* Avatar spacer for assistant */}
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-[#CC0000] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 mr-2">
                  P
                </div>
              )}

              <div
                className={`max-w-[80%] ${
                  msg.role === "user"
                    ? "rounded-2xl rounded-tr-sm bg-[#CC0000] text-white px-4 py-3 text-sm leading-relaxed"
                    : "rounded-2xl rounded-tl-sm bg-white border border-gray-200 shadow-sm px-4 py-3 text-sm leading-relaxed text-gray-800 border-l-2 border-l-[#CC0000]"
                }`}
              >
                {msg.role === "assistant" ? (
                  <SimpleMarkdown content={msg.content} />
                ) : (
                  <p>{msg.content}</p>
                )}

                {/* Render controls in read-only state */}
                {msg.role === "assistant" && msg.controlMetadata && (
                  <div className="mt-3" data-testid={`detail-controls-${i}`}>
                    {msg.controlMetadata.options && msg.controlMetadata.options.length > 0 && (
                      <div className="flex flex-wrap gap-2">
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
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Escalation details */}
        {incident.status === "Escalated" && incident.escalationDetails && (
          <div
            className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4"
            data-testid="incident-detail-escalation-card"
          >
            <h2 className="text-sm font-semibold text-amber-800 mb-2">Escalation Details</h2>
            <pre className="text-xs text-amber-700 whitespace-pre-wrap">
              {JSON.stringify(incident.escalationDetails, null, 2)}
            </pre>
          </div>
        )}

        {/* Resolution details */}
        {incident.status === "Resolved" && incident.resolutionDetails && (
          <div
            className="mt-6 bg-green-50 border border-green-200 rounded-xl px-5 py-4"
            data-testid="incident-detail-resolution-card"
          >
            <h2 className="text-sm font-semibold text-green-800 mb-2">Resolution Summary</h2>
            <p className="text-xs text-green-700">
              {(incident.resolutionDetails as { summary?: string }).summary ?? "Issue resolved."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
