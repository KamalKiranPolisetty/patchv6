"use client";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import FeedbackBlock from "./FeedbackBlock";
import type { Incident } from "@/types";

interface Props {
  incident: Incident;
  message: string;
  showFeedback?: boolean;
}

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

export default function IncidentSummaryCard({ incident, message, showFeedback = true }: Props) {
  const isEscalated = incident.status === "Escalated";
  const isResolved = incident.status === "Resolved";

  const borderColor = isEscalated
    ? "border-red-200"
    : isResolved
    ? "border-green-200"
    : "border-gray-200";

  return (
    <div
      className="mt-3 space-y-3"
      data-testid="incident-summary-card-wrapper"
    >
      <p className="text-sm text-gray-700" data-testid="resolution-escalation-message">
        {message}
      </p>

      <div
        className={`bg-white border ${borderColor} rounded-xl p-5 shadow-sm`}
        data-testid="incident-summary-card"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
              Incident
            </p>
            <p
              className="text-base font-bold text-gray-900"
              data-testid="summary-incident-number"
            >
              {incident.incidentNumber}
            </p>
          </div>
          <StatusBadge status={incident.status} />
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
              Category
            </p>
            <p className="text-gray-900" data-testid="summary-category">
              {incident.category}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
              Created For
            </p>
            <p className="text-gray-900" data-testid="summary-username">
              {incident.username}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
              Date / Time
            </p>
            <p className="text-gray-900" data-testid="summary-created-at">
              {formatDate(incident.createdAt)}
            </p>
          </div>

          {isEscalated && incident.escalationDetails && (
            <>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
                  Priority
                </p>
                <p className="text-gray-900" data-testid="summary-priority">
                  {incident.escalationDetails.priority}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
                  Urgency
                </p>
                <p className="text-gray-900" data-testid="summary-urgency">
                  {incident.escalationDetails.urgency}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
                  Impact
                </p>
                <p className="text-gray-900" data-testid="summary-impact">
                  {incident.escalationDetails.impact}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
                  Reason
                </p>
                <p className="text-gray-900" data-testid="summary-reason">
                  {incident.escalationDetails.reason}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
                  Support Group
                </p>
                <p className="text-gray-900" data-testid="summary-support-group">
                  {incident.escalationDetails.supportGroup || "VDI Infrastructure Team"}
                </p>
              </div>
            </>
          )}
        </div>

        <Link
          href={`/incidents/${incident._id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:underline"
          data-testid="view-incident-btn"
        >
          View Incident →
        </Link>
      </div>

      {showFeedback && (
        <FeedbackBlock
          incidentId={incident._id}
          existingFeedback={incident.feedback}
        />
      )}
    </div>
  );
}
