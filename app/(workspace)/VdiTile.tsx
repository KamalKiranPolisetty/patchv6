"use client";

type Props = {
  kbStatus: "KB Available" | "KB Missing";
  onClick: () => void;
};

export function VdiTile({ kbStatus, onClick }: Props) {
  return (
    <button
      type="button"
      data-testid="vdi-tile"
      onClick={onClick}
      className="group w-[220px] bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover-elevate hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
    >
      <div
        className="w-12 h-12 rounded-xl bg-patch-red-50 text-patch-red flex items-center justify-center mb-3 group-hover:bg-patch-red group-hover:text-white transition-colors"
        aria-hidden
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      </div>
      <span data-testid="vdi-tile-label" className="text-[15px] font-semibold text-gray-900 mb-2">
        VDI
      </span>
      <span
        data-testid="vdi-tile-kb-status"
        className={[
          "text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md",
          kbStatus === "KB Available"
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-red-100 text-red-800 border border-red-200",
        ].join(" ")}
      >
        {kbStatus}
      </span>
    </button>
  );
}
