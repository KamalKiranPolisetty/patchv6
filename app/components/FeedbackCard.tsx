'use client';

import { useState } from 'react';

interface FeedbackCardProps {
  incidentId: string;
  existingFeedback?: { rating: number; comment: string };
  readOnly?: boolean;
}

export default function FeedbackCard({ incidentId, existingFeedback, readOnly }: FeedbackCardProps) {
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(existingFeedback?.comment || '');
  const [submitted, setSubmitted] = useState(!!existingFeedback?.rating);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!rating) return;
    setLoading(true);
    try {
      await fetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: { rating, comment } }),
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div
      data-testid="feedback-card"
      style={{
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        padding: '14px 16px',
        marginTop: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span data-testid="feedback-heading" style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>Rate Your Experience</span>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>Optional</span>
      </div>

      <div data-testid="star-rating" style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            data-testid={`star-${star}`}
            onClick={() => !readOnly && !submitted && setRating(star)}
            onMouseEnter={() => !readOnly && !submitted && setHovered(star)}
            onMouseLeave={() => !readOnly && !submitted && setHovered(0)}
            disabled={readOnly || submitted}
            style={{
              background: 'none',
              border: 'none',
              cursor: readOnly || submitted ? 'default' : 'pointer',
              padding: 0,
              fontSize: 20,
              color: star <= (hovered || rating) ? '#DC2626' : '#D1D5DB',
              transition: 'color 0.1s',
            }}
          >
            ★
          </button>
        ))}
      </div>

      {!submitted ? (
        <>
          <textarea
            data-testid="feedback-comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Any additional feedback? (optional)"
            disabled={readOnly}
            rows={2}
            style={{
              width: '100%',
              border: '1px solid #E5E7EB',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 13,
              color: '#374151',
              resize: 'none',
              fontFamily: 'inherit',
              outline: 'none',
              background: '#fff',
              marginBottom: 8,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              data-testid="feedback-submit-btn"
              onClick={handleSubmit}
              disabled={!rating || loading || readOnly}
              style={{
                background: '#DC2626',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '5px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: !rating || loading ? 'not-allowed' : 'pointer',
                opacity: !rating ? 0.5 : 1,
              }}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </>
      ) : (
        <div data-testid="feedback-submitted" style={{ fontSize: 13, color: '#065F46', fontWeight: 500 }}>
          ✓ Thank you for your feedback!
          {comment && <p style={{ color: '#6B7280', marginTop: 4, fontWeight: 400 }}>&ldquo;{comment}&rdquo;</p>}
        </div>
      )}
    </div>
  );
}
