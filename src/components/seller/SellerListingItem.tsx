'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  Clock,
  Archive,
  Pencil,
} from 'lucide-react';
import {
  confirmAvailability,
  markSoldOut,
  pauseListing,
  resumeListing,
  deleteListing,
} from '@/actions/listing.actions';
import { formatPrice, formatRelativeDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import type { ListingAvailabilityStatus } from '@/types/database.types';

interface SellerListingItemProps {
  listing: {
    id: string;
    slug: string;
    title: string;
    price: number | null;
    currency: string;
    price_negotiable: boolean;
    availability_status: ListingAvailabilityStatus;
    confirm_before: string | null;
    expires_at: string | null;
    created_at: string;
  };
}

export function SellerListingItem({ listing }: SellerListingItemProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      await confirmAvailability(listing.id);
    });
  };

  const handleSoldOut = () => {
    startTransition(async () => {
      await markSoldOut(listing.id);
    });
  };

  const handlePause = () => {
    startTransition(async () => {
      await pauseListing(listing.id);
    });
  };

  const handleResume = () => {
    startTransition(async () => {
      await resumeListing(listing.id);
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this listing?')) {
      startTransition(async () => {
        await deleteListing(listing.id);
      });
    }
  };

  const isNeedsConfirmation = listing.availability_status === 'NEEDS_CONFIRMATION';
  const isAvailable = listing.availability_status === 'AVAILABLE';
  const isPaused = listing.availability_status === 'PAUSED';
  const isSoldOut = listing.availability_status === 'SOLD_OUT';
  const isExpired = listing.availability_status === 'EXPIRED';

  return (
    <div className="bg-white border border-neutral-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-1 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={listing.availability_status} />
          {listing.expires_at && (
            <span className="text-[11px] text-neutral-400 inline-flex items-center gap-1 font-normal">
              <Clock className="w-3 h-3 text-neutral-400" />
              <span>Expires {formatRelativeDate(listing.expires_at)}</span>
            </span>
          )}
        </div>

        <Link
          href={`/listings/${listing.slug}`}
          target="_blank"
          className="font-medium text-neutral-900 text-xs sm:text-sm hover:text-ug-navy inline-flex items-center gap-1.5 group transition-colors"
        >
          <span className="truncate">{listing.title}</span>
          <ExternalLink className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </Link>

        <p className="text-xs sm:text-sm font-bold text-emerald-700 tracking-tight">
          {formatPrice(listing.price, listing.currency, listing.price_negotiable)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 shrink-0">
        {/* Confirm Available Button */}
        {(isNeedsConfirmation || isAvailable) && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleConfirm}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isNeedsConfirmation
                ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200/70'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>{isNeedsConfirmation ? 'Confirm Stock' : 'Still Available'}</span>
          </button>
        )}

        {/* Sold out toggle */}
        {isAvailable && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleSoldOut}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-normal text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80 transition-colors"
          >
            <Archive className="w-3 h-3 text-neutral-500" />
            <span>Sold Out</span>
          </button>
        )}

        {/* Resume button */}
        {(isPaused || isSoldOut || isExpired) && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleResume}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-ug-navy text-white hover:bg-ug-navy-light transition-colors shadow-2xs"
          >
            <Play className="w-3 h-3" />
            <span>Restock / Resume</span>
          </button>
        )}

        {/* Pause button */}
        {isAvailable && (
          <button
            type="button"
            disabled={isPending}
            onClick={handlePause}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-normal text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80 transition-colors"
          >
            <Pause className="w-3 h-3 text-neutral-500" />
            <span>Pause</span>
          </button>
        )}

        {/* Edit */}
        <Link
          href={`/seller/listings/${listing.id}/edit`}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-ug-navy hover:bg-neutral-100 transition-colors"
          title="Edit listing"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Link>

        {/* Delete */}
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Delete listing"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
