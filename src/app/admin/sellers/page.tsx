import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, MapPin, Store } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { PILOT_HALL } from '@/lib/constants';
import { ApproveSellerButton } from '@/components/admin/ApproveSellerButton';

interface PendingSellerRow {
  id: string;
  store_name: string;
  storefront_slug: string;
  created_at: string;
  halls: { name: string } | null;
  profiles: { display_name: string; whatsapp_number: string } | null;
}

export default async function AdminSellersPage() {
  let pendingSellers: PendingSellerRow[] = [];

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = createAdminClient();
      const { data } = await adminClient
        .from('seller_profiles')
        .select(`
          id,
          store_name,
          storefront_slug,
          created_at,
          halls (name),
          profiles:user_id (display_name, whatsapp_number)
        `)
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      pendingSellers = (data ?? []) as unknown as PendingSellerRow[];
    } catch {
      pendingSellers = [];
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-normal text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Marketplace</span>
      </Link>

      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-7 shadow-2xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-ug-navy text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-neutral-900">Seller Approvals</h1>
              <p className="text-xs text-neutral-400 font-normal">
                Jean Nelson AKA Hall Pilot &middot; Moderation Queue ({pendingSellers.length} pending)
              </p>
            </div>
          </div>
        </div>

        {pendingSellers.length === 0 ? (
          <div className="py-10 text-center text-neutral-400">
            <Store className="w-9 h-9 mx-auto text-neutral-300 mb-2" strokeWidth={1.5} />
            <p className="text-xs sm:text-sm font-medium text-neutral-700">No pending seller approvals</p>
            <p className="text-xs text-neutral-400 mt-0.5 font-normal">
              All registered student sellers are active.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {pendingSellers.map((seller) => {
              const profile = seller.profiles;
              const hall = seller.halls;

              return (
                <div
                  key={seller.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-medium text-neutral-900">{seller.store_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 font-normal">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        {hall?.name ?? PILOT_HALL.name}
                      </span>
                      <span>&middot;</span>
                      <span>{profile?.display_name ?? 'Student'}</span>
                      <span>&middot;</span>
                      <span>{profile?.whatsapp_number ?? '+233...'}</span>
                    </div>
                  </div>

                  <ApproveSellerButton sellerId={seller.id} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
