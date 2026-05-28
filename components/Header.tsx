"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user: { username?: string; email: string };
  onNewChat?: () => void;
}

export default function Header({ user, onNewChat }: HeaderProps) {
  const router = useRouter();
  const displayName = user.username || user.email.split("@")[0];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header
      data-testid="main-header"
      className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50"
    >
      <div className="flex items-center gap-3">
        <Link href="/" data-testid="header-logo-link" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-gray-900 text-lg">Patch</span>
        </Link>
      </div>

      <div className="hidden sm:block">
        <span data-testid="header-welcome" className="text-gray-600 text-sm">
          Welcome, <span className="font-medium text-gray-900">{displayName}</span>
        </span>
      </div>

      <nav className="flex items-center gap-2" data-testid="header-nav">
        <Link
          href="/incidents"
          data-testid="nav-incidents-link"
          className="px-3 py-1.5 text-sm text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
        >
          Incidents
        </Link>
        <button
          onClick={onNewChat}
          data-testid="nav-new-chat-btn"
          className="px-3 py-1.5 text-sm text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
        >
          New Chat
        </button>
        <button
          onClick={handleLogout}
          data-testid="nav-logout-btn"
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
