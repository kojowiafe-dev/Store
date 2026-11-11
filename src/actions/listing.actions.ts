'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { CreateListingSchema, type CreateListingInput } from '@/schemas/listing.schema';
import type { ActionResult } from '@/types/api.types';

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${randomSuffix}`;
}

export async function recordContactTap(listingId: string): Promise<ActionResult<{ recorded: boolean }>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return { success: true, data: { recorded: true } };
    }

    const supabase = await createClient();
    await supabase.from('listing_events').insert({
      listing_id: listingId,
      actor_id: null,
      event_type: 'contact_tapped',
      payload: { client_timestamp: new Date().toISOString() },
    });

    return { success: true, data: { recorded: true } };
  } catch (err: any) {
    // Non-blocking telemetry
    return { success: true, data: { recorded: false } };
  }
}

export async function createListing(
  rawInput: CreateListingInput
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const parseResult = CreateListingSchema.safeParse(rawInput);
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
      return { success: false, error: 'You must be signed in as a seller to create a listing.' };
    }

    const { data: seller, error: sellerError } = await supabase
      .from('seller_profiles')
      .select('id, storefront_slug, is_approved')
      .eq('user_id', user.id)
      .single();

    if (sellerError || !seller) {
      return { success: false, error: 'Seller profile not found. Please complete seller registration.' };
    }

    if (!seller.is_approved) {
      return { success: false, error: 'Your seller account is awaiting administrator approval.' };
    }

    const { data: category } = await supabase
      .from('categories')
      .select('default_expiry_hours, default_confirm_lead_hours')
      .eq('id', input.category_id)
      .single();

    const expiryHours = category?.default_expiry_hours ?? 168; // default 7 days
    const leadHours = category?.default_confirm_lead_hours ?? 24; // default 24h lead

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryHours * 3600 * 1000);
    const confirmBefore = new Date(now.getTime() + (expiryHours - leadHours) * 3600 * 1000);

    const slug = generateSlug(input.title);

    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert({
        seller_id: seller.id,
        category_id: input.category_id,
        slug,
        title: input.title,
        description: input.description ?? null,
        price: input.price ?? null,
        price_negotiable: input.price_negotiable,
        currency: 'GHS',
        availability_status: 'AVAILABLE',
        confirm_before: confirmBefore.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select('id, slug')
      .single();

    if (insertError || !listing) {
      return { success: false, error: insertError?.message ?? 'Failed to create listing.' };
    }

    if (input.photos && input.photos.length > 0) {
      const imagesToInsert = input.photos.slice(0, 3).map((path, idx) => ({
        listing_id: listing.id,
        storage_path: path,
        display_order: idx + 1,
        is_primary: idx === 0,
      }));

      await supabase.from('listing_images').insert(imagesToInsert);
    }

    await supabase.from('listing_events').insert({
      listing_id: listing.id,
      actor_id: user.id,
      event_type: 'created',
      payload: { title: input.title, price: input.price },
    });

    revalidatePath('/');
    revalidatePath(`/store/${seller.storefront_slug}`);
    revalidatePath(`/listings/${listing.slug}`);

    return {
      success: true,
      data: { id: listing.id, slug: listing.slug },
    };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'An unexpected error occurred.' };
  }
}

export async function confirmAvailability(listingId: string): Promise<ActionResult<{ confirmed: boolean }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized.' };
    }

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select(`
        id,
        slug,
        category_id,
        seller_id,
        seller_profiles!inner(user_id, storefront_slug),
        categories(default_expiry_hours, default_confirm_lead_hours)
      `)
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return { success: false, error: 'Listing not found.' };
    }

    const sellerUser = (listing.seller_profiles as any)?.user_id;
    if (sellerUser !== user.id) {
      return { success: false, error: 'You are not authorized to update this listing.' };
    }

    const cat = listing.categories as any;
    const expiryHours = cat?.default_expiry_hours ?? 168;
    const leadHours = cat?.default_confirm_lead_hours ?? 24;

    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + expiryHours * 3600 * 1000);
    const newConfirmBefore = new Date(now.getTime() + (expiryHours - leadHours) * 3600 * 1000);

    const { error: updateError } = await supabase
      .from('listings')
      .update({
        availability_status: 'AVAILABLE',
        confirm_before: newConfirmBefore.toISOString(),
        expires_at: newExpiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', listingId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await supabase.from('listing_events').insert({
      listing_id: listingId,
      actor_id: user.id,
      event_type: 'confirmed_available',
      payload: { new_expires_at: newExpiresAt.toISOString() },
    });

    const storefrontSlug = (listing.seller_profiles as any)?.storefront_slug;
    revalidatePath('/');
    if (storefrontSlug) revalidatePath(`/store/${storefrontSlug}`);
    revalidatePath(`/listings/${listing.slug}`);

    return { success: true, data: { confirmed: true } };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to confirm availability.' };
  }
}

export async function markSoldOut(listingId: string): Promise<ActionResult<{ status: string }>> {
  return updateListingLifecycle(listingId, 'SOLD_OUT', 'marked_sold_out');
}

export async function pauseListing(listingId: string): Promise<ActionResult<{ status: string }>> {
  return updateListingLifecycle(listingId, 'PAUSED', 'paused');
}

export async function resumeListing(listingId: string): Promise<ActionResult<{ status: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { success: false, error: 'Unauthorized.' };

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select(`
        id,
        slug,
        expires_at,
        category_id,
        seller_profiles!inner(user_id, storefront_slug),
        categories(default_expiry_hours, default_confirm_lead_hours)
      `)
      .eq('id', listingId)
      .single();

    if (listingError || !listing) return { success: false, error: 'Listing not found.' };

    const sellerUser = (listing.seller_profiles as any)?.user_id;
    if (sellerUser !== user.id) {
      return { success: false, error: 'Unauthorized.' };
    }

    const now = new Date();
    const isPastExpiry = !listing.expires_at || new Date(listing.expires_at) <= now;

    const cat = listing.categories as any;
    const expiryHours = cat?.default_expiry_hours ?? 168;
    const leadHours = cat?.default_confirm_lead_hours ?? 24;

    const updatePayload: Record<string, any> = {
      availability_status: 'AVAILABLE',
      updated_at: now.toISOString(),
    };

    if (isPastExpiry) {
      updatePayload.expires_at = new Date(now.getTime() + expiryHours * 3600 * 1000).toISOString();
      updatePayload.confirm_before = new Date(
        now.getTime() + (expiryHours - leadHours) * 3600 * 1000
      ).toISOString();
    }

    const { error: updateError } = await supabase
      .from('listings')
      .update(updatePayload)
      .eq('id', listingId);

    if (updateError) return { success: false, error: updateError.message };

    await supabase.from('listing_events').insert({
      listing_id: listingId,
      actor_id: user.id,
      event_type: 'resumed',
      payload: updatePayload,
    });

    const storefrontSlug = (listing.seller_profiles as any)?.storefront_slug;
    revalidatePath('/');
    if (storefrontSlug) revalidatePath(`/store/${storefrontSlug}`);
    revalidatePath(`/listings/${listing.slug}`);

    return { success: true, data: { status: 'AVAILABLE' } };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to resume listing.' };
  }
}

export async function deleteListing(listingId: string): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { success: false, error: 'Unauthorized.' };

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, slug, seller_profiles!inner(user_id, storefront_slug)')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) return { success: false, error: 'Listing not found.' };

    const sellerUser = (listing.seller_profiles as any)?.user_id;
    if (sellerUser !== user.id) return { success: false, error: 'Unauthorized.' };

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('listings')
      .update({
        availability_status: 'REMOVED',
        deleted_at: now,
        updated_at: now,
      })
      .eq('id', listingId);

    if (updateError) return { success: false, error: updateError.message };

    await supabase.from('listing_events').insert({
      listing_id: listingId,
      actor_id: user.id,
      event_type: 'deleted',
      payload: { deleted_at: now },
    });

    const storefrontSlug = (listing.seller_profiles as any)?.storefront_slug;
    revalidatePath('/');
    if (storefrontSlug) revalidatePath(`/store/${storefrontSlug}`);
    revalidatePath(`/listings/${listing.slug}`);

    return { success: true, data: { deleted: true } };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to delete listing.' };
  }
}

async function updateListingLifecycle(
  listingId: string,
  newStatus: 'AVAILABLE' | 'SOLD_OUT' | 'PAUSED' | 'REMOVED',
  eventType: string
): Promise<ActionResult<{ status: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { success: false, error: 'Unauthorized.' };

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, slug, seller_profiles!inner(user_id, storefront_slug)')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) return { success: false, error: 'Listing not found.' };

    const sellerUser = (listing.seller_profiles as any)?.user_id;
    if (sellerUser !== user.id) return { success: false, error: 'Unauthorized.' };

    const { error: updateError } = await supabase
      .from('listings')
      .update({
        availability_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    if (updateError) return { success: false, error: updateError.message };

    await supabase.from('listing_events').insert({
      listing_id: listingId,
      actor_id: user.id,
      event_type: eventType,
      payload: { new_status: newStatus },
    });

    const storefrontSlug = (listing.seller_profiles as any)?.storefront_slug;
    revalidatePath('/');
    if (storefrontSlug) revalidatePath(`/store/${storefrontSlug}`);
    revalidatePath(`/listings/${listing.slug}`);

    return { success: true, data: { status: newStatus } };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Lifecycle update failed.' };
  }
}

