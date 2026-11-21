import type { ListingAvailabilityStatus, StoreOperatingStatus } from './database.types';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export interface PublicListingCardDTO {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number | null;
  price_negotiable: boolean;
  currency: string;
  availability_status: ListingAvailabilityStatus;
  category_name: string;
  category_slug: string;
  category_icon: string | null;
  seller_store_name: string;
  storefront_slug: string;
  hall_name: string;
  whatsapp_number: string;
  primary_image_path: string | null;
  created_at: string;
  store_status?: StoreOperatingStatus;
  operating_hours_note?: string | null;
  primary_pickup_spot?: string | null;
  ug_student_verified?: boolean;
}

export interface PublicStorefrontDTO {
  id: string;
  store_name: string;
  storefront_slug: string;
  store_description: string | null;
  storefront_image_url: string | null;
  hall_name: string;
  whatsapp_number: string;
  store_status?: StoreOperatingStatus;
  operating_hours_note?: string | null;
  primary_pickup_spot?: string | null;
  ug_student_verified?: boolean;
  listings: PublicListingCardDTO[];
}

export interface MarketplaceSearchParams {
  q?: string;
  category?: string;
  hall?: string;
  sort?: 'recent' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

