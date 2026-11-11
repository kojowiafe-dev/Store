import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

export type CategoryRow = Database['public']['Tables']['categories']['Row'];

// Hardcoded fallback categories for offline/unseeded environments
export const FALLBACK_CATEGORIES: CategoryRow[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    name: 'Food & Snacks',
    slug: 'food-snacks',
    icon: 'food-snacks',
    sort_order: 10,
    default_expiry_hours: 12,
    default_confirm_lead_hours: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    name: 'Groceries',
    slug: 'groceries',
    icon: 'groceries',
    sort_order: 20,
    default_expiry_hours: 48,
    default_confirm_lead_hours: 6,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    name: 'Clothing & Accessories',
    slug: 'clothing',
    icon: 'clothing',
    sort_order: 30,
    default_expiry_hours: 168,
    default_confirm_lead_hours: 24,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    name: 'Personal Care',
    slug: 'personal-care',
    icon: 'personal-care',
    sort_order: 40,
    default_expiry_hours: 168,
    default_confirm_lead_hours: 24,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c1000000-0000-0000-0000-000000000005',
    name: 'Electronics',
    slug: 'electronics',
    icon: 'electronics',
    sort_order: 50,
    default_expiry_hours: 168,
    default_confirm_lead_hours: 24,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c1000000-0000-0000-0000-000000000006',
    name: 'Services',
    slug: 'services',
    icon: 'services',
    sort_order: 60,
    default_expiry_hours: 336,
    default_confirm_lead_hours: 48,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function getActiveCategories(): Promise<CategoryRow[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return FALLBACK_CATEGORIES;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_CATEGORIES;
    }

    return data;
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const categories = await getActiveCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

