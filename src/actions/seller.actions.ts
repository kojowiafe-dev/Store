'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/constants';
import {
  CreateSellerProfileSchema,
  UpdateSellerProfileSchema,
  type CreateSellerProfileInput,
  type UpdateSellerProfileInput,
} from '@/schemas/seller.schema';
import type { ActionResult } from '@/types/api.types';

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

    // Check if user already has a storefront
    const { data: existing } = await supabase
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
    const { data: slugConflict } = await supabase
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

    // Update profiles table with display name and whatsapp number
    await supabase
      .from('profiles')
      .update({
        display_name: input.store_name,
        whatsapp_number: input.whatsapp_number,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Insert seller profile (defaults to is_approved: false per policy)
    const { data: seller, error: insertError } = await supabase
      .from('seller_profiles')
      .insert({
        user_id: user.id,
        hall_id: input.hall_id,
        store_name: input.store_name,
        storefront_slug: input.storefront_slug,
        store_description: input.store_description ?? null,
        storefront_image_url: input.storefront_image_url ?? null,
        is_approved: false,
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

    const { data: seller, error: sellerError } = await supabase
      .from('seller_profiles')
      .select('id, storefront_slug')
      .eq('user_id', user.id)
      .single();

    if (sellerError || !seller) {
      return { success: false, error: 'Seller profile not found.' };
    }

    const { error: updateError } = await supabase
      .from('seller_profiles')
      .update({
        store_description: input.store_description,
        storefront_image_url: input.storefront_image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', seller.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/store/${seller.storefront_slug}`);
    revalidatePath('/seller/profile');

    return { success: true, data: { updated: true } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'An unexpected error occurred.') };
  }
}

