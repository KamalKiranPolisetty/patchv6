import Link from 'next/link'

interface IncidentSummaryCardProps {
  incidentId: string
  category: string
  status: 'Open' | 'Escalated' | 'Resolved'
  createdAt: Date | string
  createdFor?: string
  escalationReason?: string
  priority?: number
  urgency?: number
  impact?: number
  assignedGroup?: string
}

const statusColors: Record<string, string> = {
  Open: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Escalated: 'bg-red-100 text-red-800 border-red-200',
  Resolved: 'bg-green-100 text-green-800 border-green-200',
}

export default function IncidentSummaryCard({
  incidentId,
  category,
  status,
  createdAt,
  createdFor,
  escalationReason,
  priority,
  urgency,
  impact,
  assignedGroup,
}: IncidentSummaryCardProps) {
  const date = new Date(createdAt)

  return (
    <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden" data-testid="incident-summary-card">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <span className="font-semibold text-sm text-gray-800" data-testid="summary-incident-id">{incidentId}</span>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[status]}`}
          data-testid="summary-status-badge"
        >
          {status}
        </span>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-gray-500">Category</p>
          <p className="font-medium text-gray-800" data-testid="summary-category">{category || 'VDI'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Created</p>
          <p className="font-medium text-gray-800" data-testid="summary-date">
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {createdFor && (
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Created For</p>
            <p className="font-medium text-gray-800" data-testid="summary-created-for">{createdFor}</p>
          </div>
        )}
        {status === 'Escalated' && (
          <>
            {escalationReason && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Escalation Reason</p>
                <p className="font-medium text-gray-800" data-testid="summary-escalation-reason">{escalationReason}</p>
              </div>
            )}
            {priority !== undefined && (
              <div>
                <p className="text-xs text-gray-500">Priority</p>
                <p className="font-medium text-gray-800" data-testid="summary-priority">{priority}</p>
              </div>
            )}
            {urgency !== undefined && (
              <div>
                <p className="text-xs text-gray-500">Urgency</p>
                <p className="font-medium text-gray-800" data-testid="summary-urgency">{urgency}</p>
              </div>
            )}
            {impact !== undefined && (
              <div>
                <p className="text-xs text-gray-500">Impact</p>
                <p className="font-medium text-gray-800" data-testid="summary-impact">{impact}</p>
              </div>
            )}
            {assignedGroup && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Assignment Group</p>
                <p className="font-medium text-gray-800" data-testid="summary-assigned-group">{assignedGroup}</p>
              </div>
            )}
          </>
        )}
      </div>
      <div className="px-4 py-3 border-t border-gray-200">
        <Link
          href={`/incidents/${incidentId}`}
          className="text-sm text-red-600 hover:underline font-medium"
          data-testid="summary-view-details-link"
        >
          View Incident Details →
        </Link>
      </div>
    </div>
  )
}
