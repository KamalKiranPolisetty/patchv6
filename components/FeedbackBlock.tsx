"use client";
import { useState } from "react";

interface Props {
  incidentId: string;
  existingFeedback?: { rating: number; comments: string } | null;
  onSubmit?: (feedback: { rating: number; comments: string }) => void;
}

export default function FeedbackBlock({ incidentId, existingFeedback, onSubmit }: Props) {
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [comments, setComments] = useState(existingFeedback?.comments || "");
  const [submitted, setSubmitted] = useState(!!existingFeedback?.rating);
  const [hoveredStar, setHoveredStar] = useState(0);

  async function handleSubmit() {
    if (!rating) return;
    const feedback = { rating, comments };

    try {
      await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      setSubmitted(true);
      onSubmit?.(feedback);
    } catch (err) {
      console.error("Feedback submit error:", err);
    }
  }

  return (
    <div
      className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4"
      data-testid="feedback-block"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-900" data-testid="feedback-heading">
          Rate Your Experience
        </span>
        <span className="text-xs text-gray-400" data-testid="feedback-optional-label">
          Optional
        </span>
      </div>

      <div className="flex items-center gap-1 mb-3" data-testid="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !submitted && setRating(star)}
            onMouseEnter={() => !submitted && setHoveredStar(star)}
            onMouseLeave={() => !submitted && setHoveredStar(0)}
            disabled={submitted}
            className={`text-2xl transition-colors ${
              star <= (hoveredStar || rating) ? "text-yellow-400" : "text-gray-300"
            } disabled:cursor-default`}
            data-testid={`star-${star}`}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
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
            placeholder="Optional comments..."
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-3"
            data-testid="feedback-comments-input"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!rating}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              data-testid="feedback-submit-btn"
            >
              Submit
            </button>
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-500 italic" data-testid="feedback-submitted-message">
          Thank you for your feedback!
          {comments && <span className="block text-xs mt-1">&ldquo;{comments}&rdquo;</span>}
        </div>
      )}
    </div>
  );
}
