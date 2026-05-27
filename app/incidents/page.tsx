'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Incident {
  incidentId: string;
  status: 'Open' | 'In Progress' | 'Escalated' | 'Resolved';
  category: string | null;
  createdAt: string;
  updatedAt: string;
  feedbackRating?: number;
}

const STATUS_FILTERS = ['All', 'Open', 'In Progress', 'Escalated', 'Resolved'];

function statusBadgeClass(status: string) {
  switch (status) {
    case 'Resolved': return 'bg-green-100 text-green-700';
    case 'Escalated': return 'bg-red-100 text-red-700';
    case 'In Progress': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const url = filter === 'All' ? '/api/incidents' : `/api/incidents?status=${encodeURIComponent(filter)}`;
    fetch(url)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) { router.push('/login'); return; }
        const data = await res.json();
        if (!cancelled) { setIncidents(data.incidents || []); setLoading(false); }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filter, router]);

  function handleResumeChat(incidentId: string) {
    router.push(`/?resume=${incidentId}`);
  }

  return (
    <div data-testid="incidents-page" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header data-testid="incidents-header" className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            data-testid="back-to-main-btn"
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-lg text-gray-900">Patch</span>
          </button>
        </div>
        <h1 data-testid="incidents-heading" className="text-lg font-semibold text-gray-900">
          Incidents
        </h1>
        <button
          data-testid="new-chat-btn"
          onClick={() => router.push('/')}
          className="px-4 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
        >
          New Chat
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Filters */}
        <nav data-testid="status-filters" className="flex gap-2 mb-6 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              data-testid={`filter-${s.toLowerCase().replace(' ', '-')}`}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
              }`}
            >
              {s}
            </button>
          ))}
        </nav>

        {/* Incidents List */}
        {loading ? (
          <div data-testid="incidents-loading" className="text-center py-12 text-gray-500">
            Loading incidents…
          </div>
        ) : incidents.length === 0 ? (
          <div data-testid="incidents-empty" className="text-center py-12 text-gray-500">
            No incidents found.
          </div>
        ) : (
          <div data-testid="incidents-list" className="space-y-3">
            {incidents.map((incident) => (
              <div
                key={incident.incidentId}
                data-testid="incident-card"
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span data-testid="incident-id" className="font-mono text-sm font-semibold text-gray-900">
                        {incident.incidentId}
                      </span>
                      <span
                        data-testid="incident-status-badge"
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadgeClass(incident.status)}`}
                      >
                        {incident.status}
                      </span>
                      {incident.category && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {incident.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Created {new Date(incident.createdAt).toLocaleDateString()} ·{' '}
                      Updated {new Date(incident.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      data-testid="view-incident-btn"
                      onClick={() => router.push(`/incidents/${incident.incidentId}`)}
                      className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View
                    </button>
                    {incident.status !== 'Resolved' && (
                      <button
                        data-testid="resume-chat-btn"
                        onClick={() => handleResumeChat(incident.incidentId)}
                        className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Resume Chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
