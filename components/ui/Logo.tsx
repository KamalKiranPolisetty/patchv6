export function PatchMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      data-testid="patch-mark"
      className={["inline-flex items-center justify-center rounded-full bg-patch-red text-white font-bold", className].join(" ")}
      style={{ width: size, height: size, fontSize: Math.floor(size * 0.55) }}
      aria-hidden
    >
      P
    </span>
  );
}

export function PatchLogo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2" data-testid="patch-logo">
      <PatchMark size={size} />
      <span className="text-[16px] font-semibold text-gray-900 tracking-tight">Patch</span>
    </div>
  );
}
