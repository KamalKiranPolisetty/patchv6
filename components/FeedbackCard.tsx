"use client";

import { useState } from "react";

interface FeedbackCardProps {
  incidentId: string;
  existingFeedback?: { stars: number; comment: string } | null;
  /** If true, renders inside a card container (for detail page). Otherwise renders without outer card. */
  variant?: "standalone" | "inline";
}

export default function FeedbackCard({
  incidentId,
  existingFeedback,
  variant = "standalone",
}: FeedbackCardProps) {
  const [stars, setStars] = useState(existingFeedback?.stars ?? 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(existingFeedback?.comment ?? "");
  const [submitted, setSubmitted] = useState(
    typeof existingFeedback?.stars === "number" && existingFeedback.stars > 0
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (stars === 0 || submitting || submitted) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, comment }),
      });
      if (res.ok) setSubmitted(true);
    } catch {
      // silently fail — user can retry
    } finally {
      setSubmitting(false);
    }
  }

  const inner = (
    <>
      <div className="flex items-baseline gap-2 mb-1">
        <h3
          className="text-sm font-semibold text-gray-900"
          data-testid="feedback-heading"
        >
          Rate Your Experience
        </h3>
        <span
          className="text-xs text-gray-400"
          data-testid="feedback-optional-label"
        >
          Optional
        </span>
      </div>
      <p
        className="text-xs text-gray-500 mb-3"
        data-testid="feedback-subtitle"
      >
        Let us know how Patch handled your request.
      </p>

      {/* Stars */}
      <div className="flex gap-0.5 mb-3" data-testid="feedback-stars-row">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => !submitted && setStars(s)}
            onMouseEnter={() => !submitted && setHovered(s)}
            onMouseLeave={() => !submitted && setHovered(0)}
            disabled={submitted}
            className={`text-2xl leading-none transition-colors ${
              s <= (hovered || stars) ? "text-amber-400" : "text-gray-200"
            } disabled:cursor-default hover:scale-110 transition-transform`}
            data-testid={`feedback-star-${s}`}
            aria-label={`${s} star${s !== 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
      </div>

      {!submitted ? (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any additional comments? (optional)"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/40 resize-none text-gray-800 placeholder-gray-400 mb-3"
            rows={2}
            data-testid="feedback-comment-textarea"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={stars === 0 || submitting}
              className="text-sm font-semibold bg-[#CC0000] hover:bg-[#AA0000] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
              data-testid="feedback-submit-btn"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </>
      ) : (
        <div data-testid="feedback-submitted-view">
          <div className="flex gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`text-xl ${s <= stars ? "text-amber-400" : "text-gray-200"}`}
                data-testid={`feedback-submitted-star-${s}`}
              >
                ★
              </span>
            ))}
          </div>
          {comment && (
            <p
              className="text-xs text-gray-600 mb-2"
              data-testid="feedback-submitted-comment"
            >
              {comment}
            </p>
          )}
          <p
            className="text-xs text-green-600 font-medium"
            data-testid="feedback-thanks"
          >
            Thank you for your feedback!
          </p>
        </div>
      )}
    </>
  );

  if (variant === "inline") {
    return (
      <div className="pt-4 border-t border-gray-100" data-testid="feedback-card">
        {inner}
      </div>
    );
  }

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm"
      data-testid="feedback-card"
    >
      {inner}
    </div>
  );
}
