import { createClient, createServerDbClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/constants';

export interface ViewerContext {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
  seller: {
    id: string;
    store_name: string;
    storefront_slug: string;
    is_approved: boolean;
  } | null;
}

const GUEST_VIEWER: ViewerContext = {
  isAuthenticated: false,
  userId: null,
  email: null,
  isAdmin: false,
  seller: null,
};

export async function getCurrentViewer(): Promise<ViewerContext> {
  try {
    if (!isSupabaseConfigured()) {
      return GUEST_VIEWER;
    }

    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return GUEST_VIEWER;
    }

    const db = await createServerDbClient();
    const [profileRes, sellerRes] = await Promise.all([
      db.from('profiles').select('is_admin').eq('id', user.id).maybeSingle(),
      db
        .from('seller_profiles')
        .select('id, store_name, storefront_slug, is_approved')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    return {
      isAuthenticated: true,
      userId: user.id,
      email: user.email ?? null,
      isAdmin: Boolean(profileRes.data?.is_admin),
      seller: sellerRes.data
        ? {
            id: sellerRes.data.id,
            store_name: sellerRes.data.store_name,
            storefront_slug: sellerRes.data.storefront_slug,
            is_approved: sellerRes.data.is_approved,
          }
        : null,
    };
  } catch {
    return GUEST_VIEWER;
  }
}

