import type { IncidentStatus } from "@/lib/types";

const STYLES: Record<IncidentStatus, { bg: string; text: string }> = {
  Open: { bg: "#FEF9C3", text: "#92400E" },
  Escalated: { bg: "#FEE2E2", text: "#991B1B" },
  Resolved: { bg: "#DCFCE7", text: "#166534" },
};

export default function StatusBadge({
  status,
  testId,
}: {
  status: IncidentStatus;
  testId?: string;
}) {
  const s = STYLES[status] || STYLES.Open;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded font-semibold uppercase tracking-wide"
      style={{ fontSize: "10px", background: s.bg, color: s.text }}
      data-testid={testId || `status-badge-${status.toLowerCase()}`}
    >
      {status}
    </span>
  );
}
