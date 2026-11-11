'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import type { Database } from '@/types/database.types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];

interface CategoryChipsProps {
  categories: CategoryRow[];
  activeCategory?: string;
}

export function CategoryChips({ categories, activeCategory = 'all' }: CategoryChipsProps) {
  const searchParams = useSearchParams();

  const buildCategoryUrl = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    params.delete('page');
    const queryString = params.toString();
    return queryString ? `/?${queryString}` : '/';
  };

  const allItems = [
    {
      id: 'all',
      name: 'All Items',
      slug: 'all',
      icon: null,
    },
    ...categories,
  ];

  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0 overscroll-x-contain">
      <div className="flex items-center gap-1.5 min-w-max">
        {allItems.map((cat) => {
          const isActive =
            cat.slug === activeCategory || (activeCategory === 'all' && cat.slug === 'all');

          return (
            <Link
              key={cat.id}
              href={buildCategoryUrl(cat.slug)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all shrink-0 border select-none active:scale-[0.97]',
                isActive
                  ? 'bg-ug-navy text-white border-ug-navy font-medium shadow-2xs'
                  : 'bg-white text-neutral-600 border-neutral-200/80 hover:border-neutral-300 hover:text-neutral-900 font-normal'
              )}
            >
              <CategoryIcon slug={cat.slug} className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
              <span>{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
