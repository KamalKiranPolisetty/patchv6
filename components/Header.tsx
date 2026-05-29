"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onNewChat?: () => void;
}

export default function Header({ onNewChat }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const displayName =
    (session?.user as { username?: string })?.username ||
    session?.user?.email?.split("@")[0] ||
    "User";

  function handleNewChat() {
    if (onNewChat) {
      onNewChat();
    } else {
      router.push("/");
    }
  }

  function handleLogout() {
    signOut({ callbackUrl: "/login" });
  }

  return (
    <header
      data-testid="app-header"
      className="fixed top-0 left-0 right-0 z-50 h-14 bg-red-600 flex items-center px-6 shadow-md"
      style={{ minHeight: "56px" }}
    >
      <div className="flex items-center flex-1">
        <Link href="/" data-testid="header-logo-link" className="flex items-center gap-2 text-white no-underline">
          <div
            data-testid="header-logo"
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-red-600 text-sm"
          >
            P
          </div>
          <span data-testid="header-app-name" className="text-white font-bold text-lg tracking-tight">
            Patch
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {session?.user && (
          <span data-testid="header-username" className="text-white text-sm mr-2 font-medium">
            {displayName}
          </span>
        )}

        <Link
          href="/incidents"
          data-testid="header-incidents-btn"
          className="bg-white border border-gray-200 text-gray-800 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Incidents
        </Link>

        <button
          onClick={handleNewChat}
          data-testid="header-new-chat-btn"
          className="bg-white border border-gray-200 text-gray-800 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          New Chat
        </button>

        <button
          onClick={handleLogout}
          data-testid="header-logout-btn"
          className="bg-white border border-gray-200 text-gray-800 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
