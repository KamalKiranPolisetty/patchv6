'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';

interface IncidentSummary {
  incidentId: string;
  status: 'Open' | 'Escalated' | 'Resolved';
  category: string;
  createdAt: string;
  updatedAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TABS = ['All', 'Open', 'Escalated', 'Resolved'] as const;

export default function IncidentListClient({ incidents, username }: { incidents: IncidentSummary[]; username: string }) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');

  const filtered = activeTab === 'All' ? incidents : incidents.filter(i => i.status === activeTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F9FAFB' }}>
      <Header username={username} />

      <main
        data-testid="incidents-page"
        style={{ flex: 1, maxWidth: 1280, width: '100%', margin: '0 auto', padding: '32px 24px' }}
      >
        <h1 data-testid="incidents-heading" style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 24 }}>
          My Incidents
        </h1>

        {/* Filter tabs */}
        <div data-testid="filter-tabs" style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E5E7EB', marginBottom: 20 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              data-testid={`tab-${tab.toLowerCase()}`}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #DC2626' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === tab ? 600 : 500,
                color: activeTab === tab ? '#DC2626' : '#6B7280',
                fontFamily: 'inherit',
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div data-testid="no-incidents" style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF', fontSize: 14 }}>
            No {activeTab === 'All' ? '' : activeTab.toLowerCase() + ' '}incidents found.
          </div>
        ) : (
          <div data-testid="incident-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(incident => (
              <div
                key={incident.incidentId}
                data-testid={`incident-item-${incident.incidentId}`}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span data-testid="incident-id" style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{incident.incidentId}</span>
                      <StatusBadge status={incident.status} />
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>
                      {incident.category || 'General'} · Updated {timeAgo(incident.updatedAt)}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/incidents/${incident.incidentId}`}
                  data-testid={`view-incident-${incident.incidentId}`}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    padding: '7px 16px',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#374151',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
