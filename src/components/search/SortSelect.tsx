'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export type SortOption = 'recent' | 'price_asc' | 'price_desc';

interface SortSelectProps {
  currentSort: SortOption;
}

export function SortSelect({ currentSort }: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSort = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (nextSort === 'recent') {
      params.delete('sort');
    } else {
      params.set('sort', nextSort);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <select
      aria-label="Sort listings"
      value={currentSort}
      onChange={handleChange}
      className="text-xs font-normal text-neutral-600 bg-white border border-neutral-200/90 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-ug-navy transition-colors cursor-pointer"
    >
      <option value="recent">Newest</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  );
}

