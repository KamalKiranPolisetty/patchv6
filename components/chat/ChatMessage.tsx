'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DecisionPanel, OptionChips } from './UIControls'
import ResolvedResponseCard from './ResolvedResponseCard'
import EscalationResponseCard from './EscalationResponseCard'

interface UIControl {
  uiControl?: 'decision' | 'chips'
  question?: string
  options?: string[]
  action?: 'resolve' | 'escalate'
  reason?: string
  assignedGroup?: string
}

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  onUIAction?: (action: string) => void
  incidentId?: string
  incidentStatus?: 'Open' | 'Escalated' | 'Resolved' | null
  category?: string
  createdAt?: Date | string
  createdFor?: string
  priority?: number
  urgency?: number
  impact?: number
  escalationReason?: string
  assignedGroup?: string
  existingFeedbackRating?: number
  existingFeedbackComments?: string
}

function parseUIControls(content: string): { text: string; controls: UIControl[] } {
  const controls: UIControl[] = []
  const text = content.replace(/```json\s*(\{[\s\S]*?\})\s*```/g, (_, jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr)
      controls.push(parsed)
    } catch {
      // ignore parse errors
    }
    return ''
  }).trim()
  return { text, controls }
}

export default function ChatMessage({
  role,
  content,
  onUIAction,
  incidentId,
  incidentStatus,
  category,
  createdAt,
  createdFor,
  priority,
  urgency,
  impact,
  escalationReason,
  assignedGroup,
  existingFeedbackRating,
  existingFeedbackComments,
}: ChatMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end mb-4" data-testid="user-message">
        <div className="max-w-[70%] bg-red-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
          {content}
        </div>
      </div>
    )
  }

  const { text, controls } = parseUIControls(content)

  const isResolved = incidentStatus === 'Resolved' && controls.some((c) => c.action === 'resolve')
  const isEscalated = incidentStatus === 'Escalated' && controls.some((c) => c.action === 'escalate')

  const decisionControl = controls.find((c) => c.uiControl === 'decision')
  const chipsControl = controls.find((c) => c.uiControl === 'chips')

  return (
    <div className="flex gap-3 mb-4" data-testid="assistant-message">
      <div className="flex-shrink-0 w-8 h-8 bg-black rounded-full flex items-center justify-center mt-1" data-testid="assistant-avatar">
        <span className="text-white font-bold text-xs">P</span>
      </div>
      <div className="flex-1 max-w-[80%]">
        {isResolved && incidentId && createdAt ? (
          <ResolvedResponseCard
            incidentId={incidentId}
            category={category || 'VDI'}
            createdAt={createdAt}
            createdFor={createdFor}
            existingFeedbackRating={existingFeedbackRating}
            existingFeedbackComments={existingFeedbackComments}
          />
        ) : isEscalated && incidentId && createdAt ? (
          <EscalationResponseCard
            incidentId={incidentId}
            category={category || 'VDI'}
            createdAt={createdAt}
            createdFor={createdFor}
            escalationReason={escalationReason}
            priority={priority}
            urgency={urgency}
            impact={impact}
            assignedGroup={assignedGroup}
            existingFeedbackRating={existingFeedbackRating}
            existingFeedbackComments={existingFeedbackComments}
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm" data-testid="assistant-bubble">
            <div className="prose prose-sm max-w-none text-gray-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            </div>
            {decisionControl && onUIAction && (
              <DecisionPanel
                question={decisionControl.question || 'Did that resolve your issue?'}
                onSelect={onUIAction}
              />
            )}
            {chipsControl && chipsControl.options && onUIAction && (
              <OptionChips options={chipsControl.options} onSelect={onUIAction} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
