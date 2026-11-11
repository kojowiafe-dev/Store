import { createClient } from '@/lib/supabase/server';
import type {
  PublicListingCardDTO,
  MarketplaceSearchParams,
  PaginatedResponse,
} from '@/types/api.types';
import type { ListingAvailabilityStatus } from '@/types/database.types';

export interface ListingDetailDTO extends PublicListingCardDTO {
  whatsapp_number: string;
  seller_id: string;
  category_id: string;
  confirm_before: string | null;
  expires_at: string | null;
  images: Array<{
    id: string;
    storage_path: string;
    display_order: number;
    is_primary: boolean;
  }>;
}

// Fallback seed listings for preview / unseeded local state
const FALLBACK_LISTINGS: ListingDetailDTO[] = [
  {
    id: 'l1000000-0000-0000-0000-000000000001',
    slug: 'hot-jollof-chicken-shito-8f1',
    title: 'Hot Jollof Rice with Grilled Chicken & Shito',
    description: 'Freshly prepared tasty Ghana jollof rice served hot with spicy grilled chicken thigh, boiled egg and homemade black shito.',
    price: 35.0,
    price_negotiable: false,
    currency: 'GHS',
    availability_status: 'AVAILABLE' as ListingAvailabilityStatus,
    category_name: 'Food & Snacks',
    category_slug: 'food-snacks',
    category_icon: null,
    category_id: 'c1000000-0000-0000-0000-000000000001',
    seller_id: 's1000000-0000-0000-0000-000000000001',
    seller_store_name: "Ama's Kitchen",
    storefront_slug: 'amas-kitchen',
    hall_name: 'Jean Nelson Aka Hall',
    whatsapp_number: '+233501234567',
    primary_image_path: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    confirm_before: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    images: [
      {
        id: 'img-1',
        storage_path: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        display_order: 1,
        is_primary: true,
      },
    ],
  },
  {
    id: 'l1000000-0000-0000-0000-000000000002',
    slug: 'fried-plantain-beans-redred-a4c',
    title: 'Red Red (Beans Stew with Fried Sweet Plantain & Gari)',
    description: 'Rich slow-cooked black-eyed beans in spiced palm oil stew with fried ripe plantain slices and seasoned gari.',
    price: 25.0,
    price_negotiable: false,
    currency: 'GHS',
    availability_status: 'AVAILABLE' as ListingAvailabilityStatus,
    category_name: 'Food & Snacks',
    category_slug: 'food-snacks',
    category_icon: null,
    category_id: 'c1000000-0000-0000-0000-000000000001',
    seller_id: 's1000000-0000-0000-0000-000000000001',
    seller_store_name: "Ama's Kitchen",
    storefront_slug: 'amas-kitchen',
    hall_name: 'Jean Nelson Aka Hall',
    whatsapp_number: '+233501234567',
    primary_image_path: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
    confirm_before: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    images: [
      {
        id: 'img-2',
        storage_path: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
        display_order: 1,
        is_primary: true,
      },
    ],
  },
  {
    id: 'l1000000-0000-0000-0000-000000000003',
    slug: 'waakye-combo-wele-egg-b2a',
    title: 'Waakye Combo with Egg, Wele, Fish & Spaghetti',
    description: 'Hot authentic waakye with talia (spaghetti), gari foto, boiled egg, soft wele, and fried fish with fiery shito.',
    price: 30.0,
    price_negotiable: false,
    currency: 'GHS',
    availability_status: 'NEEDS_CONFIRMATION' as ListingAvailabilityStatus,
    category_name: 'Food & Snacks',
    category_slug: 'food-snacks',
    category_icon: null,
    category_id: 'c1000000-0000-0000-0000-000000000001',
    seller_id: 's1000000-0000-0000-0000-000000000002',
    seller_store_name: 'Vandals Chow',
    storefront_slug: 'vandals-chow',
    hall_name: 'Jean Nelson Aka Hall',
    whatsapp_number: '+233509876543',
    primary_image_path: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    confirm_before: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    images: [
      {
        id: 'img-3',
        storage_path: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
        display_order: 1,
        is_primary: true,
      },
    ],
  },
  {
    id: 'l1000000-0000-0000-0000-000000000004',
    slug: 'vintage-thrift-denim-jacket-c7e',
    title: 'Vintage Levi’s Denim Jacket (Oversized, Size L)',
    description: 'Clean authentic light-wash denim jacket in excellent vintage condition. Fits medium to large oversized.',
    price: 120.0,
    price_negotiable: true,
    currency: 'GHS',
    availability_status: 'AVAILABLE' as ListingAvailabilityStatus,
    category_name: 'Clothing & Accessories',
    category_slug: 'clothing',
    category_icon: null,
    category_id: 'c1000000-0000-0000-0000-000000000003',
    seller_id: 's1000000-0000-0000-0000-000000000003',
    seller_store_name: 'Kofi Vintage Wardrobe',
    storefront_slug: 'kofi-vintage',
    hall_name: 'Jean Nelson Aka Hall',
    whatsapp_number: '+233541112233',
    primary_image_path: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
    confirm_before: new Date(Date.now() + 144 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 168 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    images: [
      {
        id: 'img-4',
        storage_path: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
        display_order: 1,
        is_primary: true,
      },
    ],
  },
  {
    id: 'l1000000-0000-0000-0000-000000000005',
    slug: 'usb-c-fast-charger-65w-f3d',
    title: 'Baseus 65W GaN Fast Charger (Type-C + USB)',
    description: 'Brand new high-speed charger suitable for laptops, MacBooks, iPhones, Samsung and tablets. UK plug.',
    price: 180.0,
    price_negotiable: false,
    currency: 'GHS',
    availability_status: 'AVAILABLE' as ListingAvailabilityStatus,
    category_name: 'Electronics',
    category_slug: 'electronics',
    category_icon: null,
    category_id: 'c1000000-0000-0000-0000-000000000005',
    seller_id: 's1000000-0000-0000-0000-000000000004',
    seller_store_name: 'Legon Tech Hub',
    storefront_slug: 'legon-tech-hub',
    hall_name: 'Jean Nelson Aka Hall',
    whatsapp_number: '+233203334455',
    primary_image_path: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    confirm_before: new Date(Date.now() + 144 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 168 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    images: [
      {
        id: 'img-5',
        storage_path: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
        display_order: 1,
        is_primary: true,
      },
    ],
  },
  {
    id: 'l1000000-0000-0000-0000-000000000006',
    slug: 'vanilla-fragrance-mist-d9a',
    title: 'Victoria’s Secret Bare Vanilla Body Mist (250ml)',
    description: 'Original long-lasting sweet whipped vanilla and soft cashmere mist. Sealed and authentic.',
    price: 95.0,
    price_negotiable: false,
    currency: 'GHS',
    availability_status: 'AVAILABLE' as ListingAvailabilityStatus,
    category_name: 'Personal Care',
    category_slug: 'personal-care',
    category_icon: null,
    category_id: 'c1000000-0000-0000-0000-000000000004',
    seller_id: 's1000000-0000-0000-0000-000000000001',
    seller_store_name: "Ama's Kitchen",
    storefront_slug: 'amas-kitchen',
    hall_name: 'Jean Nelson Aka Hall',
    whatsapp_number: '+233501234567',
    primary_image_path: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
    confirm_before: new Date(Date.now() + 144 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 168 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    images: [
      {
        id: 'img-6',
        storage_path: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
        display_order: 1,
        is_primary: true,
      },
    ],
  },
  {
    id: 'l1000000-0000-0000-0000-000000000007',
    slug: 'laptop-format-software-install-e1b',
    title: 'Laptop Windows Reinstall, SSD Upgrade & Data Recovery',
    description: 'On-campus IT support for Jean Nelson Aka Hall students. Full OS install, Microsoft Office setup, and speed tune-ups.',
    price: null,
    price_negotiable: true,
    currency: 'GHS',
    availability_status: 'AVAILABLE' as ListingAvailabilityStatus,
    category_name: 'Services',
    category_slug: 'services',
    category_icon: null,
    category_id: 'c1000000-0000-0000-0000-000000000006',
    seller_id: 's1000000-0000-0000-0000-000000000004',
    seller_store_name: 'Legon Tech Hub',
    storefront_slug: 'legon-tech-hub',
    hall_name: 'Jean Nelson Aka Hall',
    whatsapp_number: '+233203334455',
    primary_image_path: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
    confirm_before: new Date(Date.now() + 288 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 336 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    images: [
      {
        id: 'img-7',
        storage_path: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
        display_order: 1,
        is_primary: true,
      },
    ],
  },
];

export async function getMarketplaceListings(
  params: MarketplaceSearchParams = {}
): Promise<PaginatedResponse<PublicListingCardDTO>> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, Math.max(1, params.limit ?? 20));
  const offset = (page - 1) * limit;

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return filterFallbackListings(params, page, limit);
    }

    const supabase = await createClient();

    let query = supabase
      .from('listings')
      .select(
        `
        id,
        slug,
        title,
        description,
        price,
        price_negotiable,
        currency,
        availability_status,
        created_at,
        categories!inner (
          name,
          slug,
          icon
        ),
        seller_profiles!inner (
          store_name,
          storefront_slug,
          is_approved,
          halls!inner (
            name,
            slug
          )
        ),
        listing_images (
          storage_path,
          is_primary
        )
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .in('availability_status', ['AVAILABLE', 'NEEDS_CONFIRMATION'])
      .eq('seller_profiles.is_approved', true);

    // Apply category filter if provided and not 'all'
    if (params.category && params.category !== 'all') {
      query = query.eq('categories.slug', params.category);
    }

    // Apply hall filter if provided and not 'all'
    if (params.hall && params.hall !== 'all') {
      query = query.eq('seller_profiles.halls.slug', params.hall);
    }

    // Apply search filter
    if (params.q && params.q.trim().length > 0) {
      const searchTerm = params.q.trim();
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Expiry check: expires_at is null or in the future
    const nowIso = new Date().toISOString();
    query = query.or(`expires_at.is.null,expires_at.gt.${nowIso}`);

    // Sorting
    if (params.sort === 'price_asc') {
      query = query.order('price', { ascending: true, nullsFirst: false });
    } else if (params.sort === 'price_desc') {
      query = query.order('price', { ascending: false, nullsFirst: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error || !data || data.length === 0) {
      return filterFallbackListings(params, page, limit);
    }

    const total = count ?? data.length;
    const cards: PublicListingCardDTO[] = data.map((item: any) => {
      const primaryImage =
        item.listing_images?.find((img: any) => img.is_primary)?.storage_path ??
        item.listing_images?.[0]?.storage_path ??
        null;

      return {
        id: item.id,
        slug: item.slug,
        title: item.title,
        description: item.description,
        price: item.price,
        price_negotiable: item.price_negotiable,
        currency: item.currency,
        availability_status: item.availability_status,
        category_name: item.categories.name,
        category_slug: item.categories.slug,
        category_icon: item.categories.icon,
        seller_store_name: item.seller_profiles.store_name,
        storefront_slug: item.seller_profiles.storefront_slug,
        hall_name: item.seller_profiles.halls.name,
        primary_image_path: primaryImage,
        created_at: item.created_at,
      };
    });

    return {
      data: cards,
      total,
      page,
      limit,
      hasMore: offset + cards.length < total,
    };
  } catch {
    return filterFallbackListings(params, page, limit);
  }
}

export async function getListingBySlug(slug: string): Promise<ListingDetailDTO | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return FALLBACK_LISTINGS.find((item) => item.slug === slug) ?? null;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('listings')
      .select(`
        id,
        slug,
        title,
        description,
        price,
        price_negotiable,
        currency,
        availability_status,
        confirm_before,
        expires_at,
        created_at,
        seller_id,
        category_id,
        categories (
          name,
          slug,
          icon
        ),
        seller_profiles (
          store_name,
          storefront_slug,
          user_id,
          halls (
            name,
            slug
          ),
          profiles:user_id (
            whatsapp_number
          )
        ),
        listing_images (
          id,
          storage_path,
          display_order,
          is_primary
        )
      `)
      .eq('slug', slug)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return FALLBACK_LISTINGS.find((item) => item.slug === slug) ?? null;
    }

    const seller = data.seller_profiles as any;
    const profile = seller?.profiles as any;
    const hall = seller?.halls as any;
    const category = data.categories as any;
    const images = (data.listing_images as any[]) ?? [];

    const primaryImage =
      images.find((img) => img.is_primary)?.storage_path ?? images[0]?.storage_path ?? null;

    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      description: data.description,
      price: data.price,
      price_negotiable: data.price_negotiable,
      currency: data.currency,
      availability_status: data.availability_status as ListingAvailabilityStatus,
      category_name: category?.name ?? 'General',
      category_slug: category?.slug ?? 'general',
      category_icon: null,
      category_id: data.category_id,
      seller_id: data.seller_id,
      seller_store_name: seller?.store_name ?? 'Student Store',
      storefront_slug: seller?.storefront_slug ?? 'store',
      hall_name: hall?.name ?? 'Jean Nelson Aka Hall',
      whatsapp_number: profile?.whatsapp_number ?? '+233501234567',
      primary_image_path: primaryImage,
      confirm_before: data.confirm_before,
      expires_at: data.expires_at,
      created_at: data.created_at,
      images: images.sort((a, b) => a.display_order - b.display_order),
    };
  } catch {
    return FALLBACK_LISTINGS.find((item) => item.slug === slug) ?? null;
  }
}

export async function getListingsByStorefrontSlug(
  storefrontSlug: string,
  includeUnavailable: boolean = false
): Promise<PublicListingCardDTO[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return FALLBACK_LISTINGS.filter(
        (l) =>
          l.storefront_slug === storefrontSlug &&
          (includeUnavailable ||
            l.availability_status === 'AVAILABLE' ||
            l.availability_status === 'NEEDS_CONFIRMATION')
      );
    }

    const supabase = await createClient();

    let query = supabase
      .from('listings')
      .select(`
        id,
        slug,
        title,
        description,
        price,
        price_negotiable,
        currency,
        availability_status,
        created_at,
        categories!inner (
          name,
          slug,
          icon
        ),
        seller_profiles!inner (
          store_name,
          storefront_slug,
          halls!inner (
            name,
            slug
          )
        ),
        listing_images (
          storage_path,
          is_primary
        )
      `)
      .eq('seller_profiles.storefront_slug', storefrontSlug)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!includeUnavailable) {
      query = query.in('availability_status', ['AVAILABLE', 'NEEDS_CONFIRMATION']);
    }

    const { data, error } = await query;

    if (error || !data) {
      return FALLBACK_LISTINGS.filter((l) => l.storefront_slug === storefrontSlug);
    }

    return data.map((item: any) => {
      const primaryImage =
        item.listing_images?.find((img: any) => img.is_primary)?.storage_path ??
        item.listing_images?.[0]?.storage_path ??
        null;

      return {
        id: item.id,
        slug: item.slug,
        title: item.title,
        description: item.description,
        price: item.price,
        price_negotiable: item.price_negotiable,
        currency: item.currency,
        availability_status: item.availability_status,
        category_name: item.categories.name,
        category_slug: item.categories.slug,
        category_icon: item.categories.icon,
        seller_store_name: item.seller_profiles.store_name,
        storefront_slug: item.seller_profiles.storefront_slug,
        hall_name: item.seller_profiles.halls.name,
        primary_image_path: primaryImage,
        created_at: item.created_at,
      };
    });
  } catch {
    return FALLBACK_LISTINGS.filter((l) => l.storefront_slug === storefrontSlug);
  }
}

// In-memory filter helper for fallback mode
function filterFallbackListings(
  params: MarketplaceSearchParams,
  page: number,
  limit: number
): PaginatedResponse<PublicListingCardDTO> {
  let filtered = FALLBACK_LISTINGS.filter(
    (item) => item.availability_status === 'AVAILABLE' || item.availability_status === 'NEEDS_CONFIRMATION'
  );

  if (params.category && params.category !== 'all') {
    filtered = filtered.filter((item) => item.category_slug === params.category);
  }

  if (params.q && params.q.trim()) {
    const qLower = params.q.trim().toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(qLower) ||
        (item.description && item.description.toLowerCase().includes(qLower))
    );
  }

  if (params.sort === 'price_asc') {
    filtered.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  } else if (params.sort === 'price_desc') {
    filtered.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  } else {
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    data: paginated,
    total,
    page,
    limit,
    hasMore: offset + paginated.length < total,
  };
}
