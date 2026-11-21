'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Minus,
  ShoppingBag,
  MessageCircle,
  X,
  MapPin,
  Package,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { buildMultiItemOrderWhatsAppUrl } from '@/lib/whatsapp';
import { StatusBadge } from '@/components/ui/Badge';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { BookmarkButton } from '@/components/listings/BookmarkButton';
import type { PublicListingCardDTO } from '@/types/api.types';

interface StorefrontOrderCatalogProps {
  listings: PublicListingCardDTO[];
  storeName: string;
  whatsappNumber: string;
  hallName: string;
  pickupSpot?: string | null;
  emptyMessage: string;
}

export function StorefrontOrderCatalog({
  listings,
  storeName,
  whatsappNumber,
  hallName,
  pickupSpot,
  emptyMessage,
}: StorefrontOrderCatalogProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  const increment = (id: string) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.min(20, (prev[id] ?? 0) + 1),
    }));
  };

  const decrement = (id: string) => {
    setQuantities((prev) => {
      const current = prev[id] ?? 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const clearOrder = () => {
    setQuantities({});
    setDrawerOpen(false);
  };

  const selectedItems = useMemo(() => {
    return listings
      .filter((item) => (quantities[item.id] ?? 0) > 0)
      .map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        currency: item.currency,
        quantity: quantities[item.id] ?? 0,
      }));
  }, [listings, quantities]);

  const totalCount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems]
  );

  const { knownTotal, hasUnpriced } = useMemo(() => {
    let total = 0;
    let unpriced = false;
    for (const item of selectedItems) {
      if (item.price !== null && Number.isFinite(item.price)) {
        total += item.price * item.quantity;
      } else {
        unpriced = true;
      }
    }
    return { knownTotal: total, hasUnpriced: unpriced };
  }, [selectedItems]);

  const orderWhatsAppUrl = useMemo(
    () =>
      buildMultiItemOrderWhatsAppUrl({
        whatsappNumber,
        storeName,
        items: selectedItems,
        hallName,
        pickupSpot,
      }),
    [whatsappNumber, storeName, selectedItems, hallName, pickupSpot]
  );

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-6 text-center bg-white rounded-2xl border border-neutral-200/80 shadow-2xs">
        <div className="w-11 h-11 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mb-3">
          <Package className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <p className="text-neutral-800 font-medium text-sm mb-1">Nothing here yet</p>
        <p className="text-neutral-400 text-xs max-w-xs font-normal leading-relaxed">
          {emptyMessage}
        </p>
      </div>
    );
  }

  const shortHallName = hallName.replace(/\s+Hall$/i, '');

  return (
    <div className={totalCount > 0 ? 'pb-24 sm:pb-20' : ''}>
      {/* Helper Tip */}
      <div className="mb-3 flex items-center justify-between gap-2 text-[11px] text-neutral-500 bg-neutral-50/90 border border-neutral-200/70 rounded-xl px-3 py-2">
        <span className="inline-flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5 text-ug-navy shrink-0" />
          <span>
            Tap <strong className="font-medium text-neutral-700">+ Add</strong> on multiple items to build one combined WhatsApp order message.
          </span>
        </span>
        {totalCount > 0 && (
          <button
            type="button"
            onClick={clearOrder}
            className="text-neutral-400 hover:text-neutral-700 font-medium shrink-0 cursor-pointer"
          >
            Clear ({totalCount})
          </button>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {listings.map((listing) => {
          const qty = quantities[listing.id] ?? 0;

          return (
            <div
              key={listing.id}
              className={`group flex flex-col bg-white border rounded-xl overflow-hidden transition-all duration-150 shadow-2xs ${
                qty > 0
                  ? 'border-ug-navy/50 ring-1 ring-ug-navy/15'
                  : 'border-neutral-200/80 hover:border-neutral-300'
              }`}
            >
              {/* Thumbnail */}
              <Link
                href={`/listings/${listing.slug}`}
                className="relative block aspect-square bg-[#F7F7F7] overflow-hidden"
              >
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
                      <CategoryIcon
                        slug={listing.category_slug}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500"
                      />
                    </div>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-neutral-400 font-medium truncate max-w-[90%]">
                      {listing.category_name}
                    </span>
                  </div>
                )}

                <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
                  <StatusBadge status={listing.availability_status} />
                </div>
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                  <BookmarkButton listingId={listing.id} />
                </div>
              </Link>

              {/* Card Body */}
              <div className="flex-1 flex flex-col p-2.5 sm:p-3.5 min-w-0">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-400 mb-1 gap-1 min-w-0">
                  <span className="font-normal text-neutral-500 truncate flex-1 min-w-0">
                    {listing.category_name}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-neutral-400 shrink-0 text-[10px]">
                    <MapPin className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                    <span className="truncate max-w-[65px] sm:max-w-[85px]">{shortHallName}</span>
                  </span>
                </div>

                <Link href={`/listings/${listing.slug}`} className="block">
                  <h3 className="font-medium text-neutral-900 text-xs sm:text-sm line-clamp-2 leading-tight min-h-[2rem] sm:min-h-[2.3rem] group-hover:text-ug-navy transition-colors">
                    {listing.title}
                  </h3>
                </Link>

                <div className="mt-1.5 mb-2.5">
                  <p className="text-sm sm:text-[15px] font-semibold text-emerald-700 tracking-tight">
                    {formatPrice(listing.price, listing.currency, listing.price_negotiable)}
                  </p>
                </div>

                {/* Multi-Item Order Builder Control */}
                <div className="mt-auto pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => increment(listing.id)}
                      className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ug-navy bg-ug-navy/5 hover:bg-ug-navy/10 border border-ug-navy/15 transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to enquiry</span>
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-between gap-1 bg-ug-navy text-white rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => decrement(listing.id)}
                        aria-label={`Remove one ${listing.title}`}
                        className="w-6 h-6 rounded-md bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-semibold tabular-nums">
                        {qty} in order
                      </span>
                      <button
                        type="button"
                        onClick={() => increment(listing.id)}
                        aria-label={`Add one more ${listing.title}`}
                        className="w-6 h-6 rounded-md bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating WhatsApp Multi-Item Order Summary Bar */}
      {totalCount > 0 && (
        <div className="fixed left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-xl bottom-[68px] sm:bottom-5 z-40">
          <div className="bg-ug-navy text-white rounded-2xl shadow-xl border border-white/10 overflow-hidden">
            {/* Expandable Order Line-Items */}
            {drawerOpen && (
              <div className="px-4 pt-3 pb-2 border-b border-white/10 max-h-52 overflow-y-auto space-y-2 bg-ug-navy-dark/50">
                <div className="flex items-center justify-between text-[11px] text-neutral-300">
                  <span className="font-medium">Selected Items for {storeName}</span>
                  <button
                    type="button"
                    onClick={clearOrder}
                    className="inline-flex items-center gap-1 text-neutral-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear all</span>
                  </button>
                </div>
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 text-xs py-1 border-t border-white/5"
                  >
                    <span className="truncate flex-1 text-neutral-100">
                      <span className="font-semibold text-emerald-300">{item.quantity}x</span>{' '}
                      {item.title}
                    </span>
                    <span className="text-neutral-300 shrink-0 tabular-nums">
                      {item.price !== null
                        ? `GH₵${(item.price * item.quantity).toFixed(2)}`
                        : 'Enquire'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Main Sticky Summary Row */}
            <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen((prev) => !prev)}
                className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[11px] text-neutral-300">
                    <span>
                      {totalCount} {totalCount === 1 ? 'item' : 'items'} selected
                    </span>
                    {drawerOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronUp className="w-3 h-3" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white truncate">
                    {knownTotal > 0
                      ? `GH₵${knownTotal.toFixed(2)}${hasUnpriced ? ' + enquiry' : ''}`
                      : 'Price on enquiry'}
                  </p>
                </div>
              </button>

              <a
                href={orderWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#128C7E] hover:bg-[#075E54] text-white transition-colors shadow-xs shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Order on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
