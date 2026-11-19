'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServerDbClient } from '@/lib/supabase/server';
import { ensurePilotReferenceData } from '@/actions/auth.actions';
import {
  DEFAULT_CURRENCY,
  MAX_LISTING_PHOTOS,
  getErrorMessage,
  isSupabaseConfigured,
} from '@/lib/constants';
import { CreateListingSchema, type CreateListingInput } from '@/schemas/listing.schema';
import type { ActionResult } from '@/types/api.types';

interface CategoryTiming {
  default_expiry_hours: number;
  default_confirm_lead_hours: number;
}

interface OwnedListingRow {
  id: string;
  slug: string;
  expires_at: string | null;
  seller_profiles: { user_id: string; storefront_slug: string } | null;
  categories: CategoryTiming | null;
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${randomSuffix}`;
}

function computeExpiryWindow(category: CategoryTiming | null, now = new Date()) {
  const expiryHours = category?.default_expiry_hours ?? 168;
  const leadHours = category?.default_confirm_lead_hours ?? 24;
  const expiresAt = new Date(now.getTime() + expiryHours * 3600 * 1000);
  const confirmBefore = new Date(now.getTime() + (expiryHours - leadHours) * 3600 * 1000);
  return {
    expiresAt: expiresAt.toISOString(),
    confirmBefore: confirmBefore.toISOString(),
  };
}

function revalidateListingPaths(listingSlug: string, storefrontSlug?: string | null) {
  revalidatePath('/');
  revalidatePath('/seller');
  if (storefrontSlug) revalidatePath(`/store/${storefrontSlug}`);
  revalidatePath(`/listings/${listingSlug}`);
}

async function getAuthenticatedOwnedListing(listingId: string): Promise<
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createServerDbClient>>;
      userId: string;
      listing: OwnedListingRow;
    }
  | { ok: false; error: string }
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

  const { data: listing, error: listingError } = await db
    .from('listings')
    .select(
      `
      id,
      slug,
      expires_at,
      seller_profiles!inner(user_id, storefront_slug),
      categories(default_expiry_hours, default_confirm_lead_hours)
    `
    )
    .eq('id', listingId)
    .single();

  if (listingError || !listing) {
    return { ok: false, error: 'Listing not found.' };
  }

  const typedListing = listing as unknown as OwnedListingRow;
  if (typedListing.seller_profiles?.user_id !== user.id) {
    return { ok: false, error: 'You are not authorized to update this listing.' };
  }

  return { ok: true, supabase: db, userId: user.id, listing: typedListing };
}

export async function recordContactTap(
  listingId: string
): Promise<ActionResult<{ recorded: boolean }>> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true, data: { recorded: true } };
    }

    const db = await createServerDbClient();
    await db.from('listing_events').insert({
      listing_id: listingId,
      actor_id: null,
      event_type: 'contact_tapped',
      payload: { client_timestamp: new Date().toISOString() },
    });

    return { success: true, data: { recorded: true } };
  } catch {
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

    const db = await createServerDbClient();
    await ensurePilotReferenceData(db);

    const { data: seller, error: sellerError } = await db
      .from('seller_profiles')
      .select('id, storefront_slug, is_approved')
      .eq('user_id', user.id)
      .single();

    if (sellerError || !seller) {
      return {
        success: false,
        error: 'Seller profile not found. Please complete storefront setup on your dashboard.',
      };
    }

    if (!seller.is_approved) {
      return { success: false, error: 'Your seller account is awaiting administrator approval.' };
    }

    const { data: category } = await db
      .from('categories')
      .select('default_expiry_hours, default_confirm_lead_hours')
      .eq('id', input.category_id)
      .single();

    const { expiresAt, confirmBefore } = computeExpiryWindow(category);
    const slug = generateSlug(input.title);

    const { data: listing, error: insertError } = await db
      .from('listings')
      .insert({
        seller_id: seller.id,
        category_id: input.category_id,
        slug,
        title: input.title,
        description: input.description ?? null,
        price: input.price ?? null,
        price_negotiable: input.price_negotiable,
        currency: DEFAULT_CURRENCY,
        availability_status: 'AVAILABLE',
        confirm_before: confirmBefore,
        expires_at: expiresAt,
      })
      .select('id, slug')
      .single();

    if (insertError || !listing) {
      return { success: false, error: insertError?.message ?? 'Failed to create listing.' };
    }

    if (input.photos && input.photos.length > 0) {
      const imagesToInsert = input.photos.slice(0, MAX_LISTING_PHOTOS).map((path, idx) => ({
        listing_id: listing.id,
        storage_path: path,
        display_order: idx + 1,
        is_primary: idx === 0,
      }));

      await db.from('listing_images').insert(imagesToInsert);
    }

    await db.from('listing_events').insert({
      listing_id: listing.id,
      actor_id: user.id,
      event_type: 'created',
      payload: { title: input.title, price: input.price ?? null },
    });

    revalidateListingPaths(listing.slug, seller.storefront_slug);

    return {
      success: true,
      data: { id: listing.id, slug: listing.slug },
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'An unexpected error occurred.') };
  }
}

export async function updateListing(
  listingId: string,
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

    const auth = await getAuthenticatedOwnedListing(listingId);
    if (!auth.ok) return { success: false, error: auth.error };

    const { supabase, userId, listing } = auth;
    const input = parseResult.data;

    const { error: updateError } = await supabase
      .from('listings')
      .update({
        title: input.title,
        category_id: input.category_id,
        price: input.price ?? null,
        price_negotiable: input.price_negotiable,
        description: input.description ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Sync photos if provided
    await supabase.from('listing_images').delete().eq('listing_id', listingId);
    if (input.photos && input.photos.length > 0) {
      const imagesToInsert = input.photos.slice(0, MAX_LISTING_PHOTOS).map((path, idx) => ({
        listing_id: listingId,
        storage_path: path,
        display_order: idx + 1,
        is_primary: idx === 0,
      }));
      await supabase.from('listing_images').insert(imagesToInsert);
    }

    await supabase.from('listing_events').insert({
      listing_id: listingId,
      actor_id: userId,
      event_type: 'updated',
      payload: { title: input.title, price: input.price ?? null },
    });

    revalidateListingPaths(listing.slug, listing.seller_profiles?.storefront_slug);

    return {
      success: true,
      data: { id: listing.id, slug: listing.slug },
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to update listing.') };
  }
}

export async function confirmAvailability(
  listingId: string
): Promise<ActionResult<{ confirmed: boolean }>> {
  try {
    const auth = await getAuthenticatedOwnedListing(listingId);
    if (!auth.ok) return { success: false, error: auth.error };

    const { supabase, userId, listing } = auth;
    const now = new Date();
    const { expiresAt, confirmBefore } = computeExpiryWindow(listing.categories, now);

    const { error: updateError } = await supabase
      .from('listings')
      .update({
        availability_status: 'AVAILABLE',
        confirm_before: confirmBefore,
        expires_at: expiresAt,
        updated_at: now.toISOString(),
      })
      .eq('id', listingId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await supabase.from('listing_events').insert({
      listing_id: listingId,
      actor_id: userId,
      event_type: 'confirmed_available',
      payload: { new_expires_at: expiresAt },
    });

    revalidateListingPaths(listing.slug, listing.seller_profiles?.storefront_slug);

    return { success: true, data: { confirmed: true } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to confirm availability.') };
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
    const auth = await getAuthenticatedOwnedListing(listingId);
    if (!auth.ok) return { success: false, error: auth.error };

    const { supabase, userId, listing } = auth;
    const now = new Date();
    const isPastExpiry = !listing.expires_at || new Date(listing.expires_at) <= now;

    const updatePayload: {
      availability_status: 'AVAILABLE';
      updated_at: string;
      expires_at?: string;
      confirm_before?: string;
    } = {
      availability_status: 'AVAILABLE',
      updated_at: now.toISOString(),
    };

    if (isPastExpiry) {
      const { expiresAt, confirmBefore } = computeExpiryWindow(listing.categories, now);
      updatePayload.expires_at = expiresAt;
      updatePayload.confirm_before = confirmBefore;
    }

    const { error: updateError } = await supabase
      .from('listings')
      .update(updatePayload)
      .eq('id', listingId);

    if (updateError) return { success: false, error: updateError.message };

    await supabase.from('listing_events').insert({
      listing_id: listingId,
      actor_id: userId,
      event_type: 'resumed',
      payload: updatePayload,
    });

    revalidateListingPaths(listing.slug, listing.seller_profiles?.storefront_slug);

    return { success: true, data: { status: 'AVAILABLE' } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to resume listing.') };
  }
}

export async function deleteListing(
  listingId: string
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const auth = await getAuthenticatedOwnedListing(listingId);
    if (!auth.ok) return { success: false, error: auth.error };

    const { supabase, userId, listing } = auth;
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
      actor_id: userId,
      event_type: 'deleted',
      payload: { deleted_at: now },
    });

    revalidateListingPaths(listing.slug, listing.seller_profiles?.storefront_slug);

    return { success: true, data: { deleted: true } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to delete listing.') };
  }
}

async function updateListingLifecycle(
  listingId: string,
  newStatus: 'AVAILABLE' | 'SOLD_OUT' | 'PAUSED' | 'REMOVED',
  eventType: string
): Promise<ActionResult<{ status: string }>> {
  try {
    const auth = await getAuthenticatedOwnedListing(listingId);
    if (!auth.ok) return { success: false, error: auth.error };

    const { supabase, userId, listing } = auth;

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
      actor_id: userId,
      event_type: eventType,
      payload: { new_status: newStatus },
    });

    revalidateListingPaths(listing.slug, listing.seller_profiles?.storefront_slug);

    return { success: true, data: { status: newStatus } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Lifecycle update failed.') };
  }
}
