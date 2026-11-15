import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Store,
  Clock,
  ShieldAlert,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { getListingBySlug } from '@/repositories/listing.repository';
import { formatPrice, formatRelativeDate } from '@/lib/utils';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { StatusBadge } from '@/components/ui/Badge';
import { ListingImageGallery } from '@/components/listings/ListingImageGallery';
import { WhatsAppContactButton } from '@/components/listings/WhatsAppContactButton';
import { ReportModal } from '@/components/listings/ReportModal';
import { ShareButton } from '@/components/ui/ShareButton';

interface ListingPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ListingDetailPage({ params }: ListingPageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const whatsappUrl = buildWhatsAppUrl({
    whatsappNumber: listing.whatsapp_number,
    productTitle: listing.title,
    storeName: listing.seller_store_name,
  });

  const isNeedsConfirmation = listing.availability_status === 'NEEDS_CONFIRMATION';

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5 pb-16 sm:pb-0">
      {/* Top navigation row with back button and share */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-normal text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to listings</span>
        </Link>
        <ShareButton
          title={`${listing.title} — Campus Store`}
          text={`Check out "${listing.title}" on Campus Store (${listing.hall_name}):`}
          url={`/listings/${listing.slug}`}
          label="Share"
          variant="secondary"
        />
      </div>

      <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs">
        {/* Gallery / Image Showcase */}
        <div className="relative p-3 sm:p-4 bg-white">
          <ListingImageGallery
            images={listing.images ?? []}
            title={listing.title}
            categorySlug={listing.category_slug}
            categoryName={listing.category_name}
          />
          {/* Availability badge floating on media */}
          <div className="absolute top-6 left-6 z-10">
            <StatusBadge status={listing.availability_status} />
          </div>
        </div>

        {/* Core Details Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Category & Hall Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400 border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-ug-navy bg-ug-navy/5 px-2.5 py-0.5 rounded-md text-[11px]">
                {listing.category_name}
              </span>
              <span className="inline-flex items-center gap-1 text-neutral-500 font-normal">
                <MapPin className="w-3 h-3 text-neutral-400" />
                {listing.hall_name}
              </span>
            </div>

            <div className="inline-flex items-center gap-1 text-neutral-400 text-[11px] font-normal">
              <Clock className="w-3 h-3" />
              <span>Listed {formatRelativeDate(listing.created_at)}</span>
            </div>
          </div>

          {/* Needs Confirmation Warning Alert */}
          {isNeedsConfirmation && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed font-normal">
                <span className="font-medium block mb-0.5">Availability Confirmation Pending</span>
                The seller has not confirmed stock for today. Verify availability on WhatsApp before paying.
              </div>
            </div>
          )}

          {/* Title & Price */}
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-1.5 leading-snug">
              {listing.title}
            </h1>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-700 tracking-tight">
                {formatPrice(listing.price, listing.currency, false)}
              </span>
              {listing.price_negotiable && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  Negotiable
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="space-y-1 pt-1">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                Details
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          )}

          {/* Primary WhatsApp Action (In-page on desktop) */}
          <div className="pt-1">
            <WhatsAppContactButton
              listingId={listing.id}
              whatsappUrl={whatsappUrl}
              size="lg"
              label="Contact Seller on WhatsApp"
              className="w-full"
            />
            <p className="text-center text-[11px] text-neutral-400 mt-2 font-normal">
              Opens WhatsApp directly with product information.
            </p>
          </div>

          {/* Seller Storefront Card */}
          <div className="pt-2 border-t border-neutral-100">
            <Link
              href={`/store/${listing.storefront_slug}`}
              className="flex items-center justify-between p-3 bg-neutral-50/70 hover:bg-neutral-100/70 border border-neutral-200/70 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200/60 text-ug-navy flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-ug-navy" strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="font-medium text-xs sm:text-sm text-neutral-800 group-hover:text-ug-navy transition-colors">
                    {listing.seller_store_name}
                  </h4>
                  <p className="text-[11px] text-neutral-400 flex items-center gap-1 font-normal">
                    <span>{listing.hall_name}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-medium text-neutral-500 group-hover:text-ug-navy transition-colors">
                <span>View store</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>

          {/* Safety & Moderation Footer */}
          <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] text-neutral-400 font-normal">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>Inspect item before paying via Mobile Money or cash.</span>
            </div>

            <ReportModal listingId={listing.id} listingTitle={listing.title} />
          </div>
        </div>
      </div>

      {/* Sticky Mobile Floating Action Bar */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg"
        style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
      >
        <div className="min-w-0">
          <span className="text-[10px] text-neutral-400 block font-normal leading-tight">Price</span>
          <span className="text-sm font-semibold text-neutral-900 tracking-tight truncate block">
            {formatPrice(listing.price, listing.currency, false)}
          </span>
        </div>
        <WhatsAppContactButton
          listingId={listing.id}
          whatsappUrl={whatsappUrl}
          size="sm"
          label="Chat on WhatsApp"
          className="flex-1 max-w-[200px] py-2"
        />
      </div>
    </div>
  );
}
