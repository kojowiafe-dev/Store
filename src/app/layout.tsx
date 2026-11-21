import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Outfit } from 'next/font/google';
import { Store, Plus, Megaphone, ShieldCheck } from 'lucide-react';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { ToastProvider } from '@/components/ui/Toast';
import { getCurrentViewer } from '@/lib/viewer';
import { buildAdminAdWhatsAppUrl } from '@/lib/whatsapp';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Campus Store — University of Ghana Discovery',
  description:
    'Discover products and services sold by students across University of Ghana halls. Direct WhatsApp contact, zero middlemen.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getCurrentViewer();
  const adminAdWhatsAppUrl = buildAdminAdWhatsAppUrl({
    storeName: viewer.seller?.store_name,
    storefrontSlug: viewer.seller?.storefront_slug,
  });

  return (
    <html lang="en" className={outfit.variable}>
      <body className="min-h-screen flex flex-col bg-[#FAFAFA] text-neutral-900 antialiased font-sans pb-16 sm:pb-0 overflow-x-hidden">
        <ToastProvider>
          {/* Role-Aware Header */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/70 px-3.5 sm:px-4 py-2.5 sm:py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <span className="text-base sm:text-lg font-semibold tracking-tight text-ug-navy">
                  Campus<span className="font-normal text-neutral-500">Store</span>
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-medium bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full border border-neutral-200/60">
                  UG Legon
                </span>
              </Link>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {viewer.isAdmin && (
                  <Link
                    href="/admin/sellers"
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                {viewer.isAuthenticated ? (
                  <>
                    <Link
                      href="/seller/promote"
                      className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/70 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>Promote</span>
                    </Link>
                    <Link
                      href="/seller"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-ug-navy px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-200/90 bg-white hover:bg-neutral-50 transition-colors max-w-[140px] sm:max-w-[180px]"
                    >
                      <Store className="w-3.5 h-3.5 text-ug-navy shrink-0" />
                      <span className="truncate">
                        {viewer.seller?.store_name ?? 'My Storefront'}
                      </span>
                    </Link>
                    <Link
                      href="/seller/listings/new"
                      className="inline-flex items-center gap-1 text-xs font-medium bg-ug-navy hover:bg-ug-navy-light text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Post Item</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/seller/promote"
                      className="hidden md:inline-flex items-center gap-1 text-xs font-normal text-neutral-500 hover:text-ug-navy px-2.5 py-1.5 transition-colors"
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>Advertise</span>
                    </Link>
                    <Link
                      href="/seller/login"
                      className="text-xs font-medium text-neutral-600 hover:text-ug-navy px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-200/80 hover:bg-neutral-50 transition-colors"
                    >
                      Seller Login
                    </Link>
                    <Link
                      href="/seller/register"
                      className="text-xs font-medium bg-ug-navy hover:bg-ug-navy-light text-white px-3 sm:px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs"
                    >
                      Start Selling
                    </Link>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-4 py-4 sm:py-7">
            {children}
          </main>

          {/* Footer with Advertising Contact & Conditional Admin Link */}
          <footer className="bg-white border-t border-neutral-200/70 py-6 sm:py-7 px-4 text-center text-xs text-neutral-500">
            <div className="max-w-3xl mx-auto space-y-2">
              <p className="font-medium text-neutral-700">
                Campus Store &middot; University of Ghana, Legon
              </p>
              <p className="max-w-xl mx-auto text-neutral-400 text-[11px] leading-relaxed font-normal">
                Direct peer-to-peer discovery on WhatsApp. Inspect all items before paying.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-[11px] text-neutral-500 font-normal">
                <span>Jean Nelson AKA Hall Pilot</span>
                <span>&bull;</span>
                <Link
                  href="/seller/promote"
                  className="text-ug-navy font-medium hover:underline"
                >
                  Advertise &amp; Boost Sales
                </Link>
                <span>&bull;</span>
                <a
                  href={adminAdWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 font-medium hover:underline"
                >
                  Contact Admin for Ads
                </a>
                {viewer.isAdmin && (
                  <>
                    <span>&bull;</span>
                    <Link
                      href="/admin/sellers"
                      className="text-amber-700 font-medium hover:underline"
                    >
                      Admin Console
                    </Link>
                  </>
                )}
              </div>
            </div>
          </footer>

          {/* Dedicated Mobile Bottom Bar */}
          <MobileBottomNav isAuthenticated={viewer.isAuthenticated} />
        </ToastProvider>
      </body>
    </html>
  );
}
