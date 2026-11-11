import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

export type HallRow = Database['public']['Tables']['halls']['Row'];

export const FALLBACK_HALLS: HallRow[] = [
  {
    id: 'h1000000-0000-0000-0000-000000000001',
    university_id: 'u1000000-0000-0000-0000-000000000001',
    name: 'Jean Nelson Aka Hall',
    slug: 'jean-nelson-aka-hall',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'h1000000-0000-0000-0000-000000000002',
    university_id: 'u1000000-0000-0000-0000-000000000001',
    name: 'Commonwealth Hall',
    slug: 'commonwealth-hall',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'h1000000-0000-0000-0000-000000000003',
    university_id: 'u1000000-0000-0000-0000-000000000001',
    name: 'Volta Hall',
    slug: 'volta-hall',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'h1000000-0000-0000-0000-000000000004',
    university_id: 'u1000000-0000-0000-0000-000000000001',
    name: 'Legon Hall',
    slug: 'legon-hall',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'h1000000-0000-0000-0000-000000000005',
    university_id: 'u1000000-0000-0000-0000-000000000001',
    name: 'Mensah Sarbah Hall',
    slug: 'mensah-sarbah-hall',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function getActiveHalls(): Promise<HallRow[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return FALLBACK_HALLS;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('halls')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_HALLS;
    }

    return data;
  } catch {
    return FALLBACK_HALLS;
  }
}

export async function getHallBySlug(slug: string): Promise<HallRow | null> {
  const halls = await getActiveHalls();
  return halls.find((h) => h.slug === slug) ?? null;
}
