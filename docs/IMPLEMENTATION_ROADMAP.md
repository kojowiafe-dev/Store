# Implementation Roadmap & Milestone Specification — Campus Store

> **Platform:** Campus Product Discovery Network (University of Ghana, Legon pilot)  
> **Version:** 2.0 — Milestone Sequence (M0–M6), Verified Architecture, Pilot Metrics & Testing Standards  
> **Architecture:** Modular Monolith · Next.js (App Router) · Supabase (Postgres, Auth, Storage) · Vercel

---

## Table of Contents

1. [Roadmap Philosophy](#1-roadmap-philosophy)
2. [Milestone Summary Matrix (M0–M6)](#2-milestone-summary-matrix-m0m6)
3. [Pilot Measurement Framework (Defined for M0 & M6)](#3-pilot-measurement-framework-defined-for-m0--m6)
4. [Detailed Milestone Specifications](#4-detailed-milestone-specifications)
   - 4.1 [Milestone 0: Product Validation & Manual Pilot](#41-milestone-0-product-validation--manual-pilot)
   - 4.2 [Milestone 1: Application Foundation & Environment](#42-milestone-1-application-foundation--environment)
   - 4.3 [Milestone 2: Database Schema & Authentication](#43-milestone-2-database-schema--authentication)
   - 4.4 [Milestone 3: Public Marketplace Discovery & Storefronts](#44-milestone-3-public-marketplace-discovery--storefronts)
   - 4.5 [Milestone 4: Seller Dashboard & Multi-Category Management](#45-milestone-4-seller-dashboard--multi-category-management)
   - 4.6 [Milestone 5: Administration, Moderation & Expiry Lifecycle](#46-milestone-5-administration-moderation--expiry-lifecycle)
   - 4.7 [Milestone 6: Campus Pilot Launch & Evaluation](#47-milestone-6-campus-pilot-launch--evaluation)
5. [End-to-End Testing Strategy](#5-end-to-end-testing-strategy)
6. [Deployment & Verification Guidelines](#6-deployment--verification-guidelines)

---

## 1. Roadmap Philosophy

Campus Store prioritizes **vertical slices** and continuous, testable verification. We do not construct isolated infrastructure layers without proving real user functionality:

1. **Pre-Engineering Validation (M0):** Manual campus pilot tests seller responsiveness and buyer interest before writing code.
2. **Defensive Data Architecture (M2):** RLS policies, constraints, and canonical state transitions are locked down in SQL early.
3. **Public Discovery First (M3):** Buyers can discover listings and open WhatsApp chats with seed data before seller self-service is built.
4. **Iterative Pilot Expansion (M6):** The platform deploys to a single UG residence hall (~10 sellers) to evaluate retention and interest metrics.

---

## 2. Milestone Summary Matrix (M0–M6)

| Milestone | Title | Primary Objective | Output / Milestone Milestone | Prerequisite |
|---|---|---|---|---|
| **M0** | Product Validation | Manual campus test without software | Verified seller willingness to post; validated buyer interest | None |
| **M1** | Application Foundation | Scaffold Next.js, Tailwind, Supabase connection | Local dev environment healthy; CI build passes | M0 |
| **M2** | Database & Auth | Schema, RLS, email/password Supabase auth | Migrations applied; RLS verified; seed data live | M1 |
| **M3** | Public Discovery | Homepage, search, filters, `/store/*`, WhatsApp links | Anonymous buyers discover items & trigger contact | M2 |
| **M4** | Seller Dashboard | Storefront setup, listing CRUD, photo uploads | Sellers manage multiple products across categories | M2, M3 |
| **M5** | Admin & Lifecycle | Two-phase expiry worker, moderation, reports | Automated status transitions & admin oversight live | M4 |
| **M6** | Pilot Launch | Deploy to 1 UG hall, onboard ~10 sellers | Live pilot evaluation against core engagement metrics | M5 |

---

## 3. Pilot Measurement Framework (Defined for M0 & M6)

To measure product-market fit during the campus pilot, six core metrics are established:

| Metric | How It Is Captured | Target / Healthy Signal | Caveat / Interpretation |
|---|---|---|---|
| **1. Seller Time to First Product** | Delta between `seller_profiles.created_at` and first `listings.created_at` (`AVAILABLE`). | ≤ 5 minutes on mobile. | Measures onboarding friction. |
| **2. 14-Day Seller Retention** | Percentage of pilot sellers publishing or reconfirming availability 14 days after onboarding. | ≥ 60% of pilot sellers active. | Indicates whether sellers find the storefront worth maintaining. |
| **3. Active Listing Currency** | Count of live listings in `AVAILABLE` state vs `NEEDS_CONFIRMATION` or `EXPIRED`. | ≥ 80% of total active listings maintained in `AVAILABLE`. | Measures freshness and trust. |
| **4. Contact Taps per Listing** | Count of `contact_tapped` events in `listing_events` when buyers click "Chat on WhatsApp". | ≥ 3 contact taps per live listing per week. | **Important:** Contact taps measure buyer interest, not completed transactions. |
| **5. Returning Buyers** | Weekly repeat page views from unique client devices. | ≥ 30% week-over-week repeat visits. | Assessed via aggregate privacy-preserving analytics. |
| **6. Self-Reported Purchases** | Manual 2-question WhatsApp follow-up to buyers/sellers: *"Did you complete this transaction?"* | Documented in weekly pilot audit. | Transactions occur off-platform; purchase data requires direct follow-up. |

---

## 4. Detailed Milestone Specifications

### 4.1 Milestone 0: Product Validation & Manual Pilot

- **Objective:** Validate student willingness to browse a structured catalogue and initiate WhatsApp orders without building custom software first.
- **Scope:**
  - Create a manual digital catalogue (e.g. curated WhatsApp catalogue or Notion document) for 3–5 student sellers in Commonwealth Hall.
  - Track whether buyers find items and whether sellers respond to inquiries.
  - Capture qualitative feedback on photo requirements, price flexibility, and confirmation habits.
- **Acceptance Criteria:**
  1. At least 5 campus micro-sellers agree to test structured product discovery.
  2. At least 20 organic buyer inquiries are generated to pilot sellers.
  3. Sellers express preference for a dedicated storefront link over repeating daily WhatsApp status posts.
- **Definition of Done:** M0 review completed and signed off by founders; core assumptions validated.

---

### 4.2 Milestone 1: Application Foundation & Environment

- **Objective:** Establish a working Next.js App Router codebase, configure TypeScript in strict mode, initialize Tailwind CSS, and connect to local Supabase.
- **Deliverables:**
  - Standardized Next.js project scaffold with `@supabase/ssr`.
  - Environment templates (`.env.local.example`) documenting all required variables.
  - Automated CI workflow (GitHub Actions) for linting, type-checking, and build validation.
  - Vercel project integration with preview deployments enabled.
- **Modules & Files Expected to Change:**
  - `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`
  - `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
  - `.github/workflows/ci.yml`
- **Tests to Run:**
  - `npm run build` exits 0.
  - `npm run type-check` (`tsc --noEmit`) passes with zero errors.
  - `supabase status` confirms local database, auth, and storage services running.
- **Definition of Done:** Team can clone repo, run `supabase start`, copy `.env.local`, run `npm run dev`, and view healthy placeholder page at `localhost:3000`.

---

### 4.3 Milestone 2: Database Schema & Authentication

- **Objective:** Apply the v2.0 relational schema, configure Supabase Auth (email/password with email verification), deploy PostgreSQL RLS policies, and generate strict TypeScript definitions.
- **Deliverables:**
  - Migration scripts for all 9 tables: `universities`, `halls`, `profiles`, `seller_profiles`, `categories`, `listings`, `listing_images`, `listing_events`, `reports`.
  - RLS policies deployed and verified for anonymous, seller-owned, and admin access.
  - Triggers for `search_vector` full-text search and `updated_at` maintenance.
  - Seed dataset (`supabase/seed.sql`) containing UG Legon, Commonwealth Hall, 6 categories with lead-time parameters, test sellers, and 20+ sample listings.
  - Generated TypeScript types at `src/types/database.types.ts`.
- **Modules & Files Expected to Change:**
  - `supabase/migrations/`
  - `supabase/seed.sql`
  - `src/types/database.types.ts`
- **Tests to Run:**
  - `supabase db reset` executes cleanly with zero SQL errors.
  - RLS test: Anonymous SQL query attempting to read `profiles.whatsapp_number` returns null.
  - RLS test: Anonymous SQL query attempting to select `DRAFT`, `PAUSED`, or `SOLD_OUT` listings returns zero rows.
  - Ownership test: Seller A cannot update Seller B's listing.
- **Definition of Done:** Complete database schema and RLS policies active locally; TypeScript types generated; seed data verified in Supabase Studio.

---

### 4.4 Milestone 3: Public Marketplace Discovery & Storefronts

- **Objective:** Implement mobile-first public discovery pages allowing anonymous buyers to search products across sellers, filter by hall/category, view storefronts, and trigger WhatsApp chats.
- **Deliverables:**
  - Marketplace homepage (`/`) featuring cross-seller live products (`AVAILABLE` and `NEEDS_CONFIRMATION`).
  - Search and category filter bar with debounced input and category chips.
  - Product detail page (`/listings/[slug]`) with image carousel, GHS pricing, disclaimer, and "Chat on WhatsApp" button.
  - Dedicated seller storefront (`/store/[storefront_slug]`) displaying seller bio, hall, and eligible listings categorized into tabs.
  - Server Action `recordContactTap` logging interest events to `listing_events`.
  - ISR caching configured with 60-second revalidation windows.
- **Modules & Files Expected to Change:**
  - `src/app/(public)/page.tsx`
  - `src/app/(public)/listings/[slug]/page.tsx`
  - `src/app/(public)/store/[storefront_slug]/page.tsx`
  - `src/app/(public)/categories/[slug]/page.tsx`
  - `src/services/listing.service.ts`, `src/repositories/listing.repository.ts`
  - `src/lib/whatsapp.ts`, `src/actions/listing.actions.ts`
- **Acceptance Criteria:**
  1. Home page renders active seed listings without requiring authentication.
  2. Filtering by "Food & Snacks" limits the view to food products.
  3. Clicking "Chat on WhatsApp" opens `https://wa.me/<E.164>?text=...` with product context.
  4. Opening a seller storefront displays all products published by that specific seller.
  5. Soft-deleted, paused, or expired listings return a clean 404 page with a link to discovery.
- **Definition of Done:** Vercel preview deployment passes mobile responsiveness checks on simulated Android 375px viewports; WhatsApp links verified.

---

### 4.5 Milestone 4: Seller Dashboard & Multi-Category Management

- **Objective:** Build authenticated seller onboarding, storefront setup, and listing management supporting multiple products across different categories.
- **Deliverables:**
  - Auth pages: `/seller/register` (email, password, display name, WhatsApp number) and `/seller/login`.
  - Email verification confirmation flow.
  - Storefront setup screen (`/seller/onboarding`) generating unique `storefront_slug`.
  - Admin approval gate: New sellers placed in pending review (`is_approved = FALSE`).
  - Seller dashboard (`/seller/dashboard`) with status tabs (`AVAILABLE`, `NEEDS_CONFIRMATION`, `SOLD_OUT`, `PAUSED`, `EXPIRED`, `DRAFT`).
  - Multi-category product creation form (`/seller/listings/new`) with title, category, price, negotiable toggle, optional description, and image uploader (max 3 photos, client compression).
  - Quick action controls: "Mark Sold Out", "Pause", "Resume", "Delete", and single-tap "Confirm Availability".
- **Modules & Files Expected to Change:**
  - `src/app/seller/`
  - `src/actions/seller.actions.ts`, `src/actions/listing.actions.ts`
  - `src/services/seller.service.ts`, `src/services/availability.service.ts`
  - `src/schemas/listing.schema.ts`, `src/schemas/seller.schema.ts`
  - `src/middleware.ts`
- **Acceptance Criteria:**
  1. A seller registers with email/password and confirms their email.
  2. Seller submits storefront details; unapproved seller listings remain invisible to public queries.
  3. Approved seller posts an item in Food and another in Clothing under the same storefront.
  4. Tapping "Mark Sold Out" hides the item from the public marketplace grid.
  5. Tapping "Pause" hides the item and pauses its expiry timers.
- **Definition of Done:** Full seller lifecycle verified from registration through publishing multi-category products and managing stock statuses.

---

### 4.6 Milestone 5: Administration, Moderation & Expiry Lifecycle

- **Objective:** Deploy two-phase automated expiry transitions, content moderation tools, and operational seller reminders.
- **Deliverables:**
  - Stored function `process_listing_expiry_transitions()` executed every 10 minutes via cron.
  - Phase 1 transition: `AVAILABLE` -> `NEEDS_CONFIRMATION` when `now() >= confirm_before`.
  - Phase 2 transition: `NEEDS_CONFIRMATION` -> `EXPIRED` when `now() >= expires_at`.
  - Reactivation flow: Seller taps "Still Available" in dashboard, resetting timers fresh.
  - Admin dashboard (`/admin/dashboard`, `/admin/sellers`, `/admin/listings`, `/admin/reports`):
    - Approve/reject pending seller registrations.
    - Inspect and take down flagged or policy-violating listings.
    - Review and resolve anonymous buyer reports.
    - Generate manual WhatsApp check-in links to prompt unconfirmed sellers.
- **Modules & Files Expected to Change:**
  - `src/app/admin/`
  - `src/actions/admin.actions.ts`, `src/actions/report.actions.ts`
  - `src/services/admin.service.ts`, `src/services/availability.service.ts`
  - `supabase/functions/expire-listings/` (or SQL cron migration)
- **Acceptance Criteria:**
  1. When simulated time advances past `confirm_before`, listing transitions to `NEEDS_CONFIRMATION` and displays warning badge.
  2. When simulated time advances past `expires_at`, listing transitions to `EXPIRED` and vanishes from public discovery.
  3. Seller taps "Still Available", immediately returning the listing to `AVAILABLE` with fresh timestamps.
  4. Admin can approve a pending seller and take down an offensive listing.
- **Definition of Done:** Expiry cron proven idempotent in test suite; admin moderation actions correctly update database state and event logs.

---

### 4.7 Milestone 6: Campus Pilot Launch & Evaluation

- **Objective:** Deploy to production on Vercel, configure production Supabase instance, onboard ~10 sellers from Commonwealth Hall, and evaluate engagement against M0/M6 metrics.
- **Deliverables:**
  - Production deployment with custom domain, SSL, and CDN caching.
  - Production Supabase database initialized with migrations and clean hall/category configuration.
  - Onboard 10 student micro-sellers across food, clothing, personal care, and services.
  - Seed 30+ verified campus listings.
  - Distribution of campus discovery links in student hall groups.
  - 14-day engagement audit capturing the 6 pilot metrics.
- **Modules & Files Expected to Change:**
  - Production configuration & environment variables.
  - `docs/SELLER_ONBOARDING_GUIDE.md` distributed to pilot sellers.
- **Acceptance Criteria:**
  1. 10 approved sellers actively maintain storefronts on campus.
  2. ≥ 100 organic product page views and ≥ 30 WhatsApp click-to-chat contact taps logged in week 1.
  3. No security regressions or RLS data leakage.
  4. Post-pilot evaluation report produced reviewing seller retention and transaction follow-ups.
- **Definition of Done:** Pilot live, stable, evaluated against metrics, and documented for v2 roadmap decisions.

---

## 5. End-to-End Testing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Unit Tests (Vitest)                                      │
│ • Zod validation schemas (price formats, phone E.164, tags) │
│ • WhatsApp link URL generation and character encoding       │
│ • Two-phase timestamp calculation functions                 │
├─────────────────────────────────────────────────────────────┤
│ 2. Integration Tests (Vitest + Local Supabase)             │
│ • RLS policy verification: anon vs seller vs admin          │
│ • Server Action authorization guards                        │
│ • Two-phase expiry worker idempotency & state transitions   │
│ • Image upload size and magic-byte validation               │
├─────────────────────────────────────────────────────────────┤
│ 3. End-to-End Tests (Playwright)                            │
│ • Anonymous buyer discovery, search, filter, and wa.me link │
│ • Seller registration, email verification, and onboarding   │
│ • Product creation, photo attachment, and pause/sold out    │
│ • Admin seller approval and report resolution flows         │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Deployment & Verification Guidelines

1. **Local Setup:**
   ```bash
   git clone <repo-url> && cd campus-store
   npm install
   supabase start
   cp .env.local.example .env.local
   supabase db reset
   npm run dev
   ```
2. **Production Deployment (Vercel & Supabase Cloud):**
   - Push migrations via `supabase db push`.
   - Set environment variables in Vercel:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (Encrypted / Server-Only)
     - `NEXT_PUBLIC_CAMPUS_NAME="University of Ghana"`
     - `NEXT_PUBLIC_DEFAULT_HALL_SLUG="commonwealth"`
   - Confirm scheduled expiry worker is active in Supabase dashboard.

---

*Roadmap specification verified and complete.*
