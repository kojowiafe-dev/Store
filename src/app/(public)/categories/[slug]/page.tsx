import React, { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import { getCategoryBySlug, getActiveCategories } from '@/repositories/category.repository';
import { getMarketplaceListings } from '@/repositories/listing.repository';
import { CategoryChips } from '@/components/search/CategoryChips';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ListingGrid } from '@/components/listings/ListingGrid';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [category, categories, listingsResult] = await Promise.all([
    getCategoryBySlug(slug),
    getActiveCategories(),
    getMarketplaceListings({ category: slug }),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-normal text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to all items</span>
      </Link>

      {/* Category Header */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center text-ug-navy shrink-0">
            <CategoryIcon slug={category.slug} className="w-5 h-5 text-ug-navy" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-neutral-900">{category.name}</h1>
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5 font-normal">
              <Clock className="w-3 h-3 text-neutral-400" />
              <span>
                Freshness duration: {category.default_expiry_hours ?? 24} hours in Jean Nelson AKA Hall
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <Suspense fallback={<div className="h-9 bg-neutral-100 rounded-full w-full animate-pulse" />}>
        <CategoryChips categories={categories} activeCategory={category.slug} />
      </Suspense>

      {/* Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200/80 pb-3">
          <h2 className="text-sm sm:text-base font-semibold text-neutral-900">
            {category.name}
            <span className="text-xs font-normal text-neutral-400 ml-1.5">
              ({listingsResult.total})
            </span>
          </h2>
        </div>

        <ListingGrid
          listings={listingsResult.data}
          emptyMessage={`No items currently available in ${category.name}. Check back later.`}
        />
      </div>
    </div>
  );
}
