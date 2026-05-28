"use client";

import { useState } from "react";

interface StarRatingProps {
  onRate: (rating: number) => void;
  submitted: boolean;
  value: number;
}

export default function StarRating({ onRate, submitted, value }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1" data-testid="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          data-testid={`star-${star}`}
          disabled={submitted}
          onClick={() => onRate(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl transition-colors disabled:cursor-default ${
            star <= (hovered || value)
              ? "text-yellow-400"
              : "text-gray-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
