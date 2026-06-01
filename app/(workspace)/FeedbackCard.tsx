"use client";

import { useState } from "react";
import type { Incident } from "@/lib/db";
import { Button } from "@/components/ui/Button";

type Props = {
  incident: Incident;
  onSubmitted: (incident: Incident) => void;
};

export function FeedbackCard({ incident, onSubmitted }: Props) {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existing = incident.feedback;

  async function handleSubmit() {
    if (rating < 1) {
      setError("Please pick a rating before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/incidents/${incident.incidentId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save feedback.");
        return;
      }
      onSubmitted(data.incident);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (existing) {
    return (
      <div
        data-testid="feedback-card"
        className="flex items-start gap-3 max-w-[85%] w-full"
      >
        <div className="w-7 flex-shrink-0" aria-hidden />
        <div
          data-testid="feedback-card-readonly"
          className="flex-1 min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-[13px] font-semibold text-gray-900">
              Rate Your Experience
            </h4>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
              Submitted
            </span>
          </div>
          <p className="text-[12px] text-gray-500 mb-2">Tell us how we did today.</p>
          <div className="flex items-center gap-1 mb-2" data-testid="feedback-stars-display">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                data-testid={`feedback-star-display-${n}`}
                className={[
                  "text-[20px]",
                  n <= existing.rating ? "text-yellow-400" : "text-gray-300",
                ].join(" ")}
              >
                ★
              </span>
            ))}
          </div>
          {existing.comment ? (
            <p data-testid="feedback-comment-display" className="text-[13px] text-gray-700 italic">
              “{existing.comment}”
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="feedback-card"
      className="flex items-start gap-3 max-w-[85%] w-full"
    >
      <div className="w-7 flex-shrink-0" aria-hidden />
      <div
        data-testid="feedback-card-form"
        className="flex-1 min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
      >
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-[13px] font-semibold text-gray-900" data-testid="feedback-heading">
            Rate Your Experience
          </h4>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
            Optional
          </span>
        </div>
        <p className="text-[12px] text-gray-500 mb-3" data-testid="feedback-subtitle">
          Tell us how we did today.
        </p>

        <div className="flex items-center gap-1 mb-3" data-testid="feedback-stars-input">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= (hover || rating);
            return (
              <button
                key={n}
                type="button"
                data-testid={`feedback-star-${n}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className={[
                  "star-btn text-[22px] leading-none",
                  filled ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300",
                ].join(" ")}
                aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
              >
                ★
              </button>
            );
          })}
          <span className="text-[12px] text-gray-500 ml-2" data-testid="feedback-rating-value">
            {rating > 0 ? `${rating}/5` : ""}
          </span>
        </div>

        <textarea
          data-testid="feedback-comment-input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="Add an optional comment…"
          className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-patch-red/30 focus:border-patch-red"
        />

        {error ? (
          <div
            data-testid="feedback-error"
            role="alert"
            className="mt-2 rounded-md border border-red-200 bg-red-50 text-red-800 text-[12px] px-3 py-2"
          >
            {error}
          </div>
        ) : null}

        <div className="flex justify-end mt-3">
          <Button
            type="button"
            data-testid="feedback-submit-btn"
            size="sm"
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || rating < 1}
          >
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        </div>

        <div className="mt-3 text-[11px] text-gray-400 italic">
          You can also leave feedback from the incident detail page.
        </div>
      </div>
    </div>
  );
}
