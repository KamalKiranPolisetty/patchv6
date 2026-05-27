"use client";

import { useState } from "react";

interface FeedbackComponentProps {
  incidentId: string;
  onSubmitted?: () => void;
}

export default function FeedbackComponent({ incidentId, onSubmitted }: FeedbackComponentProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!rating) return;
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackRating: rating }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      setError("Failed to submit feedback. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div data-testid="feedback-submitted" className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
        <p className="text-gray-600 text-sm">Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div data-testid="feedback-component" className="bg-gray-50 border border-gray-200 rounded-xl p-5">
      <p data-testid="feedback-prompt" className="text-gray-700 font-medium mb-3 text-sm">
        How was this experience? Your feedback helps us improve the AI Agent.
      </p>
      <div data-testid="star-rating" className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            data-testid={`star-${star}`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl transition-colors"
          >
            <span className={(hovered || rating) >= star ? "text-orange-400" : "text-gray-300"}>★</span>
          </button>
        ))}
      </div>
      {error && <p data-testid="feedback-error" className="text-red-500 text-xs mb-2">{error}</p>}
      <button
        data-testid="feedback-submit-btn"
        onClick={handleSubmit}
        disabled={!rating}
        className="px-4 py-2 bg-red-500 hover:bg-orange-500 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Submit Feedback
      </button>
    </div>
  );
}
