'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface GalleryImage {
  id: string;
  storage_path: string;
}

interface ListingImageGalleryProps {
  images: GalleryImage[];
  title: string;
  categorySlug: string;
  categoryName: string;
}

export function ListingImageGallery({
  images,
  title,
  categorySlug,
  categoryName,
}: ListingImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentImage = images[activeIndex] ?? images[0];

  if (!currentImage) {
    return (
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F7F7F7] border border-neutral-200/80 flex flex-col items-center justify-center text-neutral-400 p-6 text-center select-none shadow-2xs">
        <div className="w-14 h-14 rounded-full bg-white border border-neutral-200/60 flex items-center justify-center mb-3 shadow-2xs">
          <CategoryIcon slug={categorySlug} className="w-6 h-6 text-neutral-500" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          {categoryName}
        </span>
        <span className="text-[11px] text-neutral-400 mt-1 font-normal">
          No photo uploaded by seller
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F7F7F7] border border-neutral-200/80 shadow-2xs">
        <Image
          src={currentImage.storage_path}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="flex items-center gap-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`View photo ${idx + 1}`}
              className={`relative w-14 h-14 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                idx === activeIndex
                  ? 'border-ug-navy ring-1 ring-ug-navy/25'
                  : 'border-neutral-200/80 opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={img.storage_path}
                alt={`${title} thumbnail ${idx + 1}`}
                fill
                sizes="56px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

