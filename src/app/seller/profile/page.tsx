import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Store, MapPin, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SellerProfileForm } from '@/components/seller/SellerProfileForm';

export default async function SellerProfilePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let seller = null;
  let whatsappNumber = '+233501234567';

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/seller/login');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('whatsapp_number')
      .eq('id', user.id)
      .single();

    if (profile) {
      whatsappNumber = profile.whatsapp_number;
    }

    const { data: sellerData } = await supabase
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
      .single();

    seller = sellerData;
  } else {
    seller = {
      id: 's1000000-0000-0000-0000-000000000001',
      store_name: "Ama's Kitchen",
      storefront_slug: 'amas-kitchen',
      store_description: 'Fresh, warm homemade student meals delivered hot to Jean Nelson AKA Hall.',
      storefront_image_url: null,
      halls: { name: 'Jean Nelson AKA Hall' },
    };
  }

  if (!seller) {
    redirect('/seller');
  }

  const hallName = (seller.halls as any)?.name ?? 'Jean Nelson AKA Hall';

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
        </div>

        {/* Editable Form */}
        <SellerProfileForm initialDescription={seller.store_description ?? ''} />
      </div>
    </div>
  );
}
