import type { IncidentStatus } from "@/lib/db";

const styles: Record<IncidentStatus, string> = {
  Open: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  Escalated: "bg-red-100 text-red-800 border border-red-200",
  Resolved: "bg-green-100 text-green-800 border border-green-200",
};

export function StatusBadge({
  status,
  className = "",
}: {
  status: IncidentStatus | string;
  className?: string;
}) {
  const s = (styles as Record<string, string>)[status] ?? "bg-gray-100 text-gray-700 border border-gray-200";
  return (
    <span
      data-testid={`status-badge-${status.toLowerCase()}`}
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider",
        s,
        className,
      ].join(" ")}
    >
      {status}
    </span>
  );
}
