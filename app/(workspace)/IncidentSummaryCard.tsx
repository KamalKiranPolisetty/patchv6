"use client";

import Link from "next/link";
import type { Incident } from "@/lib/db";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";

type Props = {
  incident: Incident;
};

export function IncidentSummaryCard({ incident }: Props) {
  const isEscalated = incident.status === "Escalated";
  const ed = incident.escalationDetails;
  const rd = incident.resolutionDetails;

  return (
    <div
      data-testid="incident-summary-card"
      className={[
        "flex items-start gap-3 max-w-[85%] w-full",
      ].join(" ")}
    >
      <div className="w-7 flex-shrink-0" aria-hidden />
      <div
        className={[
          "flex-1 min-w-0 rounded-2xl border bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
          isEscalated ? "border-red-200" : "border-green-200",
        ].join(" ")}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={incident.status} />
            <span className="text-[12px] text-gray-500">
              {isEscalated ? "Escalated to Trusted Experts" : "Resolved"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
          <Field label="Incident #" value={incident.incidentId} mono />
          <Field label="Category" value={incident.category} />
          <Field
            label="Description"
            value={deriveDescription(incident)}
            fullWidth
          />
          <Field label="Created For" value={incident.category} />
          <Field label="Date" value={formatDateTime(incident.createdAt)} />

          {isEscalated && ed ? (
            <>
              <Field label="Status" value="Escalated" />
              <Field label="Reason" value={ed.reason} fullWidth />
              <Field label="Priority" value={String(ed.priority)} />
              <Field label="Urgency" value={String(ed.urgency)} />
              <Field label="Impact" value={String(ed.impact)} />
              <Field label="Support Group" value={ed.group} />
            </>
          ) : null}

          {!isEscalated && rd ? (
            <Field label="Status" value="Resolved" />
          ) : null}
        </div>

        <div className="mt-5 flex justify-end">
          <Link href={`/incidents/${incident.incidentId}`}>
            <Button
              data-testid="incident-summary-view-btn"
              variant="primary"
              size="sm"
            >
              View Incident
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  fullWidth,
}: {
  label: string;
  value: string;
  mono?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <Label className="block mb-0.5">{label}</Label>
      <div
        data-testid={`summary-field-${label.toLowerCase().replace(/\s+/g, "-")}`}
        className={[
          "text-[13px] text-gray-900",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function deriveDescription(incident: Incident): string {
  const firstUser = incident.conversationHistory.find((m) => m.role === "user");
  return firstUser?.content ?? "—";
}
