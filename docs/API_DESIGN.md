# API Design & Server Action Contracts — Campus Store

> **Platform:** Campus Product Discovery Network (University of Ghana, Legon pilot)  
> **Version:** 2.0 — Standardized Server Actions, Canonical Types & Route Specifications  
> **Stack:** Next.js (App Router) · TypeScript (strict) · Zod · Supabase

---

## Table of Contents

1. [API Architecture & Interaction Principles](#1-api-architecture--interaction-principles)
2. [Universal Response Types & Patterns](#2-universal-response-types--patterns)
3. [Server Actions Specification](#3-server-actions-specification)
   - 3.1 [Listing Actions (`src/actions/listing.actions.ts`)](#31-listing-actions-srcalistingsactionslistingactionsts)
   - 3.2 [Seller & Storefront Actions (`src/actions/seller.actions.ts`)](#32-seller--storefront-actions-srcactionsselleractionsts)
   - 3.3 [Admin Moderation Actions (`src/actions/admin.actions.ts`)](#33-admin-moderation-actions-srcactionsadminactionsts)
   - 3.4 [Report Actions (`src/actions/report.actions.ts`)](#34-report-actions-srcactionsreportactionsts)
4. [Public API Route Handlers](#4-public-api-route-handlers)
   - 4.1 `GET /api/search`
   - 4.2 `GET /api/listings/[slug]`
   - 4.3 `GET /api/store/[storefront_slug]`
   - 4.4 `GET /api/categories`
5. [Zod Validation Schemas](#5-zod-validation-schemas)
6. [WhatsApp Link Generator Specification](#6-whatsapp-link-generator-specification)
7. [Standardized Folder Structure](#7-standardized-folder-structure)

---

## 1. API Architecture & Interaction Principles

Campus Store relies on Next.js Server Actions for all mutations and React Server Component (RSC) data fetching for discovery:

1. **Server Actions for Mutations:** Form submissions, listing lifecycle transitions, and report submissions run as strongly typed Server Actions in `src/actions/`.
2. **Server-Side Validation:** All inputs are validated via Zod schemas before database execution.
3. **Canonical Status Values:** All listing status transitions use canonical uppercase types:
   `'DRAFT' | 'AVAILABLE' | 'NEEDS_CONFIRMATION' | 'SOLD_OUT' | 'EXPIRED' | 'PAUSED' | 'REMOVED'`
4. **URL Consistency:** Public storefronts resolve via `storefront_slug` at `/store/[storefront_slug]`. Listings resolve via `slug` at `/listings/[slug]`.
5. **No WhatsApp API Automation:** WhatsApp interactions are executed client-side via deep-link URLs.

---

## 2. Universal Response Types & Patterns

```typescript
// src/types/api.types.ts

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type ListingAvailabilityStatus =
  | 'DRAFT'
  | 'AVAILABLE'
  | 'NEEDS_CONFIRMATION'
  | 'SOLD_OUT'
  | 'EXPIRED'
  | 'PAUSED'
  | 'REMOVED';
```

---

## 3. Server Actions Specification

### 3.1 Listing Actions (`src/actions/listing.actions.ts`)

#### `createListing(input: CreateListingInput): Promise<ActionResult<{ slug: string }>>`
- **Authorization:** Authenticated seller whose `seller_profiles.is_approved = TRUE`.
- **Validation:** `CreateListingSchema`.
- **Logic:**
  1. Retrieves seller's profile from `auth.uid()`.
  2. Generates unique URL slug from title (`title-slug-[short-id]`).
  3. Fetches category defaults (`default_expiry_hours`, `default_confirm_lead_hours`).
  4. Calculates:
     - `expires_at = now() + default_expiry_hours`
     - `confirm_before = now() + (default_expiry_hours - default_confirm_lead_hours)`
  5. Inserts listing with `availability_status = 'AVAILABLE'` (or `'DRAFT'`).
  6. Inserts photo references in `listing_images` (up to 3).
  7. Logs `'created'` and `'published'` in `listing_events`.
- **Returns:** `{ success: true, data: { slug } }`.

#### `updateListing(listingId: string, input: UpdateListingInput): Promise<ActionResult<void>>`
- **Authorization:** Authenticated owner of the listing (`seller_profiles.user_id = auth.uid()`).
- **Validation:** `UpdateListingSchema`.
- **Logic:** Updates title, description, price, negotiable status. Does NOT prolong existing expiry timestamps.

#### `confirmAvailability(listingId: string): Promise<ActionResult<void>>`
- **Authorization:** Authenticated owner.
- **Logic:**
  1. Verifies current status is `'NEEDS_CONFIRMATION'` or `'EXPIRED'`.
  2. Recalculates `confirm_before` and `expires_at` fresh from `now()` using category defaults.
  3. Updates `availability_status = 'AVAILABLE'`.
  4. Appends `'availability_confirmed'` to `listing_events`.

#### `pauseListing(listingId: string): Promise<ActionResult<void>>`
- **Authorization:** Authenticated owner.
- **Logic:** Sets `availability_status = 'PAUSED'`, clears `confirm_before` and `expires_at`. Appends `'paused'` event.

#### `resumeListing(listingId: string): Promise<ActionResult<void>>`
- **Authorization:** Authenticated owner.
- **Logic:** Sets `availability_status = 'AVAILABLE'`, recalculates `confirm_before` and `expires_at` fresh from `now()`.

#### `markSoldOut(listingId: string): Promise<ActionResult<void>>`
- **Authorization:** Authenticated owner.
- **Logic:** Sets `availability_status = 'SOLD_OUT'`, clears timestamps. Excludes listing from public marketplace search.

#### `restockListing(listingId: string): Promise<ActionResult<void>>`
- **Authorization:** Authenticated owner.
- **Logic:** Sets `availability_status = 'AVAILABLE'`, recalculates timestamps fresh from `now()`.

#### `deleteListing(listingId: string): Promise<ActionResult<void>>`
- **Authorization:** Authenticated owner or administrator.
- **Logic:** Soft-deletes by setting `deleted_at = now()` and `availability_status = 'REMOVED'`.

#### `recordContactTap(listingId: string): Promise<ActionResult<void>>`
- **Authorization:** Public / Anonymous.
- **Logic:** Appends a `'contact_tapped'` event with timestamp into `listing_events` using service role.

---

### 3.2 Seller & Storefront Actions (`src/actions/seller.actions.ts`)

#### `createSellerProfile(input: CreateSellerProfileInput): Promise<ActionResult<{ storefrontSlug: string }>>`
- **Authorization:** Authenticated user without an existing seller profile.
- **Validation:** `CreateSellerProfileSchema`.
- **Logic:**
  1. Enforces uniqueness of `storefront_slug`.
  2. Creates row in `seller_profiles` with `is_approved = FALSE`.
  3. Formats and validates WhatsApp number to E.164.

#### `updateSellerProfile(input: UpdateSellerProfileInput): Promise<ActionResult<void>>`
- **Authorization:** Authenticated seller.
- **Logic:** Updates store description and storefront image. `storefront_slug` remains immutable to avoid breaking shared links.

---

### 3.3 Admin Moderation Actions (`src/actions/admin.actions.ts`)

#### `approveSeller(sellerProfileId: string): Promise<ActionResult<void>>`
- **Authorization:** `profiles.is_admin = TRUE`.
- **Logic:** Sets `is_approved = TRUE`, records `approved_at = now()`, `approved_by = auth.uid()`.

#### `rejectSeller(sellerProfileId: string, reason: string): Promise<ActionResult<void>>`
- **Authorization:** `profiles.is_admin = TRUE`.
- **Logic:** Sets `is_approved = FALSE`, logs moderation action.

#### `takedownListing(listingId: string, reason: string): Promise<ActionResult<void>>`
- **Authorization:** `profiles.is_admin = TRUE`.
- **Logic:** Sets `availability_status = 'REMOVED'`, `deleted_at = now()`, logs `'removed'` event with payload `{ admin_reason: reason }`.

---

### 3.4 Report Actions (`src/actions/report.actions.ts`)

#### `submitReport(input: SubmitReportInput): Promise<ActionResult<void>>`
- **Authorization:** Anonymous or authenticated.
- **Validation:** `SubmitReportSchema`.
- **Logic:** Inserts row into `reports` with `status = 'pending'`.

---

## 4. Public API Route Handlers

### 4.1 `GET /api/search`
- **Query Parameters:**
  - `q` (string, optional): Full-text search keyword.
  - `category` (string, optional): Category slug.
  - `hall` (string, optional): Hall slug.
  - `sort` (enum, optional): `'recent' | 'price_asc' | 'price_desc'`. Default: `'recent'`.
  - `page` (number): Default: 1.
  - `limit` (number): Default: 20.
- **Output:**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "slug": "jollof-combo-4a1",
        "title": "Jollof Rice & Grilled Chicken",
        "price": 25.00,
        "price_negotiable": false,
        "currency": "GHS",
        "availability_status": "AVAILABLE",
        "category_slug": "food-snacks",
        "seller_store_name": "Ama's Kitchen",
        "storefront_slug": "amas-kitchen",
        "hall_name": "Commonwealth Hall",
        "primary_image_url": "https://.../thumbnail.webp"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
  ```

### 4.2 `GET /api/listings/[slug]`
- **Output:** Detailed product view including swipeable image array and pre-built WhatsApp contact URL. Returns 404 if status is not `AVAILABLE` or `NEEDS_CONFIRMATION` or if `expires_at <= now()`.

### 4.3 `GET /api/store/[storefront_slug]`
- **Output:** Storefront metadata (name, hall, bio, storefront image) plus all live listings by this seller, categorized.

### 4.4 `GET /api/categories`
- **Output:** List of active categories with default expiry parameters.

---

## 5. Zod Validation Schemas

```typescript
// src/schemas/listing.schema.ts
import { z } from 'zod';

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, '').trim();

export const CreateListingSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters.')
    .max(120, 'Title cannot exceed 120 characters.')
    .transform(stripHtml),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters.')
    .transform(stripHtml)
    .optional(),
  price: z
    .number({ invalid_type_error: 'Price must be a number.' })
    .min(0, 'Price cannot be negative.')
    .nullable()
    .optional(),
  price_negotiable: z.boolean().default(false),
  category_id: z.string().uuid('Invalid category selected.'),
  photos: z.array(z.string()).max(3, 'Maximum of 3 photos allowed.').default([]),
});

export const CreateSellerProfileSchema = z.object({
  store_name: z
    .string()
    .min(2, 'Store name must be at least 2 characters.')
    .max(60, 'Store name cannot exceed 60 characters.')
    .transform(stripHtml),
  storefront_slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters.')
    .max(60, 'Slug cannot exceed 60 characters.')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must consist only of lowercase letters, numbers, and hyphens.'),
  hall_id: z.string().uuid('Invalid hall selection.'),
  whatsapp_number: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'WhatsApp number must be in E.164 format (e.g. +233501234567).'),
  store_description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters.')
    .transform(stripHtml)
    .optional(),
});

export const SubmitReportSchema = z.object({
  listing_id: z.string().uuid('Invalid listing reference.'),
  reason: z.enum([
    'spam',
    'misleading',
    'inappropriate',
    'already_sold',
    'wrong_price',
    'prohibited_item',
    'other',
  ]),
  details: z
    .string()
    .max(500, 'Details cannot exceed 500 characters.')
    .transform(stripHtml)
    .optional(),
});
```

---

## 6. WhatsApp Link Generator Specification

```typescript
// src/lib/whatsapp.ts

export function buildWhatsAppUrl(params: {
  whatsappNumber: string; // E.164, e.g. "+233501234567"
  productTitle: string;
  storeName?: string;
}): string {
  const cleanPhone = params.whatsappNumber.replace('+', '').trim();
  const text = `Hello ${params.storeName ? params.storeName + ', ' : ''}I found your listing for "${params.productTitle}" on Campus Store. Is it still available?`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
```

---

## 7. Standardized Folder Structure

```
campus-store/
├── src/
│   ├── app/
│   │   ├── (public)/                      # Unauthenticated Buyer Routes
│   │   │   ├── page.tsx                   # Marketplace Homepage (aggregates all sellers)
│   │   │   ├── categories/[slug]/page.tsx # Category Listings Feed
│   │   │   ├── listings/[slug]/page.tsx   # Product Detail Page
│   │   │   └── store/[storefront_slug]/   # Public Seller Storefront
│   │   │       └── page.tsx
│   │   ├── seller/                        # Authenticated Seller Routes
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── onboarding/page.tsx        # Storefront Setup Form
│   │   │   ├── dashboard/page.tsx         # Listing Management & Availability
│   │   │   └── listings/
│   │   │       ├── new/page.tsx           # Multi-category Product Publisher
│   │   │       └── [id]/edit/page.tsx
│   │   ├── admin/                         # Elevated Admin Routes
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── sellers/page.tsx           # Seller Approvals
│   │   │   ├── listings/page.tsx          # Content Moderation
│   │   │   └── reports/page.tsx           # Abuse Reports
│   │   ├── api/                           # Route Handlers
│   │   │   ├── search/route.ts
│   │   │   ├── listings/[slug]/route.ts
│   │   │   ├── store/[storefront_slug]/route.ts
│   │   │   └── categories/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── actions/                           # Next.js Server Actions
│   │   ├── listing.actions.ts
│   │   ├── seller.actions.ts
│   │   ├── admin.actions.ts
│   │   └── report.actions.ts
│   ├── services/                          # Domain Logic Layer
│   │   ├── listing.service.ts
│   │   ├── availability.service.ts
│   │   ├── seller.service.ts
│   │   └── admin.service.ts
│   ├── repositories/                      # PostgreSQL Data Access Layer
│   │   ├── listing.repository.ts
│   │   ├── seller.repository.ts
│   │   ├── category.repository.ts
│   │   └── report.repository.ts
│   ├── schemas/                           # Zod Input Validation
│   │   ├── listing.schema.ts
│   │   ├── seller.schema.ts
│   │   └── report.schema.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                  # Client Components
│   │   │   ├── server.ts                  # Server Actions & RSC
│   │   │   └── admin.ts                   # Service Role Operations
│   │   └── whatsapp.ts                    # wa.me URL Constructor
│   ├── types/
│   │   ├── database.types.ts              # Supabase CLI Generated Types
│   │   └── api.types.ts
│   └── middleware.ts                      # Route & Role Access Guard
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── docs/                                  # Canonical Architecture Docs
```

---

*API design specification verified and complete.*
