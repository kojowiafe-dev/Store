'use client';

import React, { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { takedownListing } from '@/actions/admin.actions';

export function TakedownButton({
  listingId,
  reason,
}: {
  listingId: string;
  reason: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleTakedown = () => {
    if (confirm('Are you sure you want to take down this listing immediately?')) {
      startTransition(async () => {
        await takedownListing(listingId, reason);
      });
    }
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleTakedown}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
    >
      <Trash2 className="w-3.5 h-3.5" />
      <span>{isPending ? 'Removing...' : 'Takedown Listing'}</span>
    </button>
  );
}

