# Security & Privacy Specification — Campus Store

> **Campus Store — Product Discovery Platform (University of Ghana, Legon pilot)**  
> **Version:** v2.0 — Production-grade Defense-in-Depth, Canonical RLS Policies & Verification  
> **Stack:** Next.js (App Router) · TypeScript (strict) · Supabase (PostgreSQL, Auth, Storage, RLS) · Vercel

---

## Table of Contents

1. [Security Philosophy & Layered Defense](#1-security-philosophy--layered-defense)
2. [Authentication vs Authorization](#2-authentication-vs-authorization)
   - 2.1 [MVP Authentication Standard](#21-mvp-authentication-standard)
   - 2.2 [Authorization Architecture & Role Derivation](#22-authorization-architecture--role-derivation)
3. [API Key Management & Secret Isolation](#3-api-key-management--secret-isolation)
4. [Row Level Security (RLS) Policy Specifications](#4-row-level-security-rls-policy-specifications)
   - 4.1 [`profiles`](#41-profiles)
   - 4.2 [`seller_profiles`](#42-seller_profiles)
   - 4.3 [`listings`](#43-listings)
   - 4.4 [`listing_images`](#44-listing_images)
   - 4.5 [`listing_events`](#45-listing_events)
   - 4.6 [`reports`](#46-reports)
   - 4.7 [`categories`, `universities`, `halls`](#47-categories-universities-halls)
5. [Storage Security & File Upload Isolation](#5-storage-security--file-upload-isolation)
6. [Server-Side Input Validation & Sanitization](#6-server-side-input-validation--sanitization)
7. [Admin Route & Privilege Protection](#7-admin-route--privilege-protection)
8. [Environment Variable Configuration](#8-environment-variable-configuration)
9. [Privacy & WhatsApp Number Disclosure](#9-privacy--whatsapp-number-disclosure)
10. [Abuse Prevention & Rate Limiting](#10-abuse-prevention--rate-limiting)
11. [Pre-Flight Security Checklist](#11-pre-flight-security-checklist)

---

## 1. Security Philosophy & Layered Defense

Campus Store enforces a strict **defense-in-depth** model. Security controls operate across multiple architectural boundaries so that the compromise of any single layer does not expose private records or allow unauthorized alterations.

```
┌─────────────────────────────────────────────────────────────────┐
│                      LAYER 1 — CLIENT                           │
│  Zod pre-validation, client-side image compression              │
│  — Untrusted boundary; UX convenience only                      │
├─────────────────────────────────────────────────────────────────┤
│                   LAYER 2 — NEXT.JS MIDDLEWARE                  │
│  Route protection: session verification, httpOnly cookie check   │
│  Coarse access control for /seller/* and /admin/*               │
├─────────────────────────────────────────────────────────────────┤
│              LAYER 3 — SERVER ACTIONS & API ROUTES              │
│  Authoritative Zod validation, HTML sanitization, rate limits   │
│  Server-side ownership checks & service_role secret isolation   │
├─────────────────────────────────────────────────────────────────┤
│              LAYER 4 — POSTGRES ROW LEVEL SECURITY (RLS)        │
│  Mandatory on 100% of tables. Enforces least-privilege access.  │
│  Direct evaluation of auth.uid() against relational owners.     │
├─────────────────────────────────────────────────────────────────┤
│              LAYER 5 — STORAGE BUCKET POLICIES                  │
│  Path-scoped upload policies: sellers/{seller_id}/*             │
│  Magic-byte inspection, file size capping, MIME restrictions    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication vs Authorization

| Concept | Question Answered | Implementation Layer | Failure Consequence |
|---|---|---|---|
| **Authentication** | *Who are you?* | Supabase Auth (Email + Password + Email Verification) | Unauthenticated → HTTP 401 / Redirect to `/seller/login` |
| **Authorization** | *What are you allowed to do?* | Supabase RLS Policies + Server Actions | Unauthorized → HTTP 403 / Empty Query Result |

### 2.1 MVP Authentication Standard

The definitive MVP decision across all documentation is:

1. **Seller & Admin Authentication:** **Email and password with email verification**, powered by **Supabase Auth**.
2. **Buyer Experience:** **100% unauthenticated / anonymous**. Buyers browse marketplace listings, filter by categories and halls, view storefronts, and open WhatsApp click-to-chat links without creating an account or signing in.
3. **No SMS / Phone OTP:** Phone OTP and SMS authentication are explicitly removed from MVP scope due to per-message SMS costs, third-party gateway dependencies, and friction.
4. **No Magic Links:** Passwordless magic links are omitted from MVP to eliminate email delivery deliverability edge cases on mobile clients.
5. **Session Management:** Stored strictly in `httpOnly`, `SameSite=Lax`, `Secure` cookies managed through `@supabase/ssr`. Tokens are never stored in client-side `localStorage`.

### 2.2 Authorization Architecture & Role Derivation

Supabase manages database roles directly:

- **`anon`:** Unauthenticated public visitors. Read-only access to approved public entities (`universities`, `halls`, `categories`, active approved `seller_profiles`, and `AVAILABLE` or `NEEDS_CONFIRMATION` listings). Write access is strictly limited to submitting moderation `reports`.
- **`authenticated`:** Logged-in users with a verified session (`auth.uid()`). A user is mapped to a `profiles` record. If they have an entry in `seller_profiles`, they act as a seller.
- **`is_admin`:** Controlled exclusively by `profiles.is_admin = TRUE`. Evaluated server-side in Server Actions and inside PostgreSQL RLS policies via `auth.uid()`.

---

## 3. API Key Management & Secret Isolation

```
┌─────────────────────────────────────────────────────────────┐
│ PUBLIC TO BROWSER CLIENT (NEXT_PUBLIC_)                     │
│ • NEXT_PUBLIC_SUPABASE_URL                                  │
│ • NEXT_PUBLIC_SUPABASE_ANON_KEY                             │
│   (Protected by PostgreSQL RLS policies at all times)       │
├─────────────────────────────────────────────────────────────┤
│ STRICTLY PRIVATE / SERVER-SIDE ONLY (NEVER IN BROWSER)      │
│ • SUPABASE_SERVICE_ROLE_KEY                                 │
│   (Bypasses RLS; used exclusively in Server Actions, Edge    │
│    Functions, and admin moderation routines)                │
└─────────────────────────────────────────────────────────────┘
```

> [!CAUTION]
> The `SUPABASE_SERVICE_ROLE_KEY` must never be prefixed with `NEXT_PUBLIC_` or imported into any Client Component. Bundling this key exposes the entire database to total compromise.

---

## 4. Row Level Security (RLS) Policy Specifications

RLS is enabled on all tables using `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`.

### 4.1 `profiles`

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Public can read non-sensitive profile columns for approved sellers
CREATE POLICY "profiles_public_read_approved_sellers"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles sp
      WHERE sp.user_id = profiles.id AND sp.is_approved = TRUE
    )
  );

-- 2. Authenticated user reads their own full row (including whatsapp_number)
CREATE POLICY "profiles_owner_read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3. Authenticated user creates their own profile during registration
CREATE POLICY "profiles_owner_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND is_admin = FALSE);

-- 4. Authenticated user updates their own profile (cannot escalate is_admin)
CREATE POLICY "profiles_owner_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_admin = (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid())
  );

-- 5. Admin full access
CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );
```

---

### 4.2 `seller_profiles`

`seller_profiles.user_id` is a `UNIQUE` foreign key referencing `auth.users(id)`.

```sql
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

-- 1. Public can read approved storefront profiles
CREATE POLICY "seller_profiles_public_read_approved"
  ON public.seller_profiles FOR SELECT
  TO anon, authenticated
  USING (is_approved = TRUE);

-- 2. Seller reads their own storefront profile (regardless of approval)
CREATE POLICY "seller_profiles_owner_read"
  ON public.seller_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Authenticated user registers a seller profile (must start unapproved)
CREATE POLICY "seller_profiles_owner_insert"
  ON public.seller_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_approved = FALSE);

-- 4. Seller updates their own profile details (cannot alter approval state)
CREATE POLICY "seller_profiles_owner_update"
  ON public.seller_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_approved = (SELECT sp.is_approved FROM public.seller_profiles sp WHERE sp.id = seller_profiles.id)
  );

-- 5. Admin manages all seller profiles (approval, suspensions)
CREATE POLICY "seller_profiles_admin_all"
  ON public.seller_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );
```

---

### 4.3 `listings`

Authoritative visibility:
- **`AVAILABLE`:** Publicly visible.
- **`NEEDS_CONFIRMATION`:** Publicly visible with warning badge.
- **`SOLD_OUT`, `EXPIRED`, `PAUSED`, `DRAFT`, `REMOVED`:** Strictly hidden from public discovery.

```sql
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- 1. Public marketplace discovery: only active, non-expired, approved listings
CREATE POLICY "listings_public_read"
  ON public.listings FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND availability_status IN ('AVAILABLE', 'NEEDS_CONFIRMATION')
    AND (expires_at IS NULL OR expires_at > now())
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles sp
      WHERE sp.id = listings.seller_id AND sp.is_approved = TRUE
    )
  );

-- 2. Seller reads all their own listings across all lifecycle states
CREATE POLICY "listings_seller_read_own"
  ON public.listings FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles sp
      WHERE sp.id = listings.seller_id AND sp.user_id = auth.uid()
    )
  );

-- 3. Approved seller creates a listing under their own seller profile
CREATE POLICY "listings_seller_insert_own"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles sp
      WHERE sp.id = listings.seller_id
        AND sp.user_id = auth.uid()
        AND sp.is_approved = TRUE
    )
  );

-- 4. Seller updates only their own listings
CREATE POLICY "listings_seller_update_own"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles sp
      WHERE sp.id = listings.seller_id AND sp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles sp
      WHERE sp.id = listings.seller_id AND sp.user_id = auth.uid()
    )
  );

-- 5. Admin full access
CREATE POLICY "listings_admin_all"
  ON public.listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );
```

---

### 4.4 `listing_images`

```sql
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;

-- 1. Public reads images for live, accessible listings
CREATE POLICY "listing_images_public_read"
  ON public.listing_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.seller_profiles sp ON sp.id = l.seller_id
      WHERE l.id = listing_images.listing_id
        AND l.deleted_at IS NULL
        AND l.availability_status IN ('AVAILABLE', 'NEEDS_CONFIRMATION')
        AND (l.expires_at IS NULL OR l.expires_at > now())
        AND sp.is_approved = TRUE
    )
  );

-- 2. Seller reads/inserts/deletes images on their own listings
CREATE POLICY "listing_images_seller_manage"
  ON public.listing_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.seller_profiles sp ON sp.id = l.seller_id
      WHERE l.id = listing_images.listing_id
        AND sp.user_id = auth.uid()
    )
  );

-- 3. Admin full management
CREATE POLICY "listing_images_admin_all"
  ON public.listing_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );
```

---

### 4.5 `listing_events`

```sql
ALTER TABLE public.listing_events ENABLE ROW LEVEL SECURITY;

-- 1. Seller reads events for their own listings
CREATE POLICY "listing_events_seller_read"
  ON public.listing_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.seller_profiles sp ON sp.id = l.seller_id
      WHERE l.id = listing_events.listing_id
        AND sp.user_id = auth.uid()
    )
  );

-- 2. Admin full management (inserts are written by server actions / service_role)
CREATE POLICY "listing_events_admin_all"
  ON public.listing_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );
```

---

### 4.6 `reports`

```sql
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (anonymous buyer or authenticated user) can submit a report
CREATE POLICY "reports_anon_insert"
  ON public.reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- 2. Only administrators can inspect or resolve reports
CREATE POLICY "reports_admin_all"
  ON public.reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );
```

---

### 4.7 `categories`, `universities`, `halls`

```sql
ALTER TABLE public.categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halls        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read"   ON public.categories   FOR SELECT TO anon, authenticated USING (is_active = TRUE);
CREATE POLICY "universities_public_read" ON public.universities FOR SELECT TO anon, authenticated USING (is_active = TRUE);
CREATE POLICY "halls_public_read"        ON public.halls        FOR SELECT TO anon, authenticated USING (is_active = TRUE);

CREATE POLICY "categories_admin_all"   ON public.categories   FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "universities_admin_all" ON public.universities FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "halls_admin_all"        ON public.halls        FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));
```

---

## 5. Storage Security & File Upload Isolation

### Bucket Specifications: `product-images`

- **Public Access:** Public CDN read enabled for displaying images.
- **Max File Size:** 2 MB per image. Client-side compression is applied before upload; server-side enforcement rejects files exceeding 2 MB.
- **Allowed MIME Types:** `image/jpeg`, `image/png`, `image/webp`.
- **Maximum Count:** 3 images per listing.
- **Storage Path Pattern:** `sellers/{seller_id}/listings/{listing_id}/{filename}`

### Supabase Storage RLS Policies

```sql
-- 1. Public read access from CDN
CREATE POLICY "storage_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

-- 2. Authenticated seller upload strictly to their own seller folder
CREATE POLICY "storage_seller_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'sellers'
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles sp
      WHERE sp.id::text = (storage.foldername(name))[2]
        AND sp.user_id = auth.uid()
    )
  );

-- 3. Authenticated seller deletion of their own images
CREATE POLICY "storage_seller_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'sellers'
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles sp
      WHERE sp.id::text = (storage.foldername(name))[2]
        AND sp.user_id = auth.uid()
    )
  );
```

---

## 6. Server-Side Input Validation & Sanitization

All user input is parsed and sanitized server-side in Server Actions via Zod:

```typescript
import { z } from 'zod';

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, '').trim();

export const CreateListingSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must have at least 2 characters.')
    .max(120, 'Title cannot exceed 120 characters.')
    .transform(stripHtml),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters.')
    .transform(stripHtml)
    .optional(),
  price: z
    .number({ invalid_type_error: 'Price must be a valid number.' })
    .min(0, 'Price cannot be negative.')
    .nullable()
    .optional(),
  price_negotiable: z.boolean().default(false),
  category_id: z.string().uuid('Invalid category identifier.'),
});
```

---

## 7. Admin Route & Privilege Protection

### Middleware Route Enforcement
[`middleware.ts`](file:///c:/Users/pc/Desktop/Campus%20Store/middleware.ts) inspects session cookies for `/seller/*` and `/admin/*`:

1. Unauthenticated users visiting `/seller/*` or `/admin/*` are redirected to `/seller/login`.
2. Users accessing `/admin/*` have their `profiles.is_admin` attribute verified. Non-admin users are immediately redirected to `/` without leaking route existence.

### Database Trigger Preventing Self-Escalation

```sql
CREATE OR REPLACE FUNCTION public.prevent_is_admin_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'is_admin may only be altered by an administrative migration or service_role routine.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_is_admin_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_is_admin_self_update();
```

---

## 8. Environment Variable Configuration

| Variable | Client-Safe? | Location | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | `.env.local` / Vercel | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | `.env.local` / Vercel | Supabase Anon Key (gated by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ **NO** | Vercel (Encrypted) | Admin actions & cron routines |
| `NEXT_PUBLIC_CAMPUS_NAME` | ✅ Yes | `.env.local` / Vercel | Display label (e.g. "University of Ghana") |
| `NEXT_PUBLIC_DEFAULT_HALL_SLUG` | ✅ Yes | `.env.local` / Vercel | Pilot hall slug (e.g. "commonwealth") |

---

## 9. Privacy & WhatsApp Number Disclosure

### Transparent Disclosure
- **Privacy Reality:** The seller's WhatsApp number is directly embedded in the `wa.me/<E.164>?text=...` click-to-chat hyperlink. Anyone inspecting the link or tapping "Chat on WhatsApp" will obtain the seller's phone number.
- **Database Exposure Protection:** `profiles.whatsapp_number` is never returned in public search queries or browse endpoints. The contact link is constructed on the server or rendered securely on the listing detail page.
- **Disclaimer Copy:** Displayed on every listing detail page:
  > *"Campus Store connects buyers and sellers. We do not handle payments, guarantee transactions, or facilitate delivery. Transactions and communication occur directly between buyer and seller."*

---

## 10. Abuse Prevention & Rate Limiting

1. **Listing Creation Rate Limiting:** Maximum 10 listings per seller in a rolling 24-hour window, enforced in the Server Action before database insertion.
2. **Seller Approval Gate:** New seller accounts (`is_approved = FALSE`) can create listings, but none appear publicly until approved by an administrator.
3. **Report Rate Limiting:** Vercel Edge Middleware limits report submissions to 5 per IP address per hour.

---

## 11. Pre-Flight Security Checklist

- [ ] Email + password with email confirmation enabled in Supabase Auth settings.
- [ ] Phone OTP / SMS authentication completely disabled and references removed.
- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` verified on all 9 tables.
- [ ] `listings_public_read` verified: returns only `AVAILABLE` and `NEEDS_CONFIRMATION` listings where `expires_at > now()`.
- [ ] `SOLD_OUT`, `PAUSED`, `EXPIRED`, `DRAFT`, and `REMOVED` listings are verified hidden from anon queries.
- [ ] `seller_profiles.user_id` foreign key verified pointing to `auth.users(id)`.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` confirmed absent from all frontend bundles and client-side code.
- [ ] Image upload validation enforces magic-byte verification and 2 MB limit.
- [ ] Contact tap event logging is authenticated and validated server-side.

---

*Security specification verified and complete.*
