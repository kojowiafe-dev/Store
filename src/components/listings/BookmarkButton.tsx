'use client';

import React from 'react';
import { Bookmark } from 'lucide-react';
import { useSavedListings } from '@/hooks/useSavedListings';

interface BookmarkButtonProps {
  listingId: string;
  className?: string;
}

export function BookmarkButton({ listingId, className = '' }: BookmarkButtonProps) {
  const { isSaved, toggleSaved } = useSavedListings();
  const saved = isSaved(listingId);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(listingId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? 'Remove from saved items' : 'Save item'}
      aria-pressed={saved}
      className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
        saved
          ? 'bg-ug-navy text-white border-ug-navy shadow-xs'
          : 'bg-white/90 backdrop-blur-xs text-neutral-600 border-neutral-200/80 hover:text-ug-navy'
      } ${className}`}
    >
      <Bookmark className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} strokeWidth={1.75} />
    </button>
  );
}

