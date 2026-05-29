"use client";

import { useState } from "react";

interface Props {
  incidentId: string;
  existingFeedback?: { rating: number; comment: string } | null;
  onSubmitted?: () => void;
}

export default function FeedbackCard({ incidentId, existingFeedback, onSubmitted }: Props) {
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(existingFeedback?.comment || "");
  const [submitted, setSubmitted] = useState(!!existingFeedback);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!rating) return;
    setLoading(true);

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId, rating, comment }),
      });
      setSubmitted(true);
      onSubmitted?.();
    } finally {
      setLoading(false);
    }
  }

  const displayRating = hovered || rating;

  return (
    <div
      className="mt-4 p-4 rounded-xl"
      style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
      data-testid="feedback-card"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold" style={{ color: "#111111" }} data-testid="feedback-heading">
          Rate Your Experience
        </span>
        <span className="text-xs" style={{ color: "#9CA3AF" }} data-testid="feedback-optional-label">
          Optional
        </span>
      </div>
      <p className="text-sm mb-3" style={{ color: "#6B7280" }} data-testid="feedback-subtitle">
        Tell us how we did today.
      </p>

      {submitted ? (
        <div data-testid="feedback-submitted">
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg
                key={s}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={s <= rating ? "#DC2626" : "#E5E7EB"}
                data-testid={`feedback-star-display-${s}`}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          {comment && (
            <p className="text-sm" style={{ color: "#374151" }} data-testid="feedback-comment-display">
              &quot;{comment}&quot;
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-1 mb-3" data-testid="feedback-stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                data-testid={`feedback-star-${s}`}
                aria-label={`Rate ${s} star${s !== 1 ? "s" : ""}`}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={s <= displayRating ? "#DC2626" : "#E5E7EB"}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none resize-none"
            style={{ border: "1px solid #E5E7EB", color: "#111111", background: "#fff" }}
            data-testid="feedback-comment-input"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!rating || loading}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{
                background: !rating || loading ? "#F87171" : "#DC2626",
                cursor: !rating || loading ? "not-allowed" : "pointer",
              }}
              data-testid="feedback-submit-btn"
            >
              {loading ? "Saving…" : "Submit"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
