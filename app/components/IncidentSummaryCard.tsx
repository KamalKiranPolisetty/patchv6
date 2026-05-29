'use client';

import Link from 'next/link';
import StatusBadge from './StatusBadge';

interface IncidentSummaryCardProps {
  incidentId: string;
  category: string;
  status: 'Open' | 'Escalated' | 'Resolved';
  createdAt: string;
  username: string;
  escalationData?: {
    category?: string;
    subcategory?: string;
    priority?: string;
    urgency?: string;
    impact?: string;
    reason?: string;
  };
}

export default function IncidentSummaryCard({
  incidentId,
  category,
  status,
  createdAt,
  username,
  escalationData,
}: IncidentSummaryCardProps) {
  return (
    <div
      data-testid="incident-summary-card"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        padding: '16px',
        marginTop: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>
            Incident Number
          </div>
          <div data-testid="summary-incident-id" style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{incidentId}</div>
        </div>
        <StatusBadge status={status} size="md" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 12 }}>
        <Field label="Category" value={escalationData?.category || category || '—'} testId="summary-category" />
        <Field label="Created For" value={username} testId="summary-created-for" />
        <Field label="Date / Time" value={new Date(createdAt).toLocaleString()} testId="summary-date" />
        {escalationData?.subcategory && <Field label="Subcategory" value={escalationData.subcategory} testId="summary-subcategory" />}
        {escalationData?.priority && <Field label="Priority" value={escalationData.priority} testId="summary-priority" />}
        {escalationData?.urgency && <Field label="Urgency" value={escalationData.urgency} testId="summary-urgency" />}
        {escalationData?.impact && <Field label="Impact" value={escalationData.impact} testId="summary-impact" />}
        {escalationData?.reason && <Field label="Reason" value={escalationData.reason} testId="summary-reason" />}
      </div>

      {status === 'Escalated' && (
        <div style={{ background: '#FEE2E2', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
          <span style={{ color: '#DC2626', fontSize: 12, fontWeight: 600 }}>
            Support Group: IT Escalation Team
          </span>
        </div>
      )}

      <Link
        href={`/incidents/${incidentId}`}
        data-testid="view-incident-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#FFFFFF',
          border: '1px solid #D1D5DB',
          borderRadius: 6,
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 500,
          color: '#374151',
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        View Incident
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

function Field({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div data-testid={testId} style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{value}</div>
    </div>
  );
}
