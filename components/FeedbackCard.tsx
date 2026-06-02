'use client';

import { useState } from 'react';
import StarRating from './StarRating';

interface FeedbackCardProps {
  incidentId: string;
  existingFeedback?: { rating?: number; comment?: string };
}

export default function FeedbackCard({ incidentId, existingFeedback }: FeedbackCardProps) {
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [comment, setComment] = useState(existingFeedback?.comment || '');
  const [submitted, setSubmitted] = useState(!!existingFeedback?.rating);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/incidents/${incidentId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError('Failed to submit feedback.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white" data-testid="feedback-card">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm">Rate this interaction</h3>

      {submitted ? (
        <div className="text-sm text-green-600 font-medium">
          Thank you for your feedback!
          {rating > 0 && (
            <div className="mt-1 text-gray-500">
              You rated this {rating}/5 star{rating !== 1 ? 's' : ''}.
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <StarRating value={rating} onChange={setRating} disabled={loading} />

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            data-testid="feedback-comment"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={!rating || loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:bg-gray-300 transition-colors"
            data-testid="feedback-submit-btn"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      )}
    </div>
  );
}
