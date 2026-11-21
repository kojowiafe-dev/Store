import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { StatusBadge } from '@/components/ui/Badge';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { BookmarkButton } from './BookmarkButton';
import { WhatsAppContactButton } from './WhatsAppContactButton';
import type { PublicListingCardDTO } from '@/types/api.types';

interface ListingCardProps {
  listing: PublicListingCardDTO;
  whatsappNumber?: string;
}

export function ListingCard({ listing, whatsappNumber }: ListingCardProps) {
  const resolvedWhatsapp = whatsappNumber ?? listing.whatsapp_number;
  const whatsappUrl = buildWhatsAppUrl({
    whatsappNumber: resolvedWhatsapp,
    productTitle: listing.title,
    storeName: listing.seller_store_name,
  });

  // Shorten hall display for compact mobile cards (e.g. "Jean Nelson AKA" instead of repeating "Hall")
  const locationLabel = listing.primary_pickup_spot
    ? listing.primary_pickup_spot.replace(/^Jean Nelson\s+/i, '')
    : listing.hall_name.replace(/\s+Hall$/i, '');

  return (
    <div className="group flex flex-col bg-white border border-neutral-200/80 rounded-xl overflow-hidden hover:border-neutral-300 transition-all duration-150 shadow-2xs">
      {/* Thumbnail Container */}
      <Link href={`/listings/${listing.slug}`} className="relative block aspect-square bg-[#F7F7F7] overflow-hidden">
        {listing.primary_image_path ? (
          <Image
            src={listing.primary_image_path}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-50/50 p-2 text-center select-none">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-neutral-200/60 flex items-center justify-center text-neutral-500 mb-1 shadow-2xs">
              <CategoryIcon slug={listing.category_slug} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500" />
            </div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-neutral-400 font-medium truncate max-w-[90%]">
              {listing.category_name}
            </span>
          </div>
        )}

        {/* Status Badge & Save Button */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
          <StatusBadge status={listing.availability_status} />
        </div>
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
          <BookmarkButton listingId={listing.id} />
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 flex flex-col p-2.5 sm:p-3.5 min-w-0">
        {/* Category tag & Hall with guaranteed non-overflow flex */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-400 mb-1 gap-1 min-w-0">
          <span className="font-normal text-neutral-500 truncate flex-1 min-w-0">
            {listing.category_name}
          </span>
          <span className="inline-flex items-center gap-0.5 text-neutral-400 shrink-0 text-[10px]">
            <MapPin className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
            <span className="truncate max-w-[72px] sm:max-w-[95px]">{locationLabel}</span>
          </span>
        </div>

        {/* Title */}
        <Link href={`/listings/${listing.slug}`} className="block">
          <h3 className="font-medium text-neutral-900 text-xs sm:text-sm line-clamp-2 leading-tight min-h-[2rem] sm:min-h-[2.3rem] group-hover:text-ug-navy transition-colors">
            {listing.title}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-1.5 mb-2.5">
          <p className="text-sm sm:text-[15px] font-semibold text-emerald-700 tracking-tight">
            {formatPrice(listing.price, listing.currency, listing.price_negotiable)}
          </p>
        </div>

        {/* Seller Info & WhatsApp CTA */}
        <div className="mt-auto pt-2 border-t border-neutral-100 flex items-center justify-between gap-2 min-w-0">
          <Link
            href={`/store/${listing.storefront_slug}`}
            className="text-[11px] text-neutral-500 hover:text-ug-navy font-normal truncate flex-1 min-w-0 transition-colors"
          >
            {listing.seller_store_name}
          </Link>

          <WhatsAppContactButton
            listingId={listing.id}
            whatsappUrl={whatsappUrl}
            size="sm"
            label="Chat"
            className="shrink-0 active:scale-[0.98] transition-transform"
          />
        </div>
      </div>
    </div>
  );
}
