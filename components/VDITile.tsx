"use client";

interface Props {
  kbAvailable: boolean;
  onClick: () => void;
}

export default function VDITile({ kbAvailable, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-6 rounded-xl cursor-pointer transition-all duration-150 hover:scale-105"
      style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        minWidth: "160px",
      }}
      data-testid="vdi-tile"
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: "#FEF2F2" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="3" width="20" height="14" rx="2" stroke="#DC2626" strokeWidth="1.5" fill="none" />
          <path d="M8 21h8M12 17v4" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="5" y="6" width="14" height="8" rx="1" fill="#FEE2E2" />
        </svg>
      </div>

      <span className="text-sm font-semibold" style={{ color: "#111111" }} data-testid="vdi-tile-label">
        VDI
      </span>

      <span
        className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{
          background: kbAvailable ? "#DCFCE7" : "#FEE2E2",
          color: kbAvailable ? "#166534" : "#991B1B",
        }}
        data-testid="vdi-kb-badge"
      >
        {kbAvailable ? "KB Available" : "KB Missing"}
      </span>
    </button>
  );
}
