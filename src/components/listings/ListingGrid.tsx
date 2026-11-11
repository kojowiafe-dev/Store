import React from 'react';
import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { ListingCard } from './ListingCard';
import type { PublicListingCardDTO } from '@/types/api.types';

interface ListingGridProps {
  listings: PublicListingCardDTO[];
  emptyMessage?: string;
}

export function ListingGrid({
  listings,
  emptyMessage = 'No items currently available matching your criteria.',
}: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-white border border-neutral-200/80 rounded-2xl shadow-2xs">
        <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
          <PackageSearch className="w-5 h-5 text-neutral-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold text-neutral-800 mb-1">No Listings Found</h3>
        <p className="text-xs text-neutral-500 max-w-xs mb-5 font-normal leading-relaxed">{emptyMessage}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-medium text-ug-navy bg-neutral-100 hover:bg-neutral-200/70 rounded-lg transition-colors"
        >
          View All Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
