import React from 'react';
import { cn } from '@/lib/utils';
import type { ListingAvailabilityStatus } from '@/types/database.types';

export function StatusBadge({
  status,
  className,
}: {
  status: ListingAvailabilityStatus;
  className?: string;
}) {
  switch (status) {
    case 'AVAILABLE':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Available
        </span>
      );
    case 'NEEDS_CONFIRMATION':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Confirming
        </span>
      );
    case 'SOLD_OUT':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-500 border border-neutral-200/60',
            className
          )}
        >
          Sold Out
        </span>
      );
    case 'EXPIRED':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-400 border border-neutral-200/60',
            className
          )}
        >
          Expired
        </span>
      );
    case 'PAUSED':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200/60',
            className
          )}
        >
          Paused
        </span>
      );
    case 'DRAFT':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200/60',
            className
          )}
        >
          Draft
        </span>
      );
    case 'REMOVED':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-600 border border-rose-200/60',
            className
          )}
        >
          Removed
        </span>
      );
    default:
      return null;
  }
}
