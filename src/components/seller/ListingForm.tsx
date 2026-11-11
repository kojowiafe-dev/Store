'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Clock, UploadCloud } from 'lucide-react';
import { createListing } from '@/actions/listing.actions';
import type { Database } from '@/types/database.types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];

interface ListingFormProps {
  categories: CategoryRow[];
}

export function ListingForm({ categories }: ListingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [price, setPrice] = useState('');
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const parsedPrice = price.trim() === '' ? null : parseFloat(price);

    startTransition(async () => {
      const result = await createListing({
        title,
        category_id: categoryId,
        price: parsedPrice,
        price_negotiable: priceNegotiable,
        description: description.trim() || undefined,
        photos: [],
      });

      if (!result.success) {
        setErrorMessage(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      router.push('/seller');
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-1.5">
          Product / Service Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Hot Jollof with Fried Chicken, or Vintage Denim Jacket"
          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200/90 focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all shadow-2xs font-normal placeholder:text-neutral-400"
        />
        {fieldErrors.title && (
          <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.title[0]}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-1.5">
          Category <span className="text-rose-500">*</span>
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200/90 bg-white focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all shadow-2xs font-normal"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {selectedCategory && (
          <p className="text-[11px] text-neutral-400 mt-1.5 flex items-center gap-1 font-normal">
            <Clock className="w-3 h-3 text-neutral-400" />
            <span>
              Freshness duration: {selectedCategory.default_expiry_hours ?? 24} hours before confirmation prompt.
            </span>
          </p>
        )}
      </div>

      {/* Price & Negotiable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1.5">
            Price in GHS (Optional)
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-xs font-medium text-neutral-400">GH₵</span>
            <input
              type="number"
              step="0.5"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full text-xs sm:text-sm pl-11 pr-3.5 py-2.5 rounded-xl border border-neutral-200/90 focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all shadow-2xs font-normal placeholder:text-neutral-400"
            />
          </div>
          <p className="text-[11px] text-neutral-400 mt-1 font-normal">Leave blank if negotiable / variable</p>
        </div>

        <div className="flex items-center sm:pt-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={priceNegotiable}
              onChange={(e) => setPriceNegotiable(e.target.checked)}
              className="w-4 h-4 rounded text-ug-navy border-neutral-300 focus:ring-ug-navy/20"
            />
            <span className="text-xs font-normal text-neutral-700">Price is negotiable</span>
          </label>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-1.5">
          Description (Optional)
        </label>
        <textarea
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Details on portion size, condition, sizes available, or delivery to Jean Nelson AKA Hall rooms..."
          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200/90 focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all shadow-2xs resize-none font-normal placeholder:text-neutral-400"
        />
        <div className="flex justify-end text-[11px] text-neutral-400 mt-1 font-normal">
          {description.length} / 500
        </div>
      </div>

      {/* Photo Upload Info */}
      <div className="p-4 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 flex flex-col items-center justify-center text-center">
        <UploadCloud className="w-5 h-5 text-neutral-400 mb-1.5" strokeWidth={1.5} />
        <span className="text-xs font-medium text-neutral-700">Product Photos</span>
        <span className="text-[11px] text-neutral-400 max-w-xs mt-0.5 font-normal">
          Photos will be stored on Supabase Storage (Max 3 photos, 2 MB each).
        </span>
      </div>

      <div className="pt-2 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-3.5 py-2 text-xs font-normal text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 text-xs font-medium text-white bg-ug-navy hover:bg-ug-navy-light rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {isPending ? 'Publishing...' : 'Publish Listing'}
        </button>
      </div>
    </form>
  );
}
