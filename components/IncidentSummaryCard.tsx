import Link from "next/link";
import StatusBadge from "./StatusBadge";
import type { IncidentStatus, EscalationData } from "@/lib/types";

interface Props {
  incidentId: string;
  mongoId?: string;
  status: IncidentStatus;
  category: string;
  username: string;
  createdAt: string | Date;
  escalation?: EscalationData | null;
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

export default function IncidentSummaryCard({
  incidentId,
  mongoId,
  status,
  category,
  username,
  createdAt,
  escalation,
}: Props) {
  const date = new Date(createdAt).toLocaleString();

  return (
    <div
      className="mt-3 rounded-xl overflow-hidden"
      style={{ border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      data-testid="incident-summary-card"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: status === "Escalated" ? "#FEE2E2" : status === "Resolved" ? "#DCFCE7" : "#F9FAFB",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <span className="text-sm font-semibold" style={{ color: "#111111" }} data-testid="summary-incident-id">
          {incidentId}
        </span>
        <StatusBadge status={status} testId="summary-status-badge" />
      </div>

      {/* Grid */}
      <div className="p-4 bg-white grid grid-cols-2 gap-3" data-testid="summary-grid">
        <Field label="Category" value={category} />
        <Field label="Created For" value={username} />
        <Field label="Date" value={date} />
        <Field label="Status" value={status} />
        {escalation && (
          <>
            <Field label="Reason" value={escalation.reason} />
            <Field label="Priority" value={escalation.priority} />
            <Field label="Urgency" value={escalation.urgency} />
            <Field label="Impact" value={escalation.impact} />
            <Field label="Support Group" value={escalation.support_group} />
            <Field label="Configuration Item" value={escalation.configuration_item} />
          </>
        )}
      </div>

      {/* Action */}
      <div className="px-4 py-3 bg-white" style={{ borderTop: "1px solid #E5E7EB" }}>
        <Link
          href={`/incidents/${mongoId || incidentId}`}
          className="text-sm font-medium hover:underline"
          style={{ color: "#DC2626" }}
          data-testid="summary-view-incident-btn"
        >
          View Incident →
        </Link>
      </div>
    </div>
  );
}
