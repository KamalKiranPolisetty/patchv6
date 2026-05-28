import IncidentSummaryCard from './IncidentSummaryCard'
import FeedbackCard from './FeedbackCard'

interface EscalationResponseCardProps {
  incidentId: string
  category: string
  createdAt: Date | string
  createdFor?: string
  escalationReason?: string
  priority?: number
  urgency?: number
  impact?: number
  assignedGroup?: string
  existingFeedbackRating?: number
  existingFeedbackComments?: string
}

export default function EscalationResponseCard({
  incidentId,
  category,
  createdAt,
  createdFor,
  escalationReason,
  priority,
  urgency,
  impact,
  assignedGroup,
  existingFeedbackRating,
  existingFeedbackComments,
}: EscalationResponseCardProps) {
  return (
    <div className="p-4 bg-white border border-red-200 rounded-xl shadow-sm" data-testid="escalation-response-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-red-600 text-lg">⚠</span>
        <p className="text-sm text-gray-700 font-medium" data-testid="escalation-message">
          I wasn&apos;t able to resolve the issue. I&apos;m escalating this to our Trusted Experts for hands-on support.
        </p>
      </div>
      <IncidentSummaryCard
        incidentId={incidentId}
        category={category}
        status="Escalated"
        createdAt={createdAt}
        createdFor={createdFor}
        escalationReason={escalationReason}
        priority={priority}
        urgency={urgency}
        impact={impact}
        assignedGroup={assignedGroup}
      />
      <FeedbackCard
        incidentId={incidentId}
        existingRating={existingFeedbackRating}
        existingComments={existingFeedbackComments}
      />
    </div>
  )
}
