import React, { Suspense } from 'react';
import Link from 'next/link';
import { Store, MapPin } from 'lucide-react';
import { getActiveCategories } from '@/repositories/category.repository';
import { getMarketplaceListings } from '@/repositories/listing.repository';
import { SearchBar } from '@/components/search/SearchBar';
import { CategoryChips } from '@/components/search/CategoryChips';
import { SortSelect } from '@/components/search/SortSelect';
import { ListingGrid } from '@/components/listings/ListingGrid';

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

  const [categories, listingsResult] = await Promise.all([
    getActiveCategories(),
    getMarketplaceListings({
      q,
      category,
      sort,
      page,
      limit: 24,
    }),
  ]);

  const activeCategoryObj = categories.find((c) => c.slug === category);
  const pageTitle = activeCategoryObj ? activeCategoryObj.name : 'All Items';

  return (
    <div className="space-y-4 sm:space-y-7">
      {/* Sleek Pilot Banner (Compact on mobile) */}
      <div className="bg-ug-navy text-white rounded-2xl p-4 sm:p-7 relative overflow-hidden shadow-xs">
        <div className="relative z-10 max-w-xl space-y-1.5 sm:space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-white/10 text-white/90 border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Jean Nelson AKA Hall Pilot</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-white leading-tight">
            Discover student products in your hall
          </h1>
          <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed font-normal">
            Find homemade meals, thrift fashion, electronics & services from verified student sellers in Jean Nelson AKA Hall.
          </p>
        </div>

        {/* Minimal geometric background accent */}
        <div className="absolute right-0 top-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/[0.03] rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Discovery Controls */}
      <div className="space-y-2.5 sm:space-y-3">
        <Suspense fallback={<div className="h-10 bg-white rounded-xl border border-neutral-200/60 animate-pulse" />}>
          <SearchBar />
        </Suspense>

        <Suspense fallback={<div className="h-8 bg-white rounded-full border border-neutral-200/60 animate-pulse" />}>
          <CategoryChips categories={categories} activeCategory={category} />
        </Suspense>
      </div>

      {/* Listing Feed Header */}
      <div className="flex items-center justify-between pt-0.5">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-neutral-900 flex items-center gap-1.5">
            <span>{pageTitle}</span>
            <span className="text-xs font-normal text-neutral-400">
              ({listingsResult.total})
            </span>
          </h2>
          {q && (
            <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 font-normal">
              Results for &ldquo;<span className="text-neutral-800 font-medium">{q}</span>&rdquo;
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex text-xs text-neutral-400 items-center gap-1 font-normal">
            <MapPin className="w-3 h-3 text-neutral-400" />
            <span>Jean Nelson AKA</span>
          </div>
          <Suspense fallback={<div className="h-7 w-28 bg-neutral-100 rounded-lg animate-pulse" />}>
            <SortSelect currentSort={sort} />
          </Suspense>
        </div>
      </div>

      {/* Main Listing Grid */}
      <ListingGrid
        listings={listingsResult.data}
        emptyMessage={
          q
            ? `No items found matching "${q}". Try another search term.`
            : 'No items currently available in this category. Check back soon.'
        }
      />

      {/* Modern Minimal Seller Banner */}
      <div className="mt-8 sm:mt-12 bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-8 text-center flex flex-col items-center shadow-2xs">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-100 text-ug-navy flex items-center justify-center mb-2.5">
          <Store className="w-4 h-4 sm:w-5 sm:h-5 text-ug-navy" strokeWidth={1.75} />
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-neutral-900 mb-1">
          Selling in Jean Nelson AKA Hall?
        </h3>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mb-4 sm:mb-5 leading-relaxed font-normal">
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
