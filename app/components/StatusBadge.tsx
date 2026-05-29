'use client';

interface StatusBadgeProps {
  status: 'Open' | 'Escalated' | 'Resolved';
  size?: 'sm' | 'md';
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  Open: { bg: '#FEF3C7', color: '#92400E', label: 'OPEN' },
  Escalated: { bg: '#FEE2E2', color: '#DC2626', label: 'ESCALATED' },
  Resolved: { bg: '#D1FAE5', color: '#065F46', label: 'RESOLVED' },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Open;
  return (
    <span
      data-testid={`status-badge-${status.toLowerCase()}`}
      style={{
        background: style.bg,
        color: style.color,
        fontSize: size === 'md' ? 11 : 10,
        fontWeight: 600,
        letterSpacing: '0.06em',
        padding: size === 'md' ? '3px 10px' : '2px 7px',
        borderRadius: 4,
        textTransform: 'uppercase' as const,
        display: 'inline-block',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {style.label}
    </span>
  );
}
