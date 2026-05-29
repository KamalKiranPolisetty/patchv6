"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  incidentCount?: number;
  onNewChat?: () => void;
}

export default function Header({ incidentCount = 0, onNewChat }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleNewChat() {
    if (onNewChat) {
      onNewChat();
    }
    router.push("/");
  }

  const isIncidentsActive = pathname.startsWith("/incidents");

  return (
    <header
      className="flex items-center justify-between px-6 h-14 flex-shrink-0"
      style={{
        background: "#fff",
        borderBottom: "1px solid #E5E7EB",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
      data-testid="app-header"
    >
      {/* Logo + Name */}
      <Link
        href="/"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        data-testid="header-logo-link"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "#DC2626" }}
          data-testid="header-logo"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 3L14.5 8.5H20L15.5 12L17.5 18L12 14.5L6.5 18L8.5 12L4 8.5H9.5L12 3Z" fill="white" />
          </svg>
        </div>
        <span className="text-base font-bold" style={{ color: "#111111" }} data-testid="header-app-name">
          Patch
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-1" data-testid="header-nav">
        {/* Incidents */}
        <Link
          href="/incidents"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors relative"
          style={{
            color: isIncidentsActive ? "#DC2626" : "#6B7280",
            borderBottom: isIncidentsActive ? "2px solid #DC2626" : "2px solid transparent",
            borderRadius: 0,
          }}
          data-testid="header-incidents-link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Incidents
          {incidentCount > 0 && (
            <span
              className="ml-0.5 px-1.5 py-0.5 rounded-full text-white font-bold leading-none"
              style={{ fontSize: "10px", background: "#DC2626", minWidth: "18px", textAlign: "center" }}
              data-testid="header-incident-badge"
            >
              {incidentCount}
            </span>
          )}
        </Link>

        {/* New Chat */}
        <button
          type="button"
          onClick={handleNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
          style={{ color: "#6B7280" }}
          data-testid="header-new-chat-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          New Chat
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
          style={{ color: "#6B7280" }}
          data-testid="header-logout-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Logout
        </button>
      </nav>
    </header>
  );
}
