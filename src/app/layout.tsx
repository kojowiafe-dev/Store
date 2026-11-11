import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Outfit } from 'next/font/google';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="min-h-screen flex flex-col bg-[#FAFAFA] text-neutral-900 antialiased font-sans pb-16 sm:pb-0 overflow-x-hidden">
        {/* Modern Minimal Header */}
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
              <Link
                href="/seller"
                className="hidden sm:inline-flex text-xs font-medium text-neutral-600 hover:text-ug-navy px-3 py-1.5 rounded-lg border border-neutral-200/80 hover:bg-neutral-50 transition-colors"
              >
                Seller Portal
              </Link>
              <Link
                href="/seller/register"
                className="text-xs font-medium bg-ug-navy hover:bg-ug-navy-light text-white px-3 sm:px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs"
              >
                Start Selling
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-4 py-4 sm:py-7">
          {children}
        </main>

        {/* Footer with Off-Platform Disclaimer */}
        <footer className="bg-white border-t border-neutral-200/70 py-6 sm:py-7 px-4 text-center text-xs text-neutral-500">
          <div className="max-w-3xl mx-auto space-y-2">
            <p className="font-medium text-neutral-700">
              Campus Store &middot; University of Ghana, Legon
            </p>
            <p className="max-w-xl mx-auto text-neutral-400 text-[11px] leading-relaxed font-normal">
              Direct peer-to-peer discovery on WhatsApp. Inspect all items before paying.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-[11px] text-neutral-400 font-normal">
              <span>Jean Nelson AKA Hall Pilot</span>
              <span>&bull;</span>
              <Link href="/admin/sellers" className="hover:text-neutral-700 transition-colors">Admin</Link>
            </div>
          </div>
        </footer>

        {/* Dedicated Mobile Bottom Bar */}
        <MobileBottomNav />
      </body>
    </html>
  );
}
