import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';

interface EscalationData {
  reason?: string;
  group?: string;
  priority?: string;
  urgency?: string;
  impact?: string;
  timestamp?: Date | string;
}

interface ResolutionData {
  timestamp?: Date | string;
  summary?: string;
}

interface SummaryCardProps {
  type: 'escalation' | 'resolution';
  incidentId: string;
  escalationData?: EscalationData;
  resolutionData?: ResolutionData;
}

export default function SummaryCard({
  type,
  incidentId,
  escalationData,
  resolutionData,
}: SummaryCardProps) {
  if (type === 'escalation' && escalationData) {
    return (
      <div className="border border-orange-200 bg-orange-50 rounded-xl p-4 mt-4" data-testid="summary-card-escalation">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-orange-600 font-bold text-base">⚠</span>
          <span className="font-semibold text-orange-700 text-sm">Escalated to IT Team</span>
        </div>
        {escalationData.reason && (
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Reason:</span> {escalationData.reason}
          </p>
        )}
        {escalationData.group && (
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Group:</span> {escalationData.group}
          </p>
        )}
        <div className="flex gap-4 text-xs text-gray-500 mt-2">
          {escalationData.priority && <span>Priority: {escalationData.priority}</span>}
          {escalationData.urgency && <span>Urgency: {escalationData.urgency}</span>}
          {escalationData.impact && <span>Impact: {escalationData.impact}</span>}
        </div>
        {escalationData.timestamp && (
          <p className="text-xs text-gray-400 mt-2">
            {formatDateTime(escalationData.timestamp)}
          </p>
        )}
        <Link
          href={`/incidents/${incidentId}`}
          className="inline-block mt-3 text-sm text-red-600 font-medium hover:underline"
        >
          View Incident →
        </Link>
      </div>
    );
  }

  if (type === 'resolution' && resolutionData) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-xl p-4 mt-4" data-testid="summary-card-resolution">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-600 font-bold text-base">✓</span>
          <span className="font-semibold text-green-700 text-sm">Issue Resolved</span>
        </div>
        {resolutionData.summary && (
          <p className="text-sm text-gray-700 mb-1 line-clamp-3">{resolutionData.summary}</p>
        )}
        {resolutionData.timestamp && (
          <p className="text-xs text-gray-400 mt-2">
            {formatDateTime(resolutionData.timestamp)}
          </p>
        )}
        <Link
          href={`/incidents/${incidentId}`}
          className="inline-block mt-3 text-sm text-red-600 font-medium hover:underline"
        >
          View Incident →
        </Link>
      </div>
    );
  }

  return null;
}
