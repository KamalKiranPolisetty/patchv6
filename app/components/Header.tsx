'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface HeaderProps {
  username?: string;
  onNewChat?: () => void;
}

export default function Header({ username, onNewChat }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [incidentCount, setIncidentCount] = useState(0);

  useEffect(() => {
    fetch('/api/incidents')
      .then(r => r.json())
      .then(d => setIncidentCount(d.incidents?.length || 0))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function handleNewChat() {
    if (onNewChat) {
      onNewChat();
    } else {
      router.push('/');
    }
  }

  return (
    <header
      data-testid="app-header"
      style={{
        height: 60,
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        justifyContent: 'space-between',
      }}
    >
      <Link href="/" data-testid="nav-logo-link" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div
          data-testid="logo-icon"
          style={{
            width: 34,
            height: 34,
            background: '#DC2626',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3h4.5a2.5 2.5 0 010 5H3V3z" fill="white" strokeWidth="1.5" stroke="white" strokeLinejoin="round"/>
            <path d="M3 8h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M3 11.5h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span data-testid="logo-text" style={{ fontWeight: 700, fontSize: 17, color: '#111827', letterSpacing: '-0.3px' }}>Patch</span>
      </Link>

      <nav data-testid="main-nav" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Link
          href="/incidents"
          data-testid="nav-incidents-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            textDecoration: 'none',
            color: pathname === '/incidents' ? '#DC2626' : '#374151',
            fontWeight: 500,
            fontSize: 14,
            borderBottom: pathname === '/incidents' ? '2px solid #DC2626' : '2px solid transparent',
            transition: 'color 0.15s',
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Incidents
          {incidentCount > 0 && (
            <span
              data-testid="incidents-badge"
              style={{
                background: '#DC2626',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 9,
                padding: '1px 6px',
                minWidth: 18,
                textAlign: 'center',
              }}
            >
              {incidentCount}
            </span>
          )}
        </Link>

        <button
          onClick={handleNewChat}
          data-testid="nav-new-chat-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#374151',
            fontWeight: 500,
            fontSize: 14,
            borderBottom: '2px solid transparent',
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>

        <button
          onClick={handleLogout}
          data-testid="nav-logout-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#374151',
            fontWeight: 500,
            fontSize: 14,
            borderBottom: '2px solid transparent',
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </nav>
    </header>
  );
}
