interface Props {
  status: "Open" | "Escalated" | "Resolved" | string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  Open: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Escalated: "bg-red-50 text-red-700 border-red-200",
  Resolved: "bg-green-50 text-green-700 border-green-200",
};

export default function StatusBadge({ status, className = "" }: Props) {
  const style = statusStyles[status] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${style} ${className}`}
      data-testid="status-badge"
    >
      {status}
    </span>
  );
}
