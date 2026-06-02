'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface HeaderProps {
  incidentCount: number;
}

export default function Header({ incidentCount }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function handleNewChat() {
    router.push('/?newchat=1');
  }

  const isIncidentsActive = pathname.startsWith('/incidents');
  const isHomeActive = pathname === '/' || pathname === '';

  return (
    <header
      data-testid="header"
      className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-6 sticky top-0 z-50"
    >
      {/* Logo */}
      <Link href="/" data-testid="header-logo" className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">P</span>
        </div>
        <span className="font-bold text-gray-900 text-base">Patch</span>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-1 flex-1">
        <Link
          href="/incidents"
          data-testid="header-incidents-link"
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            isIncidentsActive
              ? 'text-red-600 border-b-2 border-red-600 rounded-none pb-[5px]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Incidents
          {incidentCount > 0 && (
            <span
              data-testid="incidents-badge"
              className="bg-red-600 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none"
            >
              {incidentCount}
            </span>
          )}
        </Link>

        <button
          onClick={handleNewChat}
          data-testid="header-new-chat-btn"
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            isHomeActive
              ? 'text-red-600 border-b-2 border-red-600 rounded-none pb-[5px]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          New Chat
        </button>
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        data-testid="header-logout-btn"
        className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
      >
        Logout
      </button>
    </header>
  );
}
