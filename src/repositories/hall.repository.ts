import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured, PILOT_HALL } from '@/lib/constants';
import type { Database } from '@/types/database.types';

export type HallRow = Database['public']['Tables']['halls']['Row'];

const UNIVERSITY_ID = '00000000-0000-0000-0000-000000000001';

export const FALLBACK_HALLS: HallRow[] = [
  {
    id: PILOT_HALL.id,
    university_id: UNIVERSITY_ID,
    name: PILOT_HALL.name,
    slug: PILOT_HALL.slug,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000011',
    university_id: UNIVERSITY_ID,
    name: 'Commonwealth Hall',
    slug: 'commonwealth',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000012',
    university_id: UNIVERSITY_ID,
    name: 'Volta Hall',
    slug: 'volta',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000013',
    university_id: UNIVERSITY_ID,
    name: 'Legon Hall',
    slug: 'legon',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000014',
    university_id: UNIVERSITY_ID,
    name: 'Akuafo Hall',
    slug: 'akuafo',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function getActiveHalls(): Promise<HallRow[]> {
  try {
    if (!isSupabaseConfigured()) {
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
