'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutGrid, List, PackageSearch, Bookmark } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { useSavedListings } from '@/hooks/useSavedListings';
import { StatusBadge } from '@/components/ui/Badge';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { SortSelect, type SortOption } from '@/components/search/SortSelect';
import { BookmarkButton } from './BookmarkButton';
import { ListingCard } from './ListingCard';
import { WhatsAppContactButton } from './WhatsAppContactButton';
import type { PublicListingCardDTO } from '@/types/api.types';

interface ListingFeedProps {
  listings: PublicListingCardDTO[];
  title: string;
  total: number;
  searchQuery?: string;
  emptyMessage?: string;
  currentSort?: SortOption;
}

export function ListingFeed({
  listings,
  title,
  total,
  searchQuery,
  emptyMessage = 'No items currently available matching your criteria.',
  currentSort = 'recent',
}: ListingFeedProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [savedOnly, setSavedOnly] = useState(false);
  const { savedIds, savedCount } = useSavedListings();

  const displayedListings = savedOnly
    ? listings.filter((item) => savedIds.includes(item.id))
    : listings;
  const displayedTotal = savedOnly ? displayedListings.length : total;

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Feed Header with View Toggle & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-neutral-900 flex items-center gap-1.5 truncate">
            <span className="truncate">{savedOnly ? 'Saved Items' : title}</span>
            <span className="text-xs font-normal text-neutral-400 shrink-0">({displayedTotal})</span>
          </h2>
          {searchQuery && !savedOnly && (
            <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 font-normal truncate">
              Results for &ldquo;<span className="text-neutral-800 font-medium">{searchQuery}</span>&rdquo;
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSavedOnly((prev) => !prev)}
            aria-pressed={savedOnly}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
              savedOnly
                ? 'bg-ug-navy text-white border-ug-navy'
                : 'bg-white text-neutral-600 border-neutral-200/90 hover:border-neutral-300'
            }`}
          >
            <Bookmark className="w-3 h-3" fill={savedOnly ? 'currentColor' : 'none'} />
            <span>Saved{savedCount > 0 ? ` (${savedCount})` : ''}</span>
          </button>

          <Suspense fallback={<div className="h-7 w-28 bg-neutral-100 rounded-lg animate-pulse" />}>
            <SortSelect currentSort={currentSort} />
          </Suspense>

          {/* Grid / List View Switcher */}
          <div
            role="group"
            aria-label="Layout view"
            className="inline-flex items-center bg-white border border-neutral-200/90 rounded-lg p-0.5 shadow-2xs"
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-ug-navy text-white'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="Compact list view"
              aria-pressed={viewMode === 'list'}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-ug-navy text-white'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {displayedListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-white border border-neutral-200/80 rounded-2xl shadow-2xs">
          <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
            <PackageSearch className="w-5 h-5 text-neutral-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-neutral-800 mb-1">
            {savedOnly ? 'No Saved Items Yet' : 'No Listings Found'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-xs mb-5 font-normal leading-relaxed">
            {savedOnly
              ? 'Tap the bookmark icon on any product card to save it here for quick access.'
              : emptyMessage}
          </p>
          {savedOnly ? (
            <button
              type="button"
              onClick={() => setSavedOnly(false)}
              className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-medium text-ug-navy bg-neutral-100 hover:bg-neutral-200/70 rounded-lg transition-colors cursor-pointer"
            >
              Show All Listings
            </button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-medium text-ug-navy bg-neutral-100 hover:bg-neutral-200/70 rounded-lg transition-colors"
            >
              View All Listings
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {displayedListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {displayedListings.map((listing) => {
            const whatsappUrl = buildWhatsAppUrl({
              whatsappNumber: listing.whatsapp_number,
              productTitle: listing.title,
              storeName: listing.seller_store_name,
            });

            return (
              <div
                key={listing.id}
                className="flex items-center gap-3 bg-white border border-neutral-200/80 rounded-xl p-2.5 hover:border-neutral-300 transition-colors shadow-2xs"
              >
                <Link
                  href={`/listings/${listing.slug}`}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-[#F7F7F7] shrink-0"
                >
                  {listing.primary_image_path ? (
                    <Image
                      src={listing.primary_image_path}
                      alt={listing.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      <CategoryIcon slug={listing.category_slug} className="w-5 h-5" />
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] text-neutral-500 truncate">
                      {listing.category_name}
                    </span>
                    <StatusBadge status={listing.availability_status} />
                  </div>

                  <Link href={`/listings/${listing.slug}`} className="block">
                    <h3 className="font-medium text-neutral-900 text-xs sm:text-sm line-clamp-1 hover:text-ug-navy transition-colors">
                      {listing.title}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-emerald-700 leading-none">
                        {formatPrice(listing.price, listing.currency, listing.price_negotiable)}
                      </p>
                      <Link
                        href={`/store/${listing.storefront_slug}`}
                        className="text-[11px] text-neutral-500 hover:text-ug-navy truncate block mt-1"
                      >
                        {listing.seller_store_name}
                      </Link>
                    </div>

                    <WhatsAppContactButton
                      listingId={listing.id}
                      whatsappUrl={whatsappUrl}
                      size="sm"
                      label="Chat"
                      className="shrink-0"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

