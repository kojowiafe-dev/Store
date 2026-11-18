export const PLATFORM_NAME = process.env.NEXT_PUBLIC_PLATFORM_NAME ?? 'Campus Store';
export const CAMPUS_NAME = process.env.NEXT_PUBLIC_CAMPUS_NAME ?? 'University of Ghana';

export const PILOT_HALL = {
  id: '00000000-0000-0000-0000-000000000010',
  name: 'Jean Nelson AKA Hall',
  shortName: 'Jean Nelson AKA',
  slug: process.env.NEXT_PUBLIC_DEFAULT_HALL_SLUG ?? 'jean-nelson-aka-hall',
} as const;

export const DEFAULT_CURRENCY = 'GHS';
export const MAX_LISTING_PHOTOS = 3;
export const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const STORAGE_BUCKET_PRODUCT_IMAGES = 'product-images';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return false;
  if (url.includes('your-project-ref') || key.includes('your-anon-key')) return false;
  return true;
}

export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

