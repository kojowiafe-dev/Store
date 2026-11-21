import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Store, MapPin, Phone, GraduationCap } from 'lucide-react';
import { createClient, createServerDbClient } from '@/lib/supabase/server';
import { PILOT_HALL, isSupabaseConfigured, isUgStudentEmail } from '@/lib/constants';
import { redirect } from 'next/navigation';
import { SellerProfileForm } from '@/components/seller/SellerProfileForm';
import type { StoreOperatingStatus } from '@/types/database.types';

interface SellerSettingsData {
  id: string;
  store_name: string;
  storefront_slug: string;
  store_description: string | null;
  storefront_image_url: string | null;
  store_status?: StoreOperatingStatus;
  operating_hours_note?: string | null;
  primary_pickup_spot?: string | null;
  ug_student_verified?: boolean;
  halls: { name: string } | null;
}

export default async function SellerProfilePage() {
  let seller: SellerSettingsData | null = null;
  let whatsappNumber = '+233501234567';
  let userEmail: string | undefined;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/seller/login');
    }

    userEmail = user.email;
    const db = await createServerDbClient();

    const { data: profile } = await db
      .from('profiles')
      .select('whatsapp_number')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      whatsappNumber = profile.whatsapp_number;
    }

    let { data: sellerData, error: sellerErr } = await db
      .from('seller_profiles')
      .select(`
        id,
        store_name,
        storefront_slug,
        store_description,
        storefront_image_url,
        store_status,
        operating_hours_note,
        primary_pickup_spot,
        ug_student_verified,
        halls (
          name
        )
      `)
      .eq('user_id', user.id)
      .maybeSingle();

    if (sellerErr) {
      const legacy = await db
        .from('seller_profiles')
        .select(`
          id,
          store_name,
          storefront_slug,
          store_description,
          storefront_image_url,
          halls (
            name
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();
      sellerData = legacy.data as unknown as typeof sellerData;
      sellerErr = legacy.error;
    }

    seller = sellerData as unknown as SellerSettingsData | null;
  } else {
    userEmail = 'ama.osei@st.ug.edu.gh';
    seller = {
      id: 'bbbbbbbb-0000-0000-0000-000000000001',
      store_name: "Ama's Kitchen",
      storefront_slug: 'amas-kitchen',
      store_description: 'Fresh, warm homemade student meals delivered hot to Jean Nelson AKA Hall.',
      storefront_image_url: null,
      store_status: 'OPEN_NOW',
      operating_hours_note: 'Cooking & available until 10:30 PM',
      primary_pickup_spot: "Jean Nelson Porter's Lodge",
      ug_student_verified: true,
      halls: { name: PILOT_HALL.name },
    };
  }

  if (!seller) {
    redirect('/seller');
  }

  const hallName = seller.halls?.name ?? PILOT_HALL.name;
  const isUgVerified = Boolean(seller.ug_student_verified) || isUgStudentEmail(userEmail);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link
        href="/seller"
        className="inline-flex items-center gap-1.5 text-xs font-normal text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-5">
        <div className="pb-3 border-b border-neutral-100">
          <h1 className="text-lg sm:text-xl font-semibold text-neutral-900">Storefront Settings</h1>
          <p className="text-xs text-neutral-400 mt-0.5 font-normal">
            Store information displayed to Jean Nelson AKA Hall buyers
          </p>
        </div>

        {/* Read-only core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-neutral-50/70 rounded-xl border border-neutral-200/70 text-xs">
          <div>
            <span className="text-neutral-400 block mb-0.5 font-normal">Store Name</span>
            <span className="font-medium text-neutral-800 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-ug-navy" />
              {seller.store_name}
            </span>
          </div>

          <div>
            <span className="text-neutral-400 block mb-0.5 font-normal">Hall of Residence</span>
            <span className="font-medium text-neutral-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-ug-navy" />
              {hallName}
            </span>
          </div>

          <div>
            <span className="text-neutral-400 block mb-0.5 font-normal">WhatsApp Number</span>
            <span className="font-medium text-neutral-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              {whatsappNumber}
            </span>
          </div>

          <div>
            <span className="text-neutral-400 block mb-0.5 font-normal">Storefront Link</span>
            <span className="font-mono text-neutral-600 truncate block">
              /store/{seller.storefront_slug}
            </span>
          </div>

          <div className="sm:col-span-2 pt-2 border-t border-neutral-200/70">
            <span className="text-neutral-400 block mb-1 font-normal">UG Student Verification</span>
            {isUgVerified ? (
              <span className="inline-flex items-center gap-1.5 text-ug-navy font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-ug-navy" />
                Verified UG Student ({userEmail ?? '@st.ug.edu.gh'})
              </span>
            ) : (
              <span className="text-neutral-500 font-normal">
                Sign up or register with an <span className="font-mono text-neutral-700">@st.ug.edu.gh</span> student email to automatically earn the <strong className="font-medium text-neutral-700">UG Student Verified</strong> trust badge.
              </span>
            )}
          </div>
        </div>

        {/* Editable Form */}
        <SellerProfileForm
          initialDescription={seller.store_description ?? ''}
          initialStatus={seller.store_status ?? 'OPEN_NOW'}
          initialOperatingNote={seller.operating_hours_note ?? ''}
          initialPickupSpot={seller.primary_pickup_spot ?? ''}
        />
      </div>
    </div>
  );
}
