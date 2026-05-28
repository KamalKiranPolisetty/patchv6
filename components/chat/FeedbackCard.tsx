'use client'

import { useState } from 'react'

interface FeedbackCardProps {
  incidentId: string
  existingRating?: number
  existingComments?: string
}

export default function FeedbackCard({ incidentId, existingRating, existingComments }: FeedbackCardProps) {
  const [rating, setRating] = useState(existingRating || 0)
  const [hovered, setHovered] = useState(0)
  const [comments, setComments] = useState(existingComments || '')
  const [submitted, setSubmitted] = useState(!!existingRating)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!rating) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/incidents/${incidentId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comments }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit feedback')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const displayRating = submitted ? rating : (hovered || rating)

  return (
    <div className="mt-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm" data-testid="feedback-card">
      <h3 className="text-sm font-semibold text-gray-800 mb-3" data-testid="feedback-prompt">
        How was your experience with Patch?
      </h3>

      <div className="flex gap-1 mb-3" data-testid="feedback-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => !submitted && setRating(star)}
            onMouseEnter={() => !submitted && setHovered(star)}
            onMouseLeave={() => !submitted && setHovered(0)}
            disabled={submitted}
            className={`text-2xl transition-colors ${
              star <= displayRating ? 'text-yellow-400' : 'text-gray-300'
            } ${!submitted ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default'}`}
            data-testid={`feedback-star-${star}`}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>

      {!submitted ? (
        <>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Any additional comments? (optional)"
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-3"
            data-testid="feedback-comments-input"
          />
          {error && <p className="text-red-600 text-xs mb-2" data-testid="feedback-error">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={!rating || loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            data-testid="feedback-submit-btn"
          >
            {loading ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </>
      ) : (
        <div data-testid="feedback-submitted">
          {comments && (
            <p className="text-sm text-gray-600 italic mt-1" data-testid="feedback-comments-display">
              &ldquo;{comments}&rdquo;
            </p>
          )}
          <p className="text-green-600 text-sm font-medium mt-2" data-testid="feedback-thank-you">
            Thank you for your feedback!
          </p>
        </div>
      )}
    </div>
  )
}
