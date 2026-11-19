import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import { createClient, createServerDbClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/constants';
import { getActiveCategories } from '@/repositories/category.repository';
import { ListingForm, type EditableListingData } from '@/components/seller/ListingForm';

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  const categories = await getActiveCategories();

  let initialListing: EditableListingData | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(`/seller/login?next=/seller/listings/${id}/edit`);
    }

    const db = await createServerDbClient();
    const { data: listing } = await db
      .from('listings')
      .select(
        `
        id,
        title,
        category_id,
        price,
        price_negotiable,
        description,
        seller_profiles!inner(user_id),
        listing_images(storage_path, display_order)
      `
      )
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (!listing) {
      notFound();
    }

    const owner = (listing.seller_profiles as unknown as { user_id: string } | null)?.user_id;
    if (owner !== user.id) {
      redirect('/seller');
    }

    const sortedPhotos = [...((listing.listing_images ?? []) as Array<{ storage_path: string; display_order: number }>)]
      .sort((a, b) => a.display_order - b.display_order)
      .map((img) => img.storage_path);

    initialListing = {
      id: listing.id,
      title: listing.title,
      category_id: listing.category_id,
      price: listing.price,
      price_negotiable: listing.price_negotiable,
      description: listing.description,
      photos: sortedPhotos,
    };
  } else {
    // Demo fallback
    initialListing = {
      id,
      title: 'Hot Jollof Rice with Grilled Chicken & Shito',
      category_id: categories[0]?.id ?? '',
      price: 35,
      price_negotiable: false,
      description: 'Freshly prepared with grilled chicken and homemade shito.',
      photos: [],
    };
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link
        href="/seller"
        className="inline-flex items-center gap-1.5 text-xs font-normal text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Seller Dashboard</span>
      </Link>

      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-4">
          <div className="w-9 h-9 rounded-xl bg-ug-navy/10 text-ug-navy flex items-center justify-center shrink-0">
            <Pencil className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-neutral-900">Edit Listing</h1>
            <p className="text-xs text-neutral-400 font-normal">
              Update product details, pricing, or photos
            </p>
          </div>
        </div>

        <ListingForm categories={categories} initialListing={initialListing} />
      </div>
    </div>
  );
}

