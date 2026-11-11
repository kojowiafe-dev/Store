import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Plus,
  Store,
  ExternalLink,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { SellerListingItem } from '@/components/seller/SellerListingItem';
import { ShareButton } from '@/components/ui/ShareButton';

export default async function SellerDashboardPage() {
  let user = null;
  let seller = null;
  let listings: any[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      redirect('/seller/login');
    }

    user = authUser;

    const { data: sellerProfile } = await supabase
      .from('seller_profiles')
      .select(`
        id,
        store_name,
        storefront_slug,
        is_approved,
        halls (
          name
        )
      `)
      .eq('user_id', user.id)
      .maybeSingle();

    seller = sellerProfile;

    if (seller) {
      const { data: listingData } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', seller.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      listings = listingData ?? [];
    }
  } else {
    // Demo / offline fallback mode for local evaluation
    seller = {
      id: 's1000000-0000-0000-0000-000000000001',
      store_name: "Ama's Kitchen (Demo)",
      storefront_slug: 'amas-kitchen',
      is_approved: true,
      halls: { name: 'Jean Nelson Aka Hall' },
    };

    listings = [
      {
        id: 'l1000000-0000-0000-0000-000000000001',
        slug: 'hot-jollof-chicken-shito-8f1',
        title: 'Hot Jollof Rice with Grilled Chicken & Shito',
        price: 35.0,
        currency: 'GHS',
        price_negotiable: false,
        availability_status: 'AVAILABLE' as const,
        confirm_before: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
        created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
      {
        id: 'l1000000-0000-0000-0000-000000000002',
        slug: 'fried-plantain-beans-redred-a4c',
        title: 'Red Red (Beans Stew with Fried Sweet Plantain & Gari)',
        price: 25.0,
        currency: 'GHS',
        price_negotiable: false,
        availability_status: 'NEEDS_CONFIRMATION' as const,
        confirm_before: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        created_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      },
    ];
  }

  if (!seller) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-2xs">
        <Store className="w-10 h-10 text-neutral-400 mx-auto mb-3" strokeWidth={1.5} />
        <h2 className="text-base font-semibold text-neutral-900 mb-1">Complete Storefront Setup</h2>
        <p className="text-xs text-neutral-500 mb-5 font-normal leading-relaxed">
          Your account is registered. Finish setting up your storefront details to start publishing products.
        </p>
        <Link
          href="/seller/register"
          className="inline-flex px-4 py-2 rounded-lg text-xs font-medium text-white bg-ug-navy hover:bg-ug-navy-light transition-colors"
        >
          Complete Setup
        </Link>
      </div>
    );
  }

  const hallName = (seller.halls as any)?.name ?? 'Jean Nelson Aka Hall';

  return (
    <div className="space-y-5 sm:space-y-6 max-w-3xl mx-auto">
      {/* Seller Header */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-semibold text-neutral-900">
                {seller.store_name}
              </h1>
              {seller.is_approved ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Live on Campus Store
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Pending Approval
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 text-xs text-neutral-400 font-normal">
              <span className="inline-flex items-center gap-1 text-neutral-500">
                <MapPin className="w-3 h-3 text-neutral-400" />
                {hallName}
              </span>
              <span>&middot;</span>
              <Link
                href={`/store/${seller.storefront_slug}`}
                target="_blank"
                className="text-ug-navy font-normal hover:underline inline-flex items-center gap-1"
              >
                <span>View Public Store</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ShareButton
              title={`${seller.store_name} on Campus Store`}
              text={`Check out ${seller.store_name} on Campus Store (Jean Nelson AKA Hall):`}
              url={`/store/${seller.storefront_slug}`}
              label="Share Store"
              variant="secondary"
            />
            <Link
              href="/seller/listings/new"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white bg-ug-navy hover:bg-ug-navy-light transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Listing</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Expiry Rule Reminder Banner */}
      <div className="p-3.5 bg-neutral-50/80 border border-neutral-200/80 rounded-xl text-xs text-neutral-600 flex items-start gap-2.5 font-normal leading-relaxed">
        <Clock className="w-4 h-4 text-ug-navy shrink-0 mt-0.5" />
        <p>
          <span className="font-medium text-neutral-800">Availability Rule: </span>
          Listings automatically expire based on category duration. When an item asks for confirmation, tap <span className="font-medium text-neutral-900">&ldquo;Confirm Stock&rdquo;</span> to refresh its timer and keep it visible in Jean Nelson AKA Hall.
        </p>
      </div>

      {/* Listings Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2.5">
          <h2 className="text-sm sm:text-base font-semibold text-neutral-900">
            Your Listings ({listings.length})
          </h2>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-8 text-center flex flex-col items-center shadow-2xs">
            <Store className="w-9 h-9 text-neutral-300 mb-2.5" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-neutral-800 mb-1">No Listings Yet</h3>
            <p className="text-xs text-neutral-400 max-w-xs mb-4 font-normal">
              Publish your first product to start receiving WhatsApp enquiries from fellow students.
            </p>
            <Link
              href="/seller/listings/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-ug-navy hover:bg-ug-navy-light transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Create Listing</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {listings.map((item) => (
              <SellerListingItem key={item.id} listing={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
