'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Store, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide mobile bottom bar on product detail pages to give priority to the sticky WhatsApp CTA
  if (pathname.startsWith('/listings/')) {
    return null;
  }

  const navItems = [
    {
      label: 'Explore',
      href: '/',
      icon: Compass,
      isActive: pathname === '/',
    },
    {
      label: 'My Store',
      href: '/seller',
      icon: Store,
      isActive: pathname.startsWith('/seller') && pathname !== '/seller/listings/new',
    },
    {
      label: 'Post Item',
      href: '/seller/listings/new',
      icon: PlusCircle,
      isActive: pathname === '/seller/listings/new',
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 px-4 py-2 shadow-xs"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around max-w-sm mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 min-w-[64px] rounded-lg transition-colors select-none',
                item.isActive
                  ? 'text-ug-navy font-medium'
                  : 'text-neutral-400 hover:text-neutral-700 font-normal'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5', item.isActive ? 'text-ug-navy' : 'text-neutral-400')} strokeWidth={item.isActive ? 2 : 1.5} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

