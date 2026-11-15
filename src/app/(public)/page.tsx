import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, BadgeCheck } from 'lucide-react';
import { getActiveCategories } from '@/repositories/category.repository';
import { getMarketplaceListings } from '@/repositories/listing.repository';
import { getApprovedStorefronts } from '@/repositories/seller.repository';
import { SearchBar } from '@/components/search/SearchBar';
import { CategoryChips } from '@/components/search/CategoryChips';
import { ListingFeed } from '@/components/listings/ListingFeed';

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: 'recent' | 'price_asc' | 'price_desc';
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q;
  const category = resolvedParams.category ?? 'all';
  const sort = resolvedParams.sort ?? 'recent';
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;

  const [categories, listingsResult, storefronts] = await Promise.all([
    getActiveCategories(),
    getMarketplaceListings({
      q,
      category,
      sort,
      page,
      limit: 24,
    }),
    getApprovedStorefronts(10),
  ]);

  const activeCategoryObj = categories.find((c) => c.slug === category);
  const pageTitle = activeCategoryObj ? activeCategoryObj.name : 'All Items';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Compact Mobile-First Hall Header */}
      <div className="bg-ug-navy text-white rounded-2xl px-4 py-3.5 sm:px-6 sm:py-5 relative overflow-hidden shadow-xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-white/10 text-white/90 border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Jean Nelson AKA Hall</span>
            </div>
            <h1 className="text-base sm:text-xl font-semibold tracking-tight text-white leading-snug">
              Discover student products in your hall
            </h1>
            <p className="text-neutral-300 text-[11px] sm:text-xs font-normal leading-relaxed">
              Meals, thrift fashion, electronics &amp; services &middot; direct on WhatsApp.
            </p>
          </div>

          <Link
            href="/seller"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white text-ug-navy hover:bg-neutral-100 transition-colors shrink-0 shadow-2xs"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Open Storefront</span>
          </Link>
        </div>

        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/[0.04] rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Discovery Controls */}
      <div className="space-y-2.5 sm:space-y-3">
        <Suspense
          fallback={<div className="h-10 bg-white rounded-xl border border-neutral-200/60 animate-pulse" />}
        >
          <SearchBar />
        </Suspense>

        <Suspense
          fallback={<div className="h-8 bg-white rounded-full border border-neutral-200/60 animate-pulse" />}
        >
          <CategoryChips categories={categories} activeCategory={category} />
        </Suspense>
      </div>

      {/* Horizontal Verified Hall Stores Strip */}
      {storefronts.length > 0 && !q && category === 'all' && (
        <section aria-label="Verified hall stores" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Hall Stores
            </h2>
            <span className="text-[11px] text-neutral-400 font-normal">
              Tap to browse store
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {storefronts.map((store) => (
              <Link
                key={store.id}
                href={`/store/${store.storefront_slug}`}
                className="inline-flex items-center gap-2 bg-white hover:bg-neutral-50 border border-neutral-200/80 hover:border-ug-navy/30 rounded-full pl-1.5 pr-3 py-1 shrink-0 transition-colors shadow-2xs"
              >
                <div className="relative w-6 h-6 rounded-full bg-ug-navy text-white flex items-center justify-center text-[10px] font-medium overflow-hidden shrink-0">
                  {store.storefront_image_url ? (
                    <Image
                      src={store.storefront_image_url}
                      alt={store.store_name}
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  ) : (
                    store.store_name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-medium text-neutral-800 whitespace-nowrap">
                  {store.store_name}
                </span>
                <BadgeCheck className="w-3.5 h-3.5 text-ug-navy shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Main Listing Feed (Grid / List Toggle + Sort) */}
      <ListingFeed
        listings={listingsResult.data}
        title={pageTitle}
        total={listingsResult.total}
        searchQuery={q}
        currentSort={sort}
        emptyMessage={
          q
            ? `No items found matching "${q}". Try another search term.`
            : 'No items currently available in this category. Check back soon.'
        }
      />

      {/* Minimal Seller Banner */}
      <div className="mt-6 sm:mt-10 bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-7 text-center flex flex-col items-center shadow-2xs">
        <div className="w-9 h-9 rounded-full bg-neutral-100 text-ug-navy flex items-center justify-center mb-2.5">
          <Store className="w-4 h-4 text-ug-navy" strokeWidth={1.75} />
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-neutral-900 mb-1">
          Selling in Jean Nelson AKA Hall?
        </h3>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mb-4 leading-relaxed font-normal">
          Create your digital storefront, list your products, and receive orders directly on WhatsApp.
        </p>
        <Link
          href="/seller"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-white bg-ug-navy hover:bg-ug-navy-light transition-colors shadow-xs"
        >
          Open Your Storefront
        </Link>
      </div>
    </div>
  );
}
