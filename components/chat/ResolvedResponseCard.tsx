import IncidentSummaryCard from './IncidentSummaryCard'
import FeedbackCard from './FeedbackCard'

interface ResolvedResponseCardProps {
  incidentId: string
  category: string
  createdAt: Date | string
  createdFor?: string
  existingFeedbackRating?: number
  existingFeedbackComments?: string
}

export default function ResolvedResponseCard({
  incidentId,
  category,
  createdAt,
  createdFor,
  existingFeedbackRating,
  existingFeedbackComments,
}: ResolvedResponseCardProps) {
  return (
    <div className="p-4 bg-white border border-green-200 rounded-xl shadow-sm" data-testid="resolved-response-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-green-600 text-lg">✓</span>
        <p className="text-sm text-gray-700 font-medium" data-testid="resolved-message">
          Glad I was able to help you resolve the issue! Here are the ticket details for your records.
        </p>
      </div>
      <IncidentSummaryCard
        incidentId={incidentId}
        category={category}
        status="Resolved"
        createdAt={createdAt}
        createdFor={createdFor}
      />
      <FeedbackCard
        incidentId={incidentId}
        existingRating={existingFeedbackRating}
        existingComments={existingFeedbackComments}
      />
    </div>
  )
}
