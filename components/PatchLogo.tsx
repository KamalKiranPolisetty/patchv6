"use client";

interface PatchLogoProps {
  size?: number;
  showText?: boolean;
  textSize?: string;
}

export default function PatchLogo({ size = 36, showText = true, textSize = "text-xl" }: PatchLogoProps) {
  return (
    <div className="flex items-center gap-2.5" data-testid="patch-logo">
      {/* Red circular mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        data-testid="patch-logo-icon"
        aria-label="Patch logo"
      >
        <circle cx="18" cy="18" r="18" fill="#CC0000" />
        {/* Stylized P mark */}
        <path
          d="M12 10h7.5c2.485 0 4.5 2.015 4.5 4.5S21.985 19 19.5 19H15v7h-3V10z"
          fill="white"
        />
        <rect x="15" y="13" width="4" height="3" rx="1.5" fill="#CC0000" />
      </svg>

      {showText && (
        <span
          className={`${textSize} font-semibold tracking-tight text-gray-900`}
          data-testid="patch-logo-text"
        >
          Patch
        </span>
      )}
    </div>
  );
}
