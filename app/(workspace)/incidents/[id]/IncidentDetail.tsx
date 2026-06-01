"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Incident } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Markdown } from "@/lib/markdown";
import { FeedbackCard } from "@/app/(workspace)/FeedbackCard";
import { formatDateTime, formatDate } from "@/lib/utils";

type Props = {
  incident: Incident;
};

export function IncidentDetail({ incident: initial }: Props) {
  const router = useRouter();
  const [incident, setIncident] = useState<Incident>(initial);

  const canResume = incident.status === "Open";
  const isTerminal =
    incident.status === "Escalated" || incident.status === "Resolved";

  function handleResume() {
    router.push(`/?incident=${incident.incidentId}`);
  }

  return (
    <main data-testid="incident-detail-page" className="flex-1 px-6 py-8 bg-[#FAFAFB]">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-5">
          <Link
            href="/incidents"
            data-testid="incident-detail-back-link"
            className="text-[13px] text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to incidents
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="mb-2">
              <StatusBadge status={incident.status} />
            </div>
            <h1
              data-testid="incident-detail-title"
              className="text-[28px] font-bold text-gray-900"
            >
              {incident.category} incident
            </h1>
            <p className="text-[13px] text-gray-500 mt-1 font-mono">
              {incident.incidentId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canResume ? (
              <Button
                data-testid="incident-detail-resume-btn"
                variant="primary"
                onClick={handleResume}
              >
                Resume Chat
              </Button>
            ) : null}
            <Button
              data-testid="incident-detail-view-chat-btn"
              variant="secondary"
              onClick={() => router.push(`/?incident=${incident.incidentId}`)}
            >
              View Chat
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left column — 70% */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Conversation history */}
            <Card padding="md" data-testid="incident-detail-conversation">
              <h3 className="text-[15px] font-semibold text-gray-900 mb-3">Conversation</h3>
              <div
                className="flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-1"
                data-testid="incident-detail-conversation-scroll"
              >
                {incident.conversationHistory.length === 0 ? (
                  <p className="text-[13px] text-gray-500">No messages yet.</p>
                ) : (
                  incident.conversationHistory.map((m, i) => (
                    <div
                      key={i}
                      data-testid={`detail-msg-${m.role}-${i}`}
                      className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                    >
                      <div
                        className={
                          m.role === "user"
                            ? "max-w-[80%] bg-patch-red text-white rounded-2xl rounded-tr-md px-4 py-2.5 text-[14px] shadow-sm"
                            : "max-w-[85%] bg-white border border-gray-200 border-l-[2px] border-l-patch-red rounded-2xl rounded-tl-md px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                        }
                      >
                        {m.role === "assistant" ? (
                          <Markdown source={m.content} />
                        ) : (
                          <span>{m.content}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Progress timeline */}
            <Card padding="md" data-testid="incident-detail-progress">
              <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Progress</h3>
              <ProgressTimeline status={incident.status} />
            </Card>

            {/* Status-specific details card */}
            {incident.status === "Escalated" && incident.escalationDetails ? (
              <EscalationDetailsCard incident={incident} />
            ) : null}
            {incident.status === "Resolved" && incident.resolutionDetails ? (
              <ResolutionDetailsCard incident={incident} />
            ) : null}

            {/* Feedback */}
            {isTerminal ? (
              <FeedbackCard incident={incident} onSubmitted={setIncident} />
            ) : null}
          </div>

          {/* Right column — 30% */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <Card padding="md" data-testid="incident-detail-case-card">
              <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Case Details</h3>
              <div className="grid grid-cols-1 gap-3 text-[13px]">
                {incident.escalationDetails ? (
                  <>
                    <DetailRow label="Priority" value={String(incident.escalationDetails.priority)} />
                    <DetailRow label="Type" value="Incident" />
                    <DetailRow label="Urgency" value={String(incident.escalationDetails.urgency)} />
                    <DetailRow label="Impact" value={String(incident.escalationDetails.impact)} />
                    <DetailRow label="Store" value={incident.category} />
                    <DetailRow label="Opened" value={formatDate(incident.createdAt)} />
                    <DetailRow label="Updated" value={formatDate(incident.updatedAt)} />
                  </>
                ) : (
                  <>
                    <DetailRow label="Type" value="Incident" />
                    <DetailRow label="Store" value={incident.category} />
                    <DetailRow label="Opened" value={formatDate(incident.createdAt)} />
                    <DetailRow label="Updated" value={formatDate(incident.updatedAt)} />
                  </>
                )}
              </div>
            </Card>

            <Card padding="md" data-testid="incident-detail-identifiers-card">
              <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Identifiers</h3>
              <div className="flex flex-col gap-3">
                <CopyField label="Incident ID" value={incident.incidentId} testid="copy-incident-id" />
                <CopyField label="Session ID" value={incident.incidentId} testid="copy-session-id" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function ProgressTimeline({ status }: { status: Incident["status"] }) {
  const steps = [
    { key: "Open", label: "Opened" },
    { key: "Escalated", label: "Escalated" },
    { key: "Resolved", label: "Resolved" },
  ];
  const reachedIdx = steps.findIndex((s) => s.key === status);
  return (
    <div
      className="flex items-center gap-2"
      data-testid="progress-timeline"
    >
      {steps.map((s, i) => {
        const reached = i <= reachedIdx;
        return (
          <div key={s.key} className="flex items-center gap-2 flex-1">
            <div
              data-testid={`progress-step-${s.key.toLowerCase()}`}
              className={[
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0",
                reached
                  ? "bg-patch-red text-white"
                  : "border border-gray-300 bg-white text-gray-400",
              ].join(" ")}
            >
              {i + 1}
            </div>
            <div
              className={[
                "text-[12px] font-medium",
                reached ? "text-gray-900" : "text-gray-400",
              ].join(" ")}
            >
              {s.label}
            </div>
            {i < steps.length - 1 ? (
              <div
                className={[
                  "flex-1 h-0.5 mx-1",
                  i < reachedIdx ? "bg-patch-red" : "bg-gray-200",
                ].join(" ")}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function EscalationDetailsCard({ incident }: { incident: Incident }) {
  const ed = incident.escalationDetails!;
  return (
    <Card padding="md" data-testid="incident-detail-escalation-card">
      <h3 className="text-[15px] font-semibold text-gray-900 mb-3">Escalation Details</h3>
      <div className="grid grid-cols-2 gap-3 text-[13px]">
        <DetailRow label="Reason" value={ed.reason} fullWidth />
        <DetailRow label="Priority" value={String(ed.priority)} />
        <DetailRow label="Urgency" value={String(ed.urgency)} />
        <DetailRow label="Impact" value={String(ed.impact)} />
        <DetailRow label="Group" value={ed.group} fullWidth />
        <DetailRow label="Escalated At" value={formatDateTime(ed.timestamp)} fullWidth />
      </div>
    </Card>
  );
}

function ResolutionDetailsCard({ incident }: { incident: Incident }) {
  const rd = incident.resolutionDetails!;
  return (
    <Card padding="md" data-testid="incident-detail-resolution-card">
      <h3 className="text-[15px] font-semibold text-gray-900 mb-3">Resolution Details</h3>
      <div className="grid grid-cols-2 gap-3 text-[13px]">
        <DetailRow label="Status" value="Resolved" />
        <DetailRow label="Resolved At" value={formatDateTime(rd.timestamp)} fullWidth />
        <DetailRow label="Summary" value={rd.summary} fullWidth />
      </div>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <Label className="block mb-0.5">{label}</Label>
      <div className="text-[13px] text-gray-900">{value || "—"}</div>
    </div>
  );
}

function CopyField({
  label,
  value,
  testid,
}: {
  label: string;
  value: string;
  testid: string;
}) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }
  return (
    <div>
      <Label className="block mb-0.5">{label}</Label>
      <div className="flex items-center gap-2">
        <code className="text-[12px] text-gray-700 truncate flex-1 font-mono">{value}</code>
        <button
          type="button"
          data-testid={testid}
          onClick={handleCopy}
          className="text-[11px] font-semibold text-patch-red hover:underline"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
