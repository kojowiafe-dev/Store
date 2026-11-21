'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServerDbClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  PILOT_HALL,
  getErrorMessage,
  isSupabaseConfigured,
  isUgStudentEmail,
} from '@/lib/constants';
import { FALLBACK_CATEGORIES } from '@/repositories/category.repository';
import type { ActionResult } from '@/types/api.types';
import type { StoreOperatingStatus } from '@/types/database.types';

const UG_UNIVERSITY_ID = '00000000-0000-0000-0000-000000000001';

export interface RegisterSellerInput {
  storeName: string;
  storefrontSlug: string;
  whatsappNumber: string;
  email: string;
  password: string;
  storeDescription?: string;
}

export interface LoginSellerInput {
  email: string;
  password: string;
}

export interface CompleteStorefrontInput {
  storeName: string;
  storefrontSlug: string;
  whatsappNumber: string;
  storeDescription?: string;
}

export interface ProvisionedSellerProfile {
  id: string;
  store_name: string;
  storefront_slug: string;
  is_approved: boolean;
  store_status?: StoreOperatingStatus;
  operating_hours_note?: string | null;
  primary_pickup_spot?: string | null;
  ug_student_verified?: boolean;
  halls: { name: string } | null;
}

type DbClient = Awaited<ReturnType<typeof createServerDbClient>>;

function normalizeGhanaPhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-()]/g, '').trim();
  if (/^0\d{9}$/.test(cleaned)) {
    return `+233${cleaned.slice(1)}`;
  }
  if (/^233\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return cleaned;
}

function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export async function ensurePilotReferenceData(
  db: DbClient
): Promise<{ error: string | null }> {
  const { error: uniError } = await db.from('universities').upsert(
    {
      id: UG_UNIVERSITY_ID,
      name: 'University of Ghana',
      slug: 'ug',
      city: 'Accra',
      country: 'GH',
      is_active: true,
    },
    { onConflict: 'id' }
  );

  if (uniError) {
    return { error: uniError.message };
  }

  const { error: hallError } = await db.from('halls').upsert(
    {
      id: PILOT_HALL.id,
      university_id: UG_UNIVERSITY_ID,
      name: PILOT_HALL.name,
      slug: PILOT_HALL.slug,
      is_active: true,
    },
    { onConflict: 'id' }
  );

  if (hallError) {
    return { error: hallError.message };
  }

  const { count } = await db
    .from('categories')
    .select('id', { count: 'exact', head: true });

  if (!count || count === 0) {
    const categoryRows = FALLBACK_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      sort_order: c.sort_order,
      default_expiry_hours: c.default_expiry_hours,
      default_confirm_lead_hours: c.default_confirm_lead_hours,
      is_active: c.is_active,
    }));

    const { error: catError } = await db
      .from('categories')
      .upsert(categoryRows, { onConflict: 'slug' });

    if (catError) {
      return { error: catError.message };
    }
  }

  return { error: null };
}

async function saveProfileAndSellerStorefront(
  db: DbClient,
  params: {
    userId: string;
    email?: string;
    storeName: string;
    storefrontSlug: string;
    whatsappNumber: string;
    storeDescription: string | null;
    allowSlugSuffixFallback?: boolean;
  }
): Promise<
  | { ok: true; seller: ProvisionedSellerProfile }
  | { ok: false; error: string }
> {
  const refCheck = await ensurePilotReferenceData(db);
  if (refCheck.error) {
    return { ok: false, error: `Database setup error: ${refCheck.error}` };
  }

  let finalSlug = params.storefrontSlug;
  const { data: slugTaken } = await db
    .from('seller_profiles')
    .select('id, user_id')
    .eq('storefront_slug', finalSlug)
    .maybeSingle();

  if (slugTaken && slugTaken.user_id !== params.userId) {
    if (params.allowSlugSuffixFallback) {
      finalSlug = `${finalSlug.slice(0, 44)}-${params.userId.slice(0, 4)}`;
    } else {
      return {
        ok: false,
        error: 'This store URL handle is already taken. Please choose another.',
      };
    }
  }

  const now = new Date().toISOString();

  const { error: profileError } = await db.from('profiles').upsert(
    {
      id: params.userId,
      display_name: params.storeName,
      whatsapp_number: params.whatsappNumber,
      is_active: true,
      updated_at: now,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    return {
      ok: false,
      error: `Failed to save user profile: ${profileError.message}`,
    };
  }

  const { data: ownSeller } = await db
    .from('seller_profiles')
    .select('id')
    .eq('user_id', params.userId)
    .maybeSingle();

  const ugStudentVerified = isUgStudentEmail(params.email);

  const sellerPayload = {
    user_id: params.userId,
    hall_id: PILOT_HALL.id,
    store_name: params.storeName,
    storefront_slug: finalSlug,
    store_description: params.storeDescription,
    ug_student_verified: ugStudentVerified,
    is_approved: true,
    approved_at: now,
    updated_at: now,
  };

  let { data: savedSeller, error: sellerError } = ownSeller
    ? await db
        .from('seller_profiles')
        .update(sellerPayload)
        .eq('id', ownSeller.id)
        .select('id, store_name, storefront_slug, is_approved')
        .single()
    : await db
        .from('seller_profiles')
        .insert(sellerPayload)
        .select('id, store_name, storefront_slug, is_approved')
        .single();

  if (sellerError?.message?.includes('ug_student_verified')) {
    const legacyPayload = {
      user_id: params.userId,
      hall_id: PILOT_HALL.id,
      store_name: params.storeName,
      storefront_slug: finalSlug,
      store_description: params.storeDescription,
      is_approved: true,
      approved_at: now,
      updated_at: now,
    };
    const fallbackResult = ownSeller
      ? await db
          .from('seller_profiles')
          .update(legacyPayload)
          .eq('id', ownSeller.id)
          .select('id, store_name, storefront_slug, is_approved')
          .single()
      : await db
          .from('seller_profiles')
          .insert(legacyPayload)
          .select('id, store_name, storefront_slug, is_approved')
          .single();
    savedSeller = fallbackResult.data;
    sellerError = fallbackResult.error;
  }

  if (sellerError || !savedSeller) {
    return {
      ok: false,
      error: `Failed to save storefront profile: ${sellerError?.message ?? 'Unknown error'}`,
    };
  }

  return {
    ok: true,
    seller: {
      id: savedSeller.id,
      store_name: savedSeller.store_name,
      storefront_slug: savedSeller.storefront_slug,
      is_approved: savedSeller.is_approved,
      store_status: 'OPEN_NOW',
      operating_hours_note: null,
      primary_pickup_spot: null,
      ug_student_verified: ugStudentVerified,
      halls: { name: PILOT_HALL.name },
    },
  };
}

async function findAuthUserByEmail(
  adminClient: ReturnType<typeof createAdminClient>,
  email: string
) {
  const target = email.trim().toLowerCase();
  const { data, error } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error || !data?.users) return null;
  return data.users.find((u) => u.email?.toLowerCase() === target) ?? null;
}

export async function ensureSellerProfileForAuthUser(authUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): Promise<ProvisionedSellerProfile | null> {
  if (!isSupabaseConfigured()) return null;

  const db = await createServerDbClient();
  const { data: existingSeller, error: existingErr } = await db
    .from('seller_profiles')
    .select(
      'id, store_name, storefront_slug, is_approved, store_status, operating_hours_note, primary_pickup_spot, ug_student_verified, halls(name)'
    )
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (existingSeller) {
    const profile = existingSeller as unknown as ProvisionedSellerProfile;
    if (!profile.ug_student_verified && isUgStudentEmail(authUser.email)) {
      await db
        .from('seller_profiles')
        .update({ ug_student_verified: true })
        .eq('id', profile.id);
      profile.ug_student_verified = true;
    }
    return profile;
  }

  if (existingErr) {
    const { data: legacySeller } = await db
      .from('seller_profiles')
      .select('id, store_name, storefront_slug, is_approved, halls(name)')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (legacySeller) {
      return {
        ...(legacySeller as unknown as ProvisionedSellerProfile),
        store_status: 'OPEN_NOW',
        operating_hours_note: null,
        primary_pickup_spot: null,
        ug_student_verified: isUgStudentEmail(authUser.email),
      };
    }
  }

  const meta = (authUser.user_metadata ?? {}) as {
    display_name?: unknown;
    whatsapp_number?: unknown;
  };
  const displayName =
    typeof meta.display_name === 'string' ? meta.display_name.trim() : '';

  if (displayName.length < 2) {
    return null;
  }

  const rawPhone =
    typeof meta.whatsapp_number === 'string' ? meta.whatsapp_number : '';
  const normalizedPhone = normalizeGhanaPhone(rawPhone);
  const safeWhatsapp = /^\+233\d{9}$/.test(normalizedPhone)
    ? normalizedPhone
    : '+233500000000';
  const baseSlug = sanitizeSlug(displayName) || 'campus-store';

  const result = await saveProfileAndSellerStorefront(db, {
    userId: authUser.id,
    email: authUser.email,
    storeName: displayName,
    storefrontSlug: baseSlug,
    whatsappNumber: safeWhatsapp,
    storeDescription: null,
    allowSlugSuffixFallback: true,
  });

  return result.ok ? result.seller : null;
}

export async function registerSellerAccount(
  rawInput: RegisterSellerInput
): Promise<ActionResult<{ storefrontSlug: string; autoSignedIn: boolean }>> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error:
          'Supabase is not configured. Check .env.local and restart the dev server.',
      };
    }

    const storeName = rawInput.storeName.trim();
    const storefrontSlug = sanitizeSlug(rawInput.storefrontSlug);
    const normalizedWhatsapp = normalizeGhanaPhone(rawInput.whatsappNumber);
    const email = rawInput.email.trim().toLowerCase();
    const password = rawInput.password;
    const storeDescription = rawInput.storeDescription?.trim() || null;

    if (storeName.length < 2) {
      return { success: false, error: 'Store name must be at least 2 characters.' };
    }

    if (storefrontSlug.length < 2) {
      return {
        success: false,
        error: 'Store URL handle must contain at least 2 letters or numbers.',
      };
    }

    if (!/^\+233\d{9}$/.test(normalizedWhatsapp)) {
      return {
        success: false,
        error:
          'Enter a valid Ghana WhatsApp number (e.g. +233501234567 or 0501234567).',
      };
    }

    if (!email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long.',
      };
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = await createClient();
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: storeName,
            whatsapp_number: normalizedWhatsapp,
          },
        },
      });

      if (signUpError || !authData.user) {
        return {
          success: false,
          error: signUpError?.message ?? 'Failed to create seller account.',
        };
      }

      if (authData.session) {
        await supabase.from('seller_profiles').insert({
          user_id: authData.user.id,
          hall_id: PILOT_HALL.id,
          store_name: storeName,
          storefront_slug: storefrontSlug,
          store_description: storeDescription,
          is_approved: true,
          approved_at: new Date().toISOString(),
        });
      }

      revalidatePath('/seller');
      return {
        success: true,
        data: { storefrontSlug, autoSignedIn: Boolean(authData.session) },
      };
    }

    const adminClient = createAdminClient();

    // Ensure reference rows exist before creating the user/storefront
    const refCheck = await ensurePilotReferenceData(adminClient);
    if (refCheck.error) {
      return {
        success: false,
        error: `Database setup error: ${refCheck.error}`,
      };
    }

    let userId: string | null = null;
    const { data: createdData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: storeName,
          whatsapp_number: normalizedWhatsapp,
        },
      });

    if (!createError && createdData.user) {
      userId = createdData.user.id;
    } else {
      const errMsg = createError?.message?.toLowerCase() ?? '';
      const isDuplicateEmail =
        errMsg.includes('already') ||
        errMsg.includes('exists') ||
        errMsg.includes('registered');

      if (!isDuplicateEmail) {
        return {
          success: false,
          error: createError?.message ?? 'Failed to register user account.',
        };
      }

      const existingUser = await findAuthUserByEmail(adminClient, email);
      if (!existingUser) {
        return {
          success: false,
          error: 'An account with this email already exists. Please sign in instead.',
        };
      }

      const { data: existingSeller } = await adminClient
        .from('seller_profiles')
        .select('id')
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (existingSeller) {
        return {
          success: false,
          error: 'An account with this email already exists. Please sign in instead.',
        };
      }

      const { error: updateAuthError } =
        await adminClient.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: true,
          user_metadata: {
            display_name: storeName,
            whatsapp_number: normalizedWhatsapp,
          },
        });

      if (updateAuthError) {
        return { success: false, error: updateAuthError.message };
      }

      userId = existingUser.id;
    }

    const saved = await saveProfileAndSellerStorefront(adminClient, {
      userId,
      email,
      storeName,
      storefrontSlug,
      whatsappNumber: normalizedWhatsapp,
      storeDescription,
    });

    if (!saved.ok) {
      return { success: false, error: saved.error };
    }

    const supabase = await createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    revalidatePath('/');
    revalidatePath('/seller');
    revalidatePath('/admin/sellers');

    return {
      success: true,
      data: {
        storefrontSlug: saved.seller.storefront_slug,
        autoSignedIn: !signInErr,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, 'An unexpected error occurred during registration.'),
    };
  }
}

export async function loginSellerAccount(
  rawInput: LoginSellerInput
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error:
          'Supabase is not configured. Check .env.local and restart the dev server.',
      };
    }

    const email = rawInput.email.trim().toLowerCase();
    const password = rawInput.password;

    if (!email || !password) {
      return { success: false, error: 'Please enter both your email and password.' };
    }

    const supabase = await createClient();
    let { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createAdminClient();
      const existingUser = await findAuthUserByEmail(adminClient, email);

      if (!existingUser) {
        return {
          success: false,
          error:
            'No seller account found with this email. Please register your storefront first.',
        };
      }

      if (!existingUser.email_confirmed_at) {
        await adminClient.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true,
        });

        const retry = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        signInData = retry.data;
        signInError = retry.error;
      }
    }

    if (signInError || !signInData.user) {
      if (signInError?.message?.toLowerCase().includes('email not confirmed')) {
        return {
          success: false,
          error:
            'Please verify your email link before signing in, or contact the campus coordinator.',
        };
      }
      return {
        success: false,
        error: 'Incorrect password for this email. Please try again.',
      };
    }

    await ensureSellerProfileForAuthUser(signInData.user);

    revalidatePath('/seller');
    return { success: true, data: { redirectTo: '/seller' } };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, 'An unexpected error occurred during sign in.'),
    };
  }
}

export async function completeStorefrontSetup(
  rawInput: CompleteStorefrontInput
): Promise<ActionResult<{ storefrontSlug: string }>> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error:
          'Supabase is not configured. Check .env.local and restart the dev server.',
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be signed in to complete setup.' };
    }

    const storeName = rawInput.storeName.trim();
    const storefrontSlug = sanitizeSlug(rawInput.storefrontSlug);
    const normalizedWhatsapp = normalizeGhanaPhone(rawInput.whatsappNumber);
    const storeDescription = rawInput.storeDescription?.trim() || null;

    if (storeName.length < 2) {
      return { success: false, error: 'Store name must be at least 2 characters.' };
    }

    if (storefrontSlug.length < 2) {
      return {
        success: false,
        error: 'Store URL handle must contain at least 2 letters or numbers.',
      };
    }

    if (!/^\+233\d{9}$/.test(normalizedWhatsapp)) {
      return {
        success: false,
        error:
          'Enter a valid Ghana WhatsApp number (e.g. +233501234567 or 0501234567).',
      };
    }

    const db = await createServerDbClient();
    const saved = await saveProfileAndSellerStorefront(db, {
      userId: user.id,
      email: user.email,
      storeName,
      storefrontSlug,
      whatsappNumber: normalizedWhatsapp,
      storeDescription,
    });

    if (!saved.ok) {
      return { success: false, error: saved.error };
    }

    revalidatePath('/seller');
    revalidatePath('/');
    return {
      success: true,
      data: { storefrontSlug: saved.seller.storefront_slug },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, 'Failed to save storefront details.'),
    };
  }
}
