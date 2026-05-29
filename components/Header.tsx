"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  onNewChat?: () => void;
}

export default function Header({ onNewChat }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [incidentCount, setIncidentCount] = useState(0);

  useEffect(() => {
    fetch("/api/incidents?status=Open")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setIncidentCount(data.length);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleNewChat() {
    if (onNewChat) {
      onNewChat();
    }
    if (pathname !== "/") {
      router.push("/");
    }
  }

  const isIncidentsActive = pathname.startsWith("/incidents");

  return (
    <header
      className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0"
      data-testid="app-header"
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" data-testid="header-logo-link">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-gray-900 text-base" data-testid="header-brand-name">
            Patch
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-1" data-testid="header-nav">
        <Link
          href="/incidents"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative ${
            isIncidentsActive
              ? "text-red-600 bg-red-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
          data-testid="nav-incidents-link"
        >
          Incidents
          {incidentCount > 0 && (
            <span
              className="bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
              data-testid="incidents-badge"
            >
              {incidentCount}
            </span>
          )}
          {isIncidentsActive && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
          )}
        </Link>

        <button
          onClick={handleNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          data-testid="new-chat-btn"
        >
          New Chat
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          data-testid="logout-btn"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
