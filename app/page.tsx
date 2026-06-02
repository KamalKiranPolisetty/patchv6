'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import Header from '@/components/Header';

function AuthenticatedApp() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [checked, setChecked] = useState(false);
  const [incidentCount, setIncidentCount] = useState(0);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => {
        if (r.status === 401) {
          router.push('/login');
          return null;
        }
        return r.json();
      })
      .then((d: { username?: string } | null) => {
        if (d?.username) {
          setUsername(d.username);
          setChecked(true);
          // Fetch incident count
          return fetch('/api/incidents');
        }
        return null;
      })
      .then((r) => (r ? r.json() : null))
      .then((d: { incidents?: unknown[] } | null) => {
        if (d?.incidents) setIncidentCount(d.incidents.length);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm bg-gray-50">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header incidentCount={incidentCount} />
      <main className="flex-1 flex flex-col">
        <ChatInterface username={username} />
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm bg-gray-50">
          Loading...
        </div>
      }
    >
      <AuthenticatedApp />
    </Suspense>
  );
}
