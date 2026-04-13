'use client';

import { Star } from 'lucide-react';

export function SpecialOfferCardStars() {
  return (
    <div className="mt-2 flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-[9.5px] w-[9.5px] shrink-0 fill-marco-yellow text-marco-yellow"
          strokeWidth={0}
          aria-hidden
        />
      ))}
    </div>
  );
}
