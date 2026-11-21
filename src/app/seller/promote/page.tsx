import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Megaphone,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { AD_PACKAGES, PILOT_HALL } from '@/lib/constants';
import { buildAdminAdWhatsAppUrl } from '@/lib/whatsapp';
import { getCurrentViewer } from '@/lib/viewer';

export default async function PromoteStorePage() {
  const viewer = await getCurrentViewer();
  const storeName = viewer.seller?.store_name;
  const storefrontSlug = viewer.seller?.storefront_slug;

  const generalAdminUrl = buildAdminAdWhatsAppUrl({
    storeName,
    storefrontSlug,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={viewer.isAuthenticated ? '/seller' : '/'}
          className="inline-flex items-center gap-1.5 text-xs font-normal text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{viewer.isAuthenticated ? 'Back to Seller Dashboard' : 'Back to Marketplace'}</span>
        </Link>

        {viewer.seller && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ug-navy bg-white border border-neutral-200/80 px-3 py-1 rounded-full shadow-2xs">
            <Store className="w-3.5 h-3.5" />
            <span>{viewer.seller.store_name}</span>
          </span>
        )}
      </div>

      {/* Hero Header */}
      <div className="bg-ug-navy text-white rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white/90 border border-white/15">
              <Megaphone className="w-3 h-3 text-emerald-400" />
              <span>{PILOT_HALL.name} Promotions</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-white">
              Get 3x More WhatsApp Orders with Featured Ads
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 font-normal leading-relaxed">
              Pin your best-selling meals, thrift drops, or services to the top of Campus Store and reach hundreds of student buyers directly on their phones.
            </p>
          </div>

          <a
            href={generalAdminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#128C7E] hover:bg-[#075E54] text-white transition-colors shrink-0 shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Message Admin for Ads</span>
          </a>
        </div>

        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/[0.04] rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Ad Packages Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold text-neutral-900">
            Select an Advertising Package
          </h2>
          <span className="text-xs text-neutral-400 font-normal">
            Pay via Mobile Money &middot; Instant Activation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AD_PACKAGES.map((pkg) => {
            const priceLabel = `GH₵${pkg.priceGhs} / ${pkg.durationLabel}`;
            const bookingUrl = buildAdminAdWhatsAppUrl({
              packageTitle: pkg.name,
              priceLabel,
              storeName,
              storefrontSlug,
            });

            return (
              <div
                key={pkg.id}
                className={`flex flex-col justify-between bg-white rounded-2xl p-5 transition-all shadow-2xs ${
                  pkg.popular
                    ? 'border-2 border-ug-navy ring-1 ring-ug-navy/10'
                    : 'border border-neutral-200/80'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        pkg.popular
                          ? 'bg-ug-navy text-white'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      {pkg.badge}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-normal">
                      {pkg.durationLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">{pkg.name}</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-emerald-700">
                        GH₵{pkg.priceGhs}
                      </span>
                      <span className="text-xs text-neutral-400 font-normal">
                        / {pkg.durationLabel}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 font-normal leading-relaxed">
                    {pkg.summary}
                  </p>

                  <ul className="space-y-2 pt-2 border-t border-neutral-100">
                    {pkg.perks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-start gap-2 text-xs text-neutral-700 font-normal"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5 mt-4 border-t border-neutral-100">
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-medium transition-colors ${
                      pkg.popular
                        ? 'bg-ug-navy hover:bg-ug-navy-light text-white shadow-xs'
                        : 'bg-neutral-100 hover:bg-neutral-200/80 text-ug-navy'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Book on WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-ug-navy" />
          <h3 className="text-sm font-semibold text-neutral-900">
            How Ad Booking &amp; Payment Works
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-neutral-50/80 border border-neutral-200/60 space-y-1">
            <span className="text-[11px] font-semibold text-ug-navy">Step 1 &middot; Pick a Package</span>
            <p className="text-neutral-600 font-normal leading-relaxed">
              Tap &ldquo;Book on WhatsApp&rdquo; on any package above. Your store details are pre-filled automatically.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-neutral-50/80 border border-neutral-200/60 space-y-1">
            <span className="text-[11px] font-semibold text-ug-navy">Step 2 &middot; Mobile Money Payment</span>
            <p className="text-neutral-600 font-normal leading-relaxed">
              The Campus Store Admin will confirm your slot on WhatsApp and share the official Mobile Money number.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-neutral-50/80 border border-neutral-200/60 space-y-1">
            <span className="text-[11px] font-semibold text-ug-navy">Step 3 &middot; Go Live Instantly</span>
            <p className="text-neutral-600 font-normal leading-relaxed">
              Your product or storefront is pinned to the top of {PILOT_HALL.name} discovery immediately after confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

