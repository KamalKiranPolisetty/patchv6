"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface HeaderProps {
  username?: string;
  email?: string;
  onNewChat?: () => void;
}

export default function Header({ username, email, onNewChat }: HeaderProps) {
  const router = useRouter();
  const displayName = username || (email ? email.split("@")[0] : "User");

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header data-testid="app-header" className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div data-testid="header-logo-section" className="flex items-center gap-3">
        <div data-testid="patch-logo" className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">P</span>
        </div>
        <span data-testid="app-name" className="text-xl font-bold text-gray-900">Patch</span>
      </div>

      <div data-testid="header-welcome" className="text-gray-600 font-medium">
        Welcome, <span data-testid="username-display" className="text-gray-900">{displayName}</span>
      </div>

      <nav data-testid="header-actions" className="flex items-center gap-3">
        <Link
          href="/incidents"
          data-testid="incidents-link"
          className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
        >
          Incidents
        </Link>
        <button
          data-testid="new-chat-btn"
          onClick={onNewChat}
          className="px-4 py-2 bg-red-500 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          New Chat
        </button>
        <button
          data-testid="logout-btn"
          onClick={handleLogout}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
