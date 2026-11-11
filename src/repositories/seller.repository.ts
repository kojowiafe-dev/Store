import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

export type SellerProfileRow = Database['public']['Tables']['seller_profiles']['Row'];

export interface StorefrontDetails {
  id: string;
  store_name: string;
  storefront_slug: string;
  store_description: string | null;
  storefront_image_url: string | null;
  is_approved: boolean;
  hall_name: string;
  hall_slug: string;
  whatsapp_number: string;
  seller_display_name: string;
  user_id: string;
}

export const FALLBACK_STOREFRONTS: Record<string, StorefrontDetails> = {
  'amas-kitchen': {
    id: 's1000000-0000-0000-0000-000000000001',
    store_name: "Ama's Kitchen",
    storefront_slug: 'amas-kitchen',
    store_description: 'Fresh, warm homemade student meals delivered hot to Jean Nelson AKA Hall.',
    storefront_image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=400&q=80',
    is_approved: true,
    hall_name: 'Jean Nelson Aka Hall',
    hall_slug: 'jean-nelson-aka-hall',
    whatsapp_number: '+233501234567',
    seller_display_name: 'Ama Osei',
    user_id: '00000000-0000-0000-0000-000000000001',
  },
  'vandals-chow': {
    id: 's1000000-0000-0000-0000-000000000002',
    store_name: 'Vandals Chow',
    storefront_slug: 'vandals-chow',
    store_description: 'Authentic waakye, fried yam and spicy snacks for Aka Hall residents.',
    storefront_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
    is_approved: true,
    hall_name: 'Jean Nelson Aka Hall',
    hall_slug: 'jean-nelson-aka-hall',
    whatsapp_number: '+233509876543',
    seller_display_name: 'Kwame Mensah',
    user_id: '00000000-0000-0000-0000-000000000002',
  },
  'kofi-vintage': {
    id: 's1000000-0000-0000-0000-000000000003',
    store_name: 'Kofi Vintage Wardrobe',
    storefront_slug: 'kofi-vintage',
    store_description: 'Curated thrift wear, oversized denim, sneakers and vintage graphic tees.',
    storefront_image_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80',
    is_approved: true,
    hall_name: 'Jean Nelson Aka Hall',
    hall_slug: 'jean-nelson-aka-hall',
    whatsapp_number: '+233541112233',
    seller_display_name: 'Kofi Addo',
    user_id: '00000000-0000-0000-0000-000000000003',
  },
  'legon-tech-hub': {
    id: 's1000000-0000-0000-0000-000000000004',
    store_name: 'Legon Tech Hub',
    storefront_slug: 'legon-tech-hub',
    store_description: 'Fast chargers, power banks, cables, earplugs and student computer peripherals.',
    storefront_image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=400&q=80',
    is_approved: true,
    hall_name: 'Jean Nelson Aka Hall',
    hall_slug: 'jean-nelson-aka-hall',
    whatsapp_number: '+233203334455',
    seller_display_name: 'David Boateng',
    user_id: '00000000-0000-0000-0000-000000000004',
  },
};

export async function getStorefrontBySlug(slug: string): Promise<StorefrontDetails | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return FALLBACK_STOREFRONTS[slug] ?? null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('seller_profiles')
      .select(`
        id,
        store_name,
        storefront_slug,
        store_description,
        storefront_image_url,
        is_approved,
        user_id,
        halls (
          name,
          slug
        ),
        profiles:user_id (
          display_name,
          whatsapp_number
        )
      `)
      .eq('storefront_slug', slug)
      .eq('is_approved', true)
      .single();

    if (error || !data) {
      return FALLBACK_STOREFRONTS[slug] ?? null;
    }

    const hallData = data.halls as unknown as { name: string; slug: string } | null;
    const profileData = data.profiles as unknown as { display_name: string; whatsapp_number: string } | null;

    return {
      id: data.id,
      store_name: data.store_name,
      storefront_slug: data.storefront_slug,
      store_description: data.store_description,
      storefront_image_url: data.storefront_image_url,
      is_approved: data.is_approved,
      hall_name: hallData?.name ?? 'Jean Nelson Aka Hall',
      hall_slug: hallData?.slug ?? 'jean-nelson-aka-hall',
      whatsapp_number: profileData?.whatsapp_number ?? '+233501234567',
      seller_display_name: profileData?.display_name ?? data.store_name,
      user_id: data.user_id,
    };
  } catch {
    return FALLBACK_STOREFRONTS[slug] ?? null;
  }
}

export async function getSellerProfileByUserId(userId: string): Promise<SellerProfileRow | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

