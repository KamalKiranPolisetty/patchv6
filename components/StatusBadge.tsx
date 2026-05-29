interface StatusBadgeProps {
  status: "Open" | "Escalated" | "Resolved" | string;
}

const statusStyles: Record<string, string> = {
  Open: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Escalated: "bg-red-50 text-red-700 border-red-200",
  Resolved: "bg-green-50 text-green-700 border-green-200",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span
      data-testid={`status-badge-${status.toLowerCase()}`}
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide border ${style}`}
    >
      {status}
    </span>
  );
}
