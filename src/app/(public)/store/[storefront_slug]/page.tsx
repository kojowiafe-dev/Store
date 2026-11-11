import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Store,
  MapPin,
  MessageCircle,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { getStorefrontBySlug } from '@/repositories/seller.repository';
import { getListingsByStorefrontSlug } from '@/repositories/listing.repository';
import { buildDirectStoreWhatsAppUrl } from '@/lib/whatsapp';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { ShareButton } from '@/components/ui/ShareButton';

interface StorefrontPageProps {
  params: Promise<{ storefront_slug: string }>;
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { storefront_slug } = await params;
  const storefront = await getStorefrontBySlug(storefront_slug);

  if (!storefront) {
    notFound();
  }

  const listings = await getListingsByStorefrontSlug(storefront_slug);

  const directWhatsAppUrl = buildDirectStoreWhatsAppUrl({
    whatsappNumber: storefront.whatsapp_number,
    storeName: storefront.store_name,
  });

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-normal text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to marketplace</span>
      </Link>

      {/* Storefront Hero Profile */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-7 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-ug-navy text-white flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              {storefront.storefront_image_url ? (
                <Image
                  src={storefront.storefront_image_url}
                  alt={storefront.store_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <Store className="w-7 h-7 text-white" strokeWidth={1.5} />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-semibold text-neutral-900">
                  {storefront.store_name}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified Student
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-400 font-normal">
                <span className="inline-flex items-center gap-1 text-neutral-500">
                  <MapPin className="w-3 h-3 text-neutral-400" />
                  {storefront.hall_name}
                </span>
                <span>&middot;</span>
                <span>{storefront.seller_display_name}</span>
              </div>

              {storefront.store_description && (
                <p className="text-xs sm:text-sm text-neutral-600 max-w-xl pt-1 leading-relaxed font-normal">
                  {storefront.store_description}
                </p>
              )}
            </div>
          </div>

          {/* Store Actions */}
          <div className="w-full sm:w-auto flex items-center gap-2 shrink-0">
            <ShareButton
              title={`${storefront.store_name} on Campus Store`}
              text={`Check out ${storefront.store_name} on Campus Store (${storefront.hall_name}):`}
              url={`/store/${storefront.storefront_slug}`}
              label="Share"
              variant="secondary"
              className="flex-1 sm:flex-initial"
            />
            <a
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-white bg-[#128C7E] hover:bg-[#075E54] transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
              <span>Message Store</span>
            </a>
          </div>
        </div>
      </div>

      {/* Catalog Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200/80 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-neutral-400" strokeWidth={1.75} />
            <h2 className="text-sm sm:text-base font-semibold text-neutral-900">
              Products
            </h2>
            <span className="text-xs font-normal text-neutral-400">
              ({listings.length})
            </span>
          </div>

          <span className="text-xs text-neutral-400 font-normal">
            Collection: {storefront.hall_name}
          </span>
        </div>

        <ListingGrid
          listings={listings}
          emptyMessage={`This storefront does not have active items right now. Message ${storefront.store_name} on WhatsApp for restock updates.`}
        />
      </div>
    </div>
  );
}
