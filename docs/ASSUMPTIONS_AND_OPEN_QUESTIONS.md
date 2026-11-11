# Assumptions, Open Decisions & Risk Register — Campus Store

> **Platform:** Campus Product Discovery Network (University of Ghana, Legon pilot)  
> **Version:** 2.0 — Finalized Canonical Decisions, Open Founder Items & Risk Register  
> **Stack:** Next.js (App Router) · Supabase · Vercel

---

## Table of Contents

1. [Confirmed Architecture & Product Assumptions](#1-confirmed-architecture--product-assumptions)
2. [Open Decisions Requiring Founder Confirmation](#2-open-decisions-requiring-founder-confirmation)
3. [Decisions Locked Down in Specification v2.0](#3-decisions-locked-down-in-specification-v20)
4. [Technical & Operational Risk Register](#4-technical--operational-risk-register)

---

## 1. Confirmed Architecture & Product Assumptions

| # | Verified Assumption | Product & Architectural Implication |
|---|---|---|
| **A-01** | **WhatsApp is universal among UG students.** | Click-to-chat links (`wa.me`) provide a reliable interaction bridge without building in-app chat. |
| **A-02** | **Buyers will browse without registering.** | Frictionless, anonymous discovery drives higher organic traffic and adoption from shared hall links. |
| **A-03** | **Sellers operate personal WhatsApp numbers.** | No WhatsApp Business API or Meta account verification is needed for the pilot. |
| **A-04** | **Email/password auth is adequate for student sellers.** | Avoids per-message SMS OTP fees in Ghana while maintaining verified user sessions. |
| **A-05** | **Food availability is time-sensitive.** | Requires a two-phase expiry mechanism (`confirm_before` at 20h, `expires_at` at 24h) to prevent stale listings. |
| **A-06** | **Transactions occur off-platform.** | Platform handles discovery only; payments (cash, MoMo) and delivery remain strictly between buyer and seller. |
| **A-07** | **Pilot is focused on one UG residence hall.** | Scoped to ~10 sellers in one hall (e.g. Commonwealth Hall) while supporting multi-hall data expansion. |
| **A-08** | **Modular Monolith is optimal for V1.** | A single Next.js project on Vercel with Supabase PostgreSQL avoids microservice overhead. |
| **A-09** | **Photos should be optional.** | Text-only listings are permitted so sellers without photos can still publish immediately. Max 3 photos (2 MB each). |
| **A-10** | **English is the primary language.** | No multi-language translation layer is required for the pilot. |

---

## 2. Open Decisions Requiring Founder Confirmation

The following decisions are documented with recommended defaults:

### OD-01 — Final Brand Name and Domain
- **Question:** What is the final public brand name and web domain?
- **Options:** (a) `campusstore.gh` · (b) `ugmarket.com` · (c) custom brand name.
- **Recommended Default:** Use the placeholder name **"Campus Store"** during development and local staging. Deploy to a Vercel preview domain until the founder registers the final domain.
- **Status:** Open.

### OD-02 — Pilot Hall Selection
- **Question:** Which specific UG residence hall serves as the initial pilot community?
- **Options:** Commonwealth Hall · Volta Hall · Legon Hall · Akuafo Hall · Mensah Sarbah Hall.
- **Recommended Default:** Configure the pilot via `NEXT_PUBLIC_DEFAULT_HALL_SLUG="commonwealth"`. The data model already supports all halls; switching halls requires updating an environment variable.
- **Status:** Open.

### OD-03 — Seller Identity Verification Depth
- **Question:** What proof of student status or identity is required before seller approval?
- **Options:** (a) Name and active WhatsApp phone number only · (b) Student ID card upload required.
- **Recommended Default:** Option (a) for the pilot. Since the pilot involves ~10 sellers known to the organizers, manual vetting via phone check is fast and avoids handling sensitive student ID documents.
- **Status:** Open.

### OD-04 — Buyer-Seller Legal & Transaction Disclaimer Copy
- **Question:** What exact disclaimer wording should be displayed on listing pages?
- **Recommended Default:**  
  > *"Campus Store connects buyers and sellers across campus. We do not handle payments, guarantee transactions, or arrange delivery. All arrangements and payments are made directly between you and the seller."*
- **Status:** Open.

### OD-05 — Sold-Out Product Display on Seller Storefronts
- **Question:** Should sold-out items remain visible on the seller's dedicated public storefront (`/store/[slug]`)?
- **Decision:** Sold-out items are **strictly hidden from the main marketplace discovery feed**, but **may be displayed greyed out (with WhatsApp button disabled)** on the seller's own storefront to showcase product range.
- **Status:** Founder to confirm storefront visual presentation.

### OD-06 — Store-Level "Selling Today" Bulk Availability Action
- **Question:** Should sellers have a single button to reconfirm all food listings for the day?
- **Recommended Default:** Omit from initial MVP release to keep dashboard simple. In V1, sellers use single-tap confirmation per listing. Introduce bulk confirmation in V2 if sellers request it.
- **Status:** Open.

### OD-07 — Primary Administrator Account Creation
- **Question:** How is the initial administrator account provisioned?
- **Recommended Default:** The founder signs up normally via `/seller/register` using their email and password, verifies their email, and sets `profiles.is_admin = TRUE` directly in Supabase Studio SQL editor.
- **Status:** Open.

---

## 3. Decisions Locked Down in Specification v2.0

| Code | Topic | Canonical Decision |
|---|---|---|
| **C-01** | **Authentication** | Seller auth uses **email and password with email verification** via Supabase Auth. Buyers are 100% unauthenticated. Phone OTP and SMS are removed from V1. |
| **C-02** | **Status Values** | Canonical states: `DRAFT`, `AVAILABLE`, `NEEDS_CONFIRMATION`, `SOLD_OUT`, `EXPIRED`, `PAUSED`, `REMOVED`. All uppercase across DB, API, and types. |
| **C-03** | **Single Lifecycle Field** | `availability_status` is the sole lifecycle field. `is_active` is completely removed from `listings`. |
| **C-04** | **Visibility Rules** | `AVAILABLE` and `NEEDS_CONFIRMATION` (with warning badge) are public. `SOLD_OUT`, `EXPIRED`, `PAUSED`, `DRAFT`, `REMOVED` are hidden from general discovery. |
| **C-10** | **Seller Ownership** | `seller_profiles.user_id` is a `UNIQUE` foreign key referencing `auth.users(id)`. RLS policies evaluate `auth.uid() = user_id`. |
| **C-13** | **Two-Phase Expiry** | Listings record both `confirm_before` and `expires_at`. Categories configure duration and lead time. Worker executes transitions idempotently. |
| **C-15/16** | **Storefront Fields** | `storefront_slug` (unique, URL-friendly) and `storefront_image_url` are first-class fields on `seller_profiles`. Storefront resolves at `/store/[storefront_slug]`. |

---

## 4. Technical & Operational Risk Register

| Risk | Impact | Likelihood | Mitigation Strategy |
|---|---|---|---|
| **Seller Churn due to Daily Check-in** | High | Medium | Two-phase lead time provides a 4h confirmation grace period. Fast "Yes, Still Available" one-tap dashboard button. Admin can send direct WhatsApp reminder links. |
| **Stale or Sold Listings Remaining Live** | High | Low | Two-phase expiry automatically flags items as `NEEDS_CONFIRMATION` then hides them as `EXPIRED`. Public query filters check `expires_at > now()` to prevent leakage if cron is delayed. |
| **WhatsApp Number Harvesting** | Medium | Medium | Numbers are not returned in public search queries. Clear disclosure informs sellers that their number is embedded in the `wa.me` click-to-chat hyperlink. |
| **Seller Impersonation or Spam** | High | Low | Admin approval gate: New seller profiles remain unapproved (`is_approved = FALSE`) until reviewed by a campus moderator. Unapproved listings cannot appear publicly. |
| **Heavy Mobile Data Usage on Campus** | High | Medium | Client-side image compression (< 500 KB target). Next.js Image Optimization converts photos to WebP. Strict 3-photo ceiling per listing. |
| **RLS Policy Misconfiguration** | Critical | Low | Comprehensive test suite validates anonymous, seller-owned, and admin access boundaries before promoting code to production. |

---

*Assumptions, decisions and risk register verified and complete.*
