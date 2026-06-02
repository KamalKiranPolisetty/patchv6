'use client';

import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export default function StarRating({ value, onChange, disabled }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1" data-testid="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl transition-colors ${
            star <= (hovered || value) ? 'text-yellow-400' : 'text-gray-300'
          } disabled:cursor-not-allowed`}
          data-testid={`star-${star}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
