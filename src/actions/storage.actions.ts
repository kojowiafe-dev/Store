'use server';

import { createClient, createServerDbClient } from '@/lib/supabase/server';
import {
  MAX_LISTING_PHOTOS,
  MAX_PHOTO_SIZE_BYTES,
  STORAGE_BUCKET_PRODUCT_IMAGES,
  getErrorMessage,
  isSupabaseConfigured,
} from '@/lib/constants';
import type { ActionResult } from '@/types/api.types';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function uploadListingPhotos(
  formData: FormData
): Promise<ActionResult<{ urls: string[] }>> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true, data: { urls: [] } };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be signed in to upload photos.' };
    }

    const rawFiles = formData.getAll('files');
    const files = rawFiles.filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return { success: true, data: { urls: [] } };
    }

    if (files.length > MAX_LISTING_PHOTOS) {
      return {
        success: false,
        error: `You can upload at most ${MAX_LISTING_PHOTOS} photos per listing.`,
      };
    }

    const db = await createServerDbClient();

    // Ensure the public bucket exists when running with service role credentials
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: buckets } = await db.storage.listBuckets();
      const hasBucket = buckets?.some((b) => b.name === STORAGE_BUCKET_PRODUCT_IMAGES);
      if (!hasBucket) {
        await db.storage.createBucket(STORAGE_BUCKET_PRODUCT_IMAGES, {
          public: true,
          fileSizeLimit: MAX_PHOTO_SIZE_BYTES,
          allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
        });
      }
    }

    const urls: string[] = [];

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return {
          success: false,
          error: `"${file.name}" is not a supported image type. Use JPG, PNG, or WebP.`,
        };
      }

      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        return {
          success: false,
          error: `"${file.name}" exceeds the 2 MB size limit.`,
        };
      }

      const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();

      const { error: uploadError } = await db.storage
        .from(STORAGE_BUCKET_PRODUCT_IMAGES)
        .upload(filePath, Buffer.from(arrayBuffer), {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return {
          success: false,
          error: `Failed to upload "${file.name}": ${uploadError.message}`,
        };
      }

      const { data: publicUrlData } = db.storage
        .from(STORAGE_BUCKET_PRODUCT_IMAGES)
        .getPublicUrl(filePath);

      urls.push(publicUrlData.publicUrl);
    }

    return { success: true, data: { urls } };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, 'Failed to upload product photos.'),
    };
  }
}

