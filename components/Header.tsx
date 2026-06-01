"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PatchLogo } from "@/components/ui/Logo";
import { useState } from "react";

export function Header({ incidentCount }: { incidentCount: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href) ?? false;
  }

  function handleNewChat() {
    // Tell the workspace to reset to the pre-chat landing state, then navigate.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("patch:new-chat"));
    }
    if (pathname !== "/") {
      router.push("/");
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <header
      data-testid="app-header"
      className="h-[60px] w-full bg-white border-b border-gray-200 flex items-center px-6 sticky top-0 z-30"
    >
      <div className="max-w-[1280px] w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          data-testid="header-logo-link"
          className="flex items-center gap-2 hover-elevate rounded px-1 -ml-1"
        >
          <PatchLogo size={28} />
        </Link>

        <nav className="flex items-center gap-1" data-testid="header-nav">
          <HeaderTab href="/" label="Home" active={isActive("/") && pathname === "/"} onClick={(e) => {
            e.preventDefault();
            handleNewChat();
          }} />
          <HeaderTab
            href="/incidents"
            label="Incidents"
            badge={incidentCount}
            active={isActive("/incidents")}
          />
          <button
            type="button"
            data-testid="header-new-chat-btn"
            onClick={handleNewChat}
            className={[
              "inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-[13px] font-medium text-gray-700 hover-elevate hover:bg-gray-100",
              isActive("/") && pathname === "/" ? "border-b-2 border-patch-red text-gray-900" : "",
            ].join(" ")}
          >
            <ComposeIcon />
            New Chat
          </button>
          <button
            type="button"
            data-testid="header-logout-btn"
            onClick={handleLogout}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-[13px] font-medium text-gray-700 hover-elevate hover:bg-gray-100 disabled:opacity-50"
          >
            <LogoutIcon />
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

function HeaderTab({
  href,
  label,
  badge,
  active,
  onClick,
}: {
  href: string;
  label: string;
  badge?: number;
  active: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      data-testid={`header-tab-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={[
        "relative inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-[13px] font-medium hover-elevate hover:bg-gray-100",
        active ? "text-gray-900" : "text-gray-700",
      ].join(" ")}
    >
      {label}
      {typeof badge === "number" ? (
        <span
          data-testid={`header-tab-${label.toLowerCase()}-badge`}
          className={[
            "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold",
            active ? "bg-patch-red text-white" : "bg-gray-200 text-gray-700",
          ].join(" ")}
        >
          {badge}
        </span>
      ) : null}
      {active ? (
        <span className="absolute left-2 right-2 -bottom-[10px] h-[2px] bg-patch-red rounded-t" />
      ) : null}
    </Link>
  );
}

function ComposeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
