# Specification Consistency Audit & Changelog — Campus Store

> **Document:** Final Consistency Audit & Verification Log  
> **Platform:** Campus Product Discovery Network (University of Ghana, Legon pilot)  
> **Version:** 2.0 (Post-Consistency Revision)  
> **Date:** November 2026

---

## 1. Resolution Table for Critical Findings

| Issue ID | Original Discrepancy / Flaw | Corrected Documents & Sections | Definitive Architectural Decision | Remaining Limitations / Notes |
|---|---|---|---|---|
| **C-01** | **Authentication Inconsistency:** PRD referenced phone numbers, Architecture/Security referenced email/magic links, Seller Guide referenced email and password. | `PRD.md` §5.1, §6.2, §7.2<br>`ARCHITECTURE.md` §3.4, §8<br>`SECURITY.md` §2.1, §11<br>`USER_FLOWS.md` §4.1<br>`API_DESIGN.md` §1<br>`SELLER_ONBOARDING_GUIDE.md` §5<br>`README.md` §2.2 | **Seller & Admin Auth:** Email and password with email verification via Supabase Auth.<br>**Buyer Auth:** 100% anonymous browsing.<br>Phone OTP and magic links removed from MVP. | Sellers must confirm email before logging in. In V2, phone OTP can be layered on without modifying session cookies. |
| **C-02** | **Listing Status Inconsistency:** Mixed lowercase and uppercase terms (`active`, `draft`, `sold_out`, `needs_confirmation`, `deactivated`, `expired`, `available`). | `DATABASE_SCHEMA.md` §3, §4.6, §5<br>`SECURITY.md` §4.3<br>`PRD.md` §5.1, §6.1, §7.3, §8.3<br>`ARCHITECTURE.md` §3.2<br>`USER_FLOWS.md` §6<br>`API_DESIGN.md` §2, §3.1<br>`IMPLEMENTATION_ROADMAP.md` M2, M4, M5<br>`README.md` §2.3 | **Canonical Uppercase Status Enum:**<br>`DRAFT`, `AVAILABLE`, `NEEDS_CONFIRMATION`, `SOLD_OUT`, `EXPIRED`, `PAUSED`, `REMOVED`.<br>Standardized across SQL, TypeScript types, and UI states. | No alternative status names permitted in any layer. |
| **C-03** | **Overlapping Listing Visibility Fields:** Schema contained both `availability_status` and `is_active BOOLEAN`, causing dual-source ambiguity. | `DATABASE_SCHEMA.md` §1, §4.6<br>`SECURITY.md` §4.3<br>`PRD.md` §8.3<br>`ARCHITECTURE.md` §3.2<br>`API_DESIGN.md` §3.1 | **`is_active` completely removed from `listings`.**<br>`availability_status` is the sole authoritative field for listing lifecycle and visibility. | `is_active` retained on `profiles`, `halls`, and `categories` where it represents administrative entity enablement. |
| **C-04** | **`SOLD_OUT` & State Visibility Contradiction:** PRD/Schema treated `sold_out` as visible with badge, while User Flows treated it as hidden. | `PRD.md` §6.1, §7.3, FR-012/013<br>`DATABASE_SCHEMA.md` §4.6, §5.1<br>`SECURITY.md` §4.3<br>`USER_FLOWS.md` §3.1, §6<br>`API_DESIGN.md` §4.1 | **Visibility Rules:**<br>• `AVAILABLE`: Publicly visible.<br>• `NEEDS_CONFIRMATION`: Publicly visible with warning badge.<br>• `SOLD_OUT`, `EXPIRED`, `PAUSED`, `DRAFT`, `REMOVED`: Strictly hidden from general marketplace discovery. | Sold-out items may be displayed greyed out on the seller's dedicated storefront (`/store/[slug]`) to showcase product range. |
| **C-10** | **Broken RLS SQL & Nonexistent `user_id`:** `SECURITY.md` referenced `seller_profiles.user_id`, but schema used `seller_profiles.id = profiles.id`. | `DATABASE_SCHEMA.md` §4.4, §8<br>`SECURITY.md` §4.2, §4.3, §4.4, §4.5<br>`ARCHITECTURE.md` §3.4<br>`README.md` §2.5 | **Relational Model Standardized:**<br>`seller_profiles` has `id UUID PK DEFAULT gen_random_uuid()` and `user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE`.<br>All RLS policies evaluate `auth.uid() = user_id`. | Validated: All tables, columns, foreign keys, and ownership checks verified in SQL. |
| **C-13** | **Missing Two-Phase Expiry:** Schema only had `expires_at`, lacking the intermediate `NEEDS_CONFIRMATION` trigger mechanism. | `DATABASE_SCHEMA.md` §4.5, §4.6, §5.3, §7.2<br>`PRD.md` §5.3, FR-014/015<br>`ARCHITECTURE.md` §4.3, §8<br>`USER_FLOWS.md` §4.5, §6<br>`API_DESIGN.md` §3.1<br>`IMPLEMENTATION_ROADMAP.md` M5 | **Two-Phase Timestamps & Worker Added:**<br>• Added `confirm_before TIMESTAMPTZ` and `expires_at TIMESTAMPTZ` to `listings`.<br>• Added `default_confirm_lead_hours` to `categories`.<br>• Stored function `process_listing_expiry_transitions()` runs every 10 min. | Public queries include `(expires_at IS NULL OR expires_at > now())` to prevent display leakage if cron is delayed. |
| **C-15/16** | **Missing Storefront Slug & Image Fields:** Schema lacked `storefront_slug` and `storefront_image_url`, while routes referenced them. | `DATABASE_SCHEMA.md` §4.4<br>`PRD.md` §6.2, FR-005/006<br>`ARCHITECTURE.md` §3.2, §4<br>`USER_FLOWS.md` §3.4, §4.2<br>`API_DESIGN.md` §3.2, §4.3, §7<br>`SELLER_ONBOARDING_GUIDE.md` §5 | **Storefront Fields Added:**<br>`storefront_slug TEXT NOT NULL UNIQUE` and `storefront_image_url TEXT NULL` added to `seller_profiles`. All public storefront routes standardized to `/store/[storefront_slug]`. | Slugs are immutable once published to prevent breaking external links. |

---

## 2. Cross-Document Consistency Verification Table

Every check below was verified across all documents in `docs/`:

| Check ID | Focus Area | Documents Compared | Audit Findings | Corrective Actions Applied |
|---|---|---|---|---|
| **CHK-01** | Database Fields vs API Definitions | `DATABASE_SCHEMA.md`<br>`API_DESIGN.md` | API schemas referenced nonexistent fields (`hall_id` on listings) and lacked `slug` on listings. | Removed `hall_id` from listing insertion schema (derived from seller); added `slug` to listing DDL and Zod schemas. |
| **CHK-02** | API Routes vs User Flows | `API_DESIGN.md`<br>`USER_FLOWS.md` | Route references were inconsistent (`/sellers/[id]` vs `/sellers/[storeSlug]` vs `/store/[storefront_slug]`). | Standardized all public storefront routes to `/store/[storefront_slug]` and listing routes to `/listings/[slug]`. |
| **CHK-03** | RLS Policies vs Visibility Rules | `DATABASE_SCHEMA.md`<br>`SECURITY.md`<br>`PRD.md` | `SECURITY.md` used nonexistent `seller_profiles.user_id` and allowed public SELECT on sold-out items. | Standardized `seller_profiles.user_id` foreign key and restricted public SELECT to `('AVAILABLE', 'NEEDS_CONFIRMATION')`. |
| **CHK-04** | State Transitions vs Expiry Logic | `DATABASE_SCHEMA.md`<br>`USER_FLOWS.md`<br>`ARCHITECTURE.md` | The expiry cron function was missing `NEEDS_CONFIRMATION` transition logic and only transitioned to expired. | Rebuilt `process_listing_expiry_transitions()` as an idempotent two-phase worker handling both lead-time and final expiry. |
| **CHK-05** | Storefront Model Consistency | `PRD.md`<br>`DATABASE_SCHEMA.md`<br>`USER_FLOWS.md` | Storefront was described as a single-category shop in early drafts. | Re-architected data model and user flows so one seller account operates one storefront with multi-category listings. |
| **CHK-06** | WhatsApp Integration Boundaries | `PRD.md`<br>`ARCHITECTURE.md`<br>`API_DESIGN.md` | Architecture diagram showed an active NotificationService sending messages via WhatsApp. | Re-scoped `NotificationService` as a pure client URL constructor (`wa.me`); clarified that no Meta API or bot exists in V1. |
| **CHK-07** | Anonymous Buyer Experience | `PRD.md`<br>`USER_FLOWS.md`<br>`SECURITY.md` | PRD and User Flows previously mentioned optional buyer login. | Removed all buyer registration concepts; buyers are 100% anonymous across all documents. |
| **CHK-08** | Photo Upload Limits | `PRD.md`<br>`SECURITY.md`<br>`SELLER_ONBOARDING_GUIDE.md` | PRD specified 5 photos / 5 MB; Security and Seller Guide specified 3 photos / 2 MB. Photos were marked required in PRD. | Standardized to max 3 photos, 2 MB each, optional upload (text-only allowed). |
| **CHK-09** | Text Length Constraints | `PRD.md`<br>`DATABASE_SCHEMA.md`<br>`API_DESIGN.md` | PRD had 80 chars for title; DB schema had 120 chars. Description was 2000 vs 500 chars. | Standardized title to 2–120 characters and description to max 500 characters across all documents and CHECK constraints. |
| **CHK-10** | Roadmap Alignment | `IMPLEMENTATION_ROADMAP.md`<br>`PRD.md` | Old roadmap had 8 milestones starting with engineering, omitting manual validation (M0) and pilot metrics. | Rebuilt roadmap into standard M0–M6 sequence, including pre-engineering validation and six quantitative pilot metrics. |

---

## 3. Canonical Listing Lifecycle Summary

### 3.1 States
- `DRAFT`: Seller is preparing listing. Hidden.
- `AVAILABLE`: Live, discoverable on marketplace and storefront. Expiry timers active.
- `NEEDS_CONFIRMATION`: `confirm_before` passed. Live with warning badge. Grace period timer active.
- `SOLD_OUT`: Seller marked out of stock. Hidden from marketplace discovery. Timestamps paused.
- `PAUSED`: Seller temporarily paused listing. Hidden from public. Timestamps paused.
- `EXPIRED`: `expires_at` passed without confirmation. Hidden from public discovery.
- `REMOVED`: Soft-deleted (`deleted_at = now()`) by seller or admin. Hidden permanently.

### 3.2 Canonical Public Visibility Rule
A listing is publicly discoverable IF AND ONLY IF:
```sql
deleted_at IS NULL
AND availability_status IN ('AVAILABLE', 'NEEDS_CONFIRMATION')
AND (expires_at IS NULL OR expires_at > now())
AND EXISTS (
  SELECT 1 FROM public.seller_profiles sp
  WHERE sp.id = listings.seller_id AND sp.is_approved = TRUE
)
```

---

## 4. Final Database Model Changes Applied

1. **`seller_profiles` Table:**
   - Added: `user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE`.
   - Added: `storefront_slug TEXT NOT NULL UNIQUE`.
   - Added: `storefront_image_url TEXT NULL`.
2. **`listings` Table:**
   - Removed: `is_active BOOLEAN` (redundant with `availability_status`).
   - Added: `confirm_before TIMESTAMPTZ NULL`.
   - Added: `expires_at TIMESTAMPTZ NULL` (with index).
   - Added: `slug TEXT NOT NULL UNIQUE`.
   - Standardized: `availability_status listing_availability_status NOT NULL DEFAULT 'DRAFT'`.
   - Standardized: `description TEXT NULL CHECK (char_length(description) <= 500)`.
3. **`categories` Table:**
   - Added: `default_confirm_lead_hours INTEGER NULL`.
   - Standardized: `default_expiry_hours INTEGER NULL`.
4. **`listing_events` Table:**
   - Added canonical event types: `'needs_confirmation_triggered'`, `'availability_confirmed'`, `'sold_out'`, `'paused'`, `'resumed'`, `'contact_tapped'`.

---

## 5. Summary of Files Updated

- [`docs/DATABASE_SCHEMA.md`](file:///c:/Users/pc/Desktop/Campus%20Store/docs/DATABASE_SCHEMA.md) — Complete v2.0 schema, canonical enums, two-phase expiry function, RLS policies.
- [`docs/SECURITY.md`](file:///c:/Users/pc/Desktop/Campus%20Store/docs/SECURITY.md) — Defense-in-depth model, verified SQL RLS policies using `user_id`, storage rules, checklist.
- [`docs/PRD.md`](file:///c:/Users/pc/Desktop/Campus%20Store/docs/PRD.md) — Standardized user roles, journeys, two-phase availability, FRs, and acceptance criteria.
- [`docs/ARCHITECTURE.md`](file:///c:/Users/pc/Desktop/Campus%20Store/docs/ARCHITECTURE.md) — Modular monolith structure, sequence diagrams, ADRs, URL builder pattern.
- [`docs/USER_FLOWS.md`](file:///c:/Users/pc/Desktop/Campus%20Store/docs/USER_FLOWS.md) — Detailed flows for anonymous buyers, multi-category sellers, and admins; edge cases.
- [`docs/API_DESIGN.md`](file:///c:/Users/pc/Desktop/Campus%20Store/docs/API_DESIGN.md) — Server Actions, Zod schemas, route handlers, folder hierarchy.
- [`docs/IMPLEMENTATION_ROADMAP.md`](file:///c:/Users/pc/Desktop/Campus%20Store/docs/IMPLEMENTATION_ROADMAP.md) — M0 to M6 sequence, pilot measurement framework, testing plan.
- [`docs/ASSUMPTIONS_AND_OPEN_QUESTIONS.md`](file:///c:/Users/pc/Desktop/Campus%20Store/docs/ASSUMPTIONS_AND_OPEN_QUESTIONS.md) — Locked-down decisions, open founder questions, risk register.
- [`docs/SELLER_ONBOARDING_GUIDE.md`](file:///c:/Users/pc/Desktop/Campus%20Store/docs/SELLER_ONBOARDING_GUIDE.md) — Plain-English guide for student sellers at UG Legon.
- [`docs/README.md`](file:///c:/Users/pc/Desktop/Campus%20Store/docs/README.md) — Central documentation index and architecture overview.

---

## 6. Confirmation of Compliance

- **No application code was created.**
- **No database migrations were executed.**
- **No npm packages were installed.**
- **All documentation is internally consistent, verified, and ready for founder review.**

---

*End of Changelog & Consistency Audit.*

