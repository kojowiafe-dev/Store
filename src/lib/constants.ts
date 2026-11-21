export const PLATFORM_NAME = process.env.NEXT_PUBLIC_PLATFORM_NAME ?? 'Campus Store';
export const CAMPUS_NAME = process.env.NEXT_PUBLIC_CAMPUS_NAME ?? 'University of Ghana';

export const PILOT_HALL = {
  id: '00000000-0000-0000-0000-000000000010',
  name: 'Jean Nelson AKA Hall',
  shortName: 'Jean Nelson AKA',
  slug: process.env.NEXT_PUBLIC_DEFAULT_HALL_SLUG ?? 'jean-nelson-aka-hall',
} as const;

export const UG_STUDENT_EMAIL_DOMAIN = '@st.ug.edu.gh';

export function isUgStudentEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(UG_STUDENT_EMAIL_DOMAIN);
}

export const PRESET_PICKUP_SPOTS = [
  "Jean Nelson Porter's Lodge",
  'Jean Nelson Block A Common Room',
  'Jean Nelson Block B Common Room',
  'Jean Nelson Block C Common Room',
  'Jean Nelson Block D Common Room',
  'Jean Nelson Bush Canteen Walkway',
  'Balme Library Drop-off',
  'Room Delivery (Inside Hall)',
] as const;

export const STORE_STATUS_META = {
  OPEN_NOW: {
    label: 'Open Now',
    shortLabel: 'Open',
    description: 'Available & taking WhatsApp orders right now',
  },
  PRE_ORDER: {
    label: 'Pre-Order',
    shortLabel: 'Pre-Order',
    description: 'Taking advance orders for the next batch',
  },
  CLOSED: {
    label: 'Closed',
    shortLabel: 'Closed',
    description: 'Closed for now — message for next restock',
  },
} as const;

export const DEFAULT_CURRENCY = 'GHS';
export const MAX_LISTING_PHOTOS = 3;
export const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const STORAGE_BUCKET_PRODUCT_IMAGES = 'product-images';

export const ADMIN_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? '+233240000000';

export interface AdPackage {
  id: string;
  name: string;
  badge: string;
  priceGhs: number;
  durationLabel: string;
  summary: string;
  perks: string[];
  popular?: boolean;
}

export const AD_PACKAGES: AdPackage[] = [
  {
    id: 'product-boost',
    name: 'Featured Product Boost',
    badge: 'Quick Sales',
    priceGhs: 25,
    durationLabel: '3 Days',
    summary: 'Pin a high-demand meal, thrift item, or gadget to the top of the Jean Nelson AKA Hall feed.',
    perks: [
      'Priority placement above standard listings',
      'Highlighted Featured badge on your product card',
      'Ideal for daily food specials & flash stock',
    ],
  },
  {
    id: 'storefront-spotlight',
    name: 'Top Storefront Spotlight',
    badge: 'Most Popular',
    priceGhs: 50,
    durationLabel: '7 Days',
    summary: 'Feature your store first in the Hall Stores bar and boost up to 3 products simultaneously.',
    perks: [
      'First position in the homepage Hall Stores strip',
      'Up to 3 listings boosted in the discovery feed',
      'Direct store share card for WhatsApp groups',
    ],
    popular: true,
  },
  {
    id: 'hall-banner-blast',
    name: 'Hall Hero Banner Ad',
    badge: 'Maximum Reach',
    priceGhs: 90,
    durationLabel: '7 Days',
    summary: 'Premium placement on the Campus Store homepage header seen by every student visitor.',
    perks: [
      'Dedicated homepage spotlight banner for your brand',
      'Priority placement across all your active items',
      'Direct one-tap WhatsApp CTA from the top banner',
    ],
  },
];

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
