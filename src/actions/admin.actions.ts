'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ActionResult } from '@/types/api.types';

export async function approveSeller(sellerProfileId: string): Promise<ActionResult<{ approved: boolean }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { success: false, error: 'Unauthorized.' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return { success: false, error: 'Administrator access required.' };
    }

    const adminClient = createAdminClient();
    const now = new Date().toISOString();

    const { error: updateError } = await adminClient
      .from('seller_profiles')
      .update({
        is_approved: true,
        approved_at: now,
        approved_by: user.id,
        updated_at: now,
      })
      .eq('id', sellerProfileId);

    if (updateError) return { success: false, error: updateError.message };

    revalidatePath('/admin/sellers');
    revalidatePath('/');

    return { success: true, data: { approved: true } };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to approve seller.' };
  }
}

export async function takedownListing(
  listingId: string,
  reason: string
): Promise<ActionResult<{ removed: boolean }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { success: false, error: 'Unauthorized.' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return { success: false, error: 'Administrator access required.' };
    }

    const adminClient = createAdminClient();
    const now = new Date().toISOString();

    const { error: updateError } = await adminClient
      .from('listings')
      .update({
        availability_status: 'REMOVED',
        deleted_at: now,
        updated_at: now,
      })
      .eq('id', listingId);

    if (updateError) return { success: false, error: updateError.message };

    await adminClient.from('listing_events').insert({
      listing_id: listingId,
      actor_id: user.id,
      event_type: 'admin_takedown',
      payload: { reason },
    });

    revalidatePath('/');
    return { success: true, data: { removed: true } };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to takedown listing.' };
  }
}

