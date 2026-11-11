import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getActiveCategories } from '@/repositories/category.repository';
import { ListingForm } from '@/components/seller/ListingForm';

export default async function NewListingPage() {
  const categories = await getActiveCategories();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link
        href="/seller"
        className="inline-flex items-center gap-1.5 text-xs font-normal text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Seller Dashboard</span>
      </Link>

      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-7 shadow-2xs">
        <div className="mb-5 pb-3 border-b border-neutral-100">
          <h1 className="text-lg sm:text-xl font-semibold text-neutral-900">Post a New Listing</h1>
          <p className="text-xs text-neutral-400 mt-0.5 font-normal">
            Publish an item or service to the Jean Nelson AKA Hall feed
          </p>
        </div>

        <ListingForm categories={categories} />
      </div>
    </div>
  );
}
