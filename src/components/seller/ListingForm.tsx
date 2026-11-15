'use client';

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Clock, UploadCloud, X, ImagePlus } from 'lucide-react';
import { createListing } from '@/actions/listing.actions';
import { createClient } from '@/lib/supabase/client';
import {
  MAX_LISTING_PHOTOS,
  MAX_PHOTO_SIZE_BYTES,
  STORAGE_BUCKET_PRODUCT_IMAGES,
  getErrorMessage,
  isSupabaseConfigured,
} from '@/lib/constants';
import type { Database } from '@/types/database.types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];

interface ListingFormProps {
  categories: CategoryRow[];
}

interface SelectedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

export function ListingForm({ categories }: ListingFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [price, setPrice] = useState('');
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [photos]);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setErrorMessage(null);
    const remainingSlots = MAX_LISTING_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      setErrorMessage(`You can upload up to ${MAX_LISTING_PHOTOS} photos per listing.`);
      return;
    }

    const validToAdd: SelectedPhoto[] = [];
    for (const file of files.slice(0, remainingSlots)) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Only image files (JPG, PNG, WebP) are allowed.');
        continue;
      }
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        setErrorMessage(`"${file.name}" exceeds the 2 MB size limit.`);
        continue;
      }
      validToAdd.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (validToAdd.length > 0) {
      setPhotos((prev) => [...prev, ...validToAdd]);
    }
    e.target.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const uploadPhotosToStorage = async (): Promise<string[]> => {
    if (photos.length === 0 || !isSupabaseConfigured()) {
      return [];
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to upload photos.');
    }

    const uploadedUrls: string[] = [];
    for (const item of photos) {
      const ext = item.file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET_PRODUCT_IMAGES)
        .upload(filePath, item.file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        throw new Error(`Failed to upload "${item.file.name}": ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET_PRODUCT_IMAGES)
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const parsedPrice = price.trim() === '' ? null : parseFloat(price);

    startTransition(async () => {
      try {
        let uploadedUrls: string[] = [];
        if (photos.length > 0) {
          setIsUploading(true);
          uploadedUrls = await uploadPhotosToStorage();
        }

        const result = await createListing({
          title,
          category_id: categoryId,
          price: parsedPrice,
          price_negotiable: priceNegotiable,
          description: description.trim() || undefined,
          photos: uploadedUrls,
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
      } catch (err: unknown) {
        setErrorMessage(getErrorMessage(err, 'Failed to publish listing.'));
      } finally {
        setIsUploading(false);
      }
    });
  };

  const busy = isPending || isUploading;

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

      {/* Interactive Photo Uploader */}
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-1.5">
          Product Photos (Up to {MAX_LISTING_PHOTOS})
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5 mb-2.5">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200/90 bg-neutral-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-medium bg-ug-navy/85 text-white px-1.5 py-0.5 rounded-md">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  aria-label="Remove photo"
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/90 text-neutral-700 hover:text-rose-600 flex items-center justify-center shadow-xs cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {photos.length < MAX_LISTING_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 hover:bg-neutral-50 flex flex-col items-center justify-center text-neutral-500 transition-colors cursor-pointer"
              >
                <ImagePlus className="w-5 h-5 mb-1 text-neutral-400" strokeWidth={1.5} />
                <span className="text-[11px] font-normal">Add Photo</span>
              </button>
            )}
          </div>
        )}

        {photos.length === 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 border border-dashed border-neutral-200 hover:border-ug-navy/40 rounded-xl bg-neutral-50/50 hover:bg-neutral-50 flex flex-col items-center justify-center text-center transition-colors cursor-pointer"
          >
            <UploadCloud className="w-5 h-5 text-neutral-400 mb-1.5" strokeWidth={1.5} />
            <span className="text-xs font-medium text-neutral-700">Tap to add product photos</span>
            <span className="text-[11px] text-neutral-400 max-w-xs mt-0.5 font-normal">
              JPG, PNG, or WebP &middot; Max {MAX_LISTING_PHOTOS} photos, 2 MB each
            </span>
          </button>
        )}
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
          disabled={busy}
          className="px-5 py-2 text-xs font-medium text-white bg-ug-navy hover:bg-ug-navy-light rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {isUploading ? 'Uploading photos...' : isPending ? 'Publishing...' : 'Publish Listing'}
        </button>
      </div>
    </form>
  );
}
