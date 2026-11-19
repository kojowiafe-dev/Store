'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServerDbClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getErrorMessage } from '@/lib/constants';
import type { ActionResult } from '@/types/api.types';

async function verifyAdminUser(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: 'Unauthorized.' };
  }

  const db = await createServerDbClient();
  const { data: profile } = await db
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return { ok: false, error: 'Administrator access required.' };
  }

  return { ok: true, userId: user.id };
}

export async function approveSeller(
  sellerProfileId: string
): Promise<ActionResult<{ approved: boolean }>> {
  try {
    const auth = await verifyAdminUser();
    if (!auth.ok) return { success: false, error: auth.error };

    const adminClient = createAdminClient();
    const now = new Date().toISOString();

    const { error: updateError } = await adminClient
      .from('seller_profiles')
      .update({
        is_approved: true,
        approved_at: now,
        approved_by: auth.userId,
        updated_at: now,
      })
      .eq('id', sellerProfileId);

    if (updateError) return { success: false, error: updateError.message };

    revalidatePath('/admin/sellers');
    revalidatePath('/');

    return { success: true, data: { approved: true } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to approve seller.') };
  }
}

export async function takedownListing(
  listingId: string,
  reason: string
): Promise<ActionResult<{ removed: boolean }>> {
  try {
    const auth = await verifyAdminUser();
    if (!auth.ok) return { success: false, error: auth.error };

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
      actor_id: auth.userId,
      event_type: 'admin_takedown',
      payload: { reason },
    });

    revalidatePath('/');
    return { success: true, data: { removed: true } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to takedown listing.') };
  }
}
