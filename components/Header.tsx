"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface HeaderProps {
  onNewChat?: () => void;
}

export default function Header({ onNewChat }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [incidentCount, setIncidentCount] = useState(0);

  useEffect(() => {
    fetch("/api/incidents?status=Open")
      .then((r) => r.json())
      .then((d) => setIncidentCount(d.incidents?.length || 0))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleNewChat() {
    if (pathname !== "/") {
      router.push("/");
    } else {
      onNewChat?.();
    }
  }

  const isIncidents = pathname.startsWith("/incidents");
  const isHome = pathname === "/";

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-50 bg-white border-b border-gray-200"
      style={{ height: "60px" }}
    >
      <div
        className="mx-auto flex items-center justify-between h-full px-6"
        style={{ maxWidth: "1280px" }}
      >
        {/* Logo */}
        <Link href="/" data-testid="logo-link" className="flex items-center gap-2">
          <div
            data-testid="logo-icon"
            className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center"
          >
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-gray-900 text-base">Patch</span>
        </Link>

        {/* Nav */}
        <nav data-testid="header-nav" className="flex items-center gap-1">
          <Link
            href="/incidents"
            data-testid="nav-incidents-link"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isIncidents
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Incidents
            {incidentCount > 0 && (
              <span
                data-testid="incidents-badge"
                className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full"
              >
                {incidentCount}
              </span>
            )}
          </Link>

          <button
            onClick={handleNewChat}
            data-testid="nav-new-chat-btn"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isHome && !isIncidents
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>

          <button
            onClick={handleLogout}
            data-testid="nav-logout-btn"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
