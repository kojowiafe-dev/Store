'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServerDbClient } from '@/lib/supabase/server';
import { ensurePilotReferenceData } from '@/actions/auth.actions';
import { getErrorMessage, isSupabaseConfigured, isUgStudentEmail } from '@/lib/constants';
import {
  CreateSellerProfileSchema,
  UpdateSellerProfileSchema,
  UpdateStoreStatusSchema,
  type CreateSellerProfileInput,
  type UpdateSellerProfileInput,
  type UpdateStoreStatusInput,
} from '@/schemas/seller.schema';
import type { ActionResult } from '@/types/api.types';
import type { StoreOperatingStatus } from '@/types/database.types';

export async function createSellerProfile(
  rawInput: CreateSellerProfileInput
): Promise<ActionResult<{ id: string; storefront_slug: string }>> {
  try {
    const parseResult = CreateSellerProfileSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed.',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const input = parseResult.data;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be signed in to create a storefront.' };
    }

    const db = await createServerDbClient();
    await ensurePilotReferenceData(db);

    // Check if user already has a storefront
    const { data: existing } = await db
      .from('seller_profiles')
      .select('id, storefront_slug')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: 'You already have an established storefront for this account.',
      };
    }

    // Check if slug is unique
    const { data: slugConflict } = await db
      .from('seller_profiles')
      .select('id')
      .eq('storefront_slug', input.storefront_slug)
      .maybeSingle();

    if (slugConflict) {
      return {
        success: false,
        error: 'This storefront URL is already taken. Please choose another.',
        fieldErrors: { storefront_slug: ['This handle is already registered.'] },
      };
    }

    // Upsert profiles table with display name and whatsapp number
    await db
      .from('profiles')
      .upsert(
        {
          id: user.id,
          display_name: input.store_name,
          whatsapp_number: input.whatsapp_number,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    // Insert seller profile
    const { data: seller, error: insertError } = await db
      .from('seller_profiles')
      .insert({
        user_id: user.id,
        hall_id: input.hall_id,
        store_name: input.store_name,
        storefront_slug: input.storefront_slug,
        store_description: input.store_description ?? null,
        storefront_image_url: input.storefront_image_url ?? null,
        ug_student_verified: isUgStudentEmail(user.email),
        is_approved: true,
        approved_at: new Date().toISOString(),
      })
      .select('id, storefront_slug')
      .single();

    if (insertError || !seller) {
      return {
        success: false,
        error: insertError?.message ?? 'Failed to initialize storefront profile.',
      };
    }

    revalidatePath('/seller');
    return {
      success: true,
      data: { id: seller.id, storefront_slug: seller.storefront_slug },
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'An unexpected error occurred.') };
  }
}

export async function updateSellerProfile(
  rawInput: UpdateSellerProfileInput
): Promise<ActionResult<{ updated: boolean }>> {
  try {
    const parseResult = UpdateSellerProfileSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed.',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const input = parseResult.data;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized.' };
    }

    const db = await createServerDbClient();

    const { data: seller, error: sellerError } = await db
      .from('seller_profiles')
      .select('id, storefront_slug')
      .eq('user_id', user.id)
      .single();

    if (sellerError || !seller) {
      return { success: false, error: 'Seller profile not found.' };
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.store_description !== undefined) {
      updatePayload.store_description = input.store_description || null;
    }
    if (input.storefront_image_url !== undefined) {
      updatePayload.storefront_image_url = input.storefront_image_url || null;
    }
    if (input.store_status !== undefined) {
      updatePayload.store_status = input.store_status;
    }
    if (input.operating_hours_note !== undefined) {
      updatePayload.operating_hours_note = input.operating_hours_note || null;
    }
    if (input.primary_pickup_spot !== undefined) {
      updatePayload.primary_pickup_spot = input.primary_pickup_spot || null;
    }

    const { error: updateError } = await db
      .from('seller_profiles')
      .update(updatePayload)
      .eq('id', seller.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/');
    revalidatePath(`/store/${seller.storefront_slug}`);
    revalidatePath('/seller');
    revalidatePath('/seller/profile');

    return { success: true, data: { updated: true } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'An unexpected error occurred.') };
  }
}

export async function updateStoreOperatingStatus(
  rawInput: UpdateStoreStatusInput
): Promise<
  ActionResult<{
    store_status: StoreOperatingStatus;
    operating_hours_note: string | null;
    primary_pickup_spot: string | null;
  }>
> {
  try {
    const parseResult = UpdateStoreStatusSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: 'Invalid store status details.',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const input = parseResult.data;

    if (!isSupabaseConfigured()) {
      return {
        success: true,
        data: {
          store_status: input.store_status,
          operating_hours_note: input.operating_hours_note ?? null,
          primary_pickup_spot: input.primary_pickup_spot ?? null,
        },
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized.' };
    }

    const db = await createServerDbClient();
    const { data: seller, error: sellerError } = await db
      .from('seller_profiles')
      .select('id, storefront_slug')
      .eq('user_id', user.id)
      .single();

    if (sellerError || !seller) {
      return { success: false, error: 'Seller profile not found.' };
    }

    const updatePayload: {
      store_status: StoreOperatingStatus;
      operating_hours_note?: string | null;
      primary_pickup_spot?: string | null;
      updated_at: string;
    } = {
      store_status: input.store_status,
      updated_at: new Date().toISOString(),
    };

    if (input.operating_hours_note !== undefined) {
      updatePayload.operating_hours_note = input.operating_hours_note || null;
    }
    if (input.primary_pickup_spot !== undefined) {
      updatePayload.primary_pickup_spot = input.primary_pickup_spot || null;
    }

    const { error: updateError } = await db
      .from('seller_profiles')
      .update(updatePayload)
      .eq('id', seller.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/');
    revalidatePath(`/store/${seller.storefront_slug}`);
    revalidatePath('/seller');
    revalidatePath('/seller/profile');

    return {
      success: true,
      data: {
        store_status: input.store_status,
        operating_hours_note: input.operating_hours_note ?? null,
        primary_pickup_spot: input.primary_pickup_spot ?? null,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to update store status.') };
  }
}

