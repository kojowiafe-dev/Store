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
  Settings,
  Megaphone,
  MessageCircle,
} from 'lucide-react';
import { createClient, createServerDbClient } from '@/lib/supabase/server';
import { ensureSellerProfileForAuthUser } from '@/actions/auth.actions';
import { PILOT_HALL, isSupabaseConfigured } from '@/lib/constants';
import { buildAdminAdWhatsAppUrl } from '@/lib/whatsapp';
import { CompleteStorefrontSetup } from '@/components/seller/CompleteStorefrontSetup';
import { SellerListingItem } from '@/components/seller/SellerListingItem';
import { SignOutButton } from '@/components/seller/SignOutButton';
import { StoreQRCodeModal } from '@/components/seller/StoreQRCodeModal';
import { StoreStatusQuickBar } from '@/components/seller/StoreStatusQuickBar';
import { UgVerifiedBadge } from '@/components/ui/StoreTrustBadges';
import { ShareButton } from '@/components/ui/ShareButton';
import type { ListingAvailabilityStatus, StoreOperatingStatus } from '@/types/database.types';

interface DashboardListing {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  price_negotiable: boolean;
  availability_status: ListingAvailabilityStatus;
  confirm_before: string | null;
  expires_at: string | null;
  created_at: string;
  primary_image_path?: string | null;
}

interface DashboardSeller {
  id: string;
  store_name: string;
  storefront_slug: string;
  is_approved: boolean;
  store_status?: StoreOperatingStatus;
  operating_hours_note?: string | null;
  primary_pickup_spot?: string | null;
  ug_student_verified?: boolean;
  halls: { name: string } | null;
}

export default async function SellerDashboardPage() {
  let seller: DashboardSeller | null = null;
  let listings: DashboardListing[] = [];
  let whatsappTaps = 0;
  let userEmail: string | undefined;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      redirect('/seller/login');
    }

    userEmail = authUser.email;
    seller = await ensureSellerProfileForAuthUser(authUser);

    if (seller) {
      const db = await createServerDbClient();
      const { data: listingData } = await db
        .from('listings')
        .select(
          'id, slug, title, price, currency, price_negotiable, availability_status, confirm_before, expires_at, created_at, listing_images(storage_path, is_primary)'
        )
        .eq('seller_id', seller.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      type RawDashboardRow = Omit<DashboardListing, 'primary_image_path'> & {
        listing_images?: Array<{ storage_path: string; is_primary: boolean }> | null;
      };

      listings = ((listingData ?? []) as unknown as RawDashboardRow[]).map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        price: row.price,
        currency: row.currency,
        price_negotiable: row.price_negotiable,
        availability_status: row.availability_status,
        confirm_before: row.confirm_before,
        expires_at: row.expires_at,
        created_at: row.created_at,
        primary_image_path:
          row.listing_images?.find((img) => img.is_primary)?.storage_path ??
          row.listing_images?.[0]?.storage_path ??
          null,
      }));

      if (listings.length > 0) {
        const listingIds = listings.map((l) => l.id);
        const { count } = await db
          .from('listing_events')
          .select('*', { count: 'exact', head: true })
          .in('listing_id', listingIds)
          .eq('event_type', 'contact_tapped');

        whatsappTaps = count ?? 0;
      }
    }
  } else {
    // Demo / offline fallback mode for local evaluation
    whatsappTaps = 14;
    seller = {
      id: 'bbbbbbbb-0000-0000-0000-000000000001',
      store_name: "Ama's Kitchen (Demo)",
      storefront_slug: 'amas-kitchen',
      is_approved: true,
      store_status: 'OPEN_NOW',
      operating_hours_note: 'Cooking & available until 10:30 PM',
      primary_pickup_spot: "Jean Nelson Porter's Lodge",
      ug_student_verified: true,
      halls: { name: PILOT_HALL.name },
    };

    listings = [
      {
        id: 'cccccccc-0000-0000-0000-000000000001',
        slug: 'hot-jollof-chicken-shito-8f1',
        title: 'Hot Jollof Rice with Grilled Chicken & Shito',
        price: 35.0,
        currency: 'GHS',
        price_negotiable: false,
        availability_status: 'AVAILABLE',
        confirm_before: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
        created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
      {
        id: 'cccccccc-0000-0000-0000-000000000002',
        slug: 'fried-plantain-beans-redred-a4c',
        title: 'Red Red (Beans Stew with Fried Sweet Plantain & Gari)',
        price: 25.0,
        currency: 'GHS',
        price_negotiable: false,
        availability_status: 'NEEDS_CONFIRMATION',
        confirm_before: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        created_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      },
    ];
  }

  if (!seller) {
    return <CompleteStorefrontSetup userEmail={userEmail} />;
  }

  const hallName = seller.halls?.name ?? PILOT_HALL.name;
  const activeCount = listings.filter((l) => l.availability_status === 'AVAILABLE').length;
  const needsConfirmCount = listings.filter(
    (l) => l.availability_status === 'NEEDS_CONFIRMATION'
  ).length;
  const adminAdUrl = buildAdminAdWhatsAppUrl({
    storeName: seller.store_name,
    storefrontSlug: seller.storefront_slug,
  });

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
              {seller.ug_student_verified && (
                <UgVerifiedBadge ugStudentVerified hallApproved={seller.is_approved} />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-neutral-400 font-normal">
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
              <span>&middot;</span>
              <Link
                href="/seller/profile"
                className="text-neutral-500 hover:text-ug-navy font-normal inline-flex items-center gap-1 transition-colors"
              >
                <Settings className="w-3 h-3" />
                <span>Settings</span>
              </Link>
              <span>&middot;</span>
              <SignOutButton />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <StoreQRCodeModal
              storeName={seller.store_name}
              storefrontSlug={seller.storefront_slug}
            />
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

      {/* Live Store Status & Pickup Spot Quick Bar */}
      <StoreStatusQuickBar
        initialStatus={seller.store_status ?? 'OPEN_NOW'}
        initialNote={seller.operating_hours_note ?? ''}
        initialPickupSpot={seller.primary_pickup_spot ?? ''}
      />

      {/* Quick Seller Insights */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-white border border-neutral-200/80 rounded-xl p-3 sm:p-4 shadow-2xs">
          <p className="text-[11px] text-neutral-400 font-normal">Active Items</p>
          <p className="text-lg sm:text-xl font-semibold text-neutral-900 mt-0.5">{activeCount}</p>
        </div>
        <div className="bg-white border border-neutral-200/80 rounded-xl p-3 sm:p-4 shadow-2xs">
          <p className="text-[11px] text-neutral-400 font-normal">Needs Stock Check</p>
          <p className="text-lg sm:text-xl font-semibold text-amber-600 mt-0.5">
            {needsConfirmCount}
          </p>
        </div>
        <div className="bg-white border border-neutral-200/80 rounded-xl p-3 sm:p-4 shadow-2xs">
          <p className="text-[11px] text-neutral-400 font-normal">WhatsApp Taps</p>
          <p className="text-lg sm:text-xl font-semibold text-emerald-700 mt-0.5">{whatsappTaps}</p>
        </div>
      </div>

      {/* Promote & Advertise Banner */}
      <div className="bg-ug-navy text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Sponsored Placement &middot; From GH₵25</span>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-white">
            Boost Your Storefront &amp; Products in {PILOT_HALL.name}
          </h2>
          <p className="text-xs text-neutral-300 font-normal leading-relaxed">
            Pin your listings to the top of the homepage or feature {seller.store_name} first in the Hall Stores bar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/seller/promote"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white text-ug-navy hover:bg-neutral-100 transition-colors"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Ad Packages</span>
          </Link>
          <a
            href={adminAdUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#128C7E] hover:bg-[#075E54] text-white transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Pay Admin for Ads</span>
          </a>
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
              <SellerListingItem
                key={item.id}
                listing={item}
                storeName={seller.store_name}
                storefrontSlug={seller.storefront_slug}
                hallName={hallName}
                pickupSpot={seller.primary_pickup_spot}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
