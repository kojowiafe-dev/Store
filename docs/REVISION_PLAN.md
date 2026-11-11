# REVISION_PLAN.md — Stage A Audit

> **Purpose:** This document is the output of Stage A of the Final Product Specification Revision.  
> It records every contradiction found across the nine planning documents, makes a recommendation for each decision the brief asks to evaluate, lists all open decisions requiring founder input, and specifies which documents will change and how.  
>
> **No document has been rewritten yet.** Stage B begins only after the founder reviews and approves this plan.

---

## Table of Contents

1. [Contradictions Found Across Documents](#1-contradictions-found-across-documents)
2. [Recommendations on Evaluated Decisions](#2-recommendations-on-evaluated-decisions)
3. [Open Decisions Requiring Founder Approval](#3-open-decisions-requiring-founder-approval)
4. [Documents to Change and How](#4-documents-to-change-and-how)

---

## 1. Contradictions Found Across Documents

Each contradiction is numbered, cites the files and sections in conflict, and states the resolution that will be applied in Stage B (pending approval).

---

### C-01 · Authentication Method — Three Incompatible Descriptions

| File | Section | What It Says |
|---|---|---|
| `PRD.md` | §5.1 In Scope | "Register with phone number"; "Supabase Auth (phone number **or** email+password)" |
| `PRD.md` | §6.2 Seller Role | "Register using phone number and display name" |
| `PRD.md` | §7.2 Seller Onboarding | "Supabase Auth (phone OTP **or** email/password — TBD)" |
| `ARCHITECTURE.md` | §3.4 | "email + password, **or magic link**" |
| `SECURITY.md` | §2.1 | Supported V1 methods: "Email + Password" and "Magic Link (OTP via email)" — no phone |
| `SELLER_ONBOARDING_GUIDE.md` | §5 | "Your email address (this is your login) / A password" |

**Contradiction:** PRD says phone number. Architecture + Security say email/password or magic link. Seller Guide says email + password. Three different answers in the same document set.

**Resolution to apply in Stage B:** See Recommendation R-01 in Section 2.

---

### C-02 · Listing Status Names — `active` vs `available`, `deactivated` vs `removed`

| File | Section | Status Names Used |
|---|---|---|
| `PRD.md` | §5.1, §7.3, §7.4 | `draft`, **`active`**, `sold_out`, `needs_confirmation`, **`deactivated`**, `expired` |
| `DATABASE_SCHEMA.md` | §3.6 | `available`, `needs_confirmation`, `sold_out`, `expired`, `removed` |
| `USER_FLOWS.md` | §4.5, §7 | Mix of both naming schemes |
| Brief | Part 3.2 | Requires: `DRAFT`, `AVAILABLE`, `NEEDS_CONFIRMATION`, `SOLD_OUT`, `EXPIRED`, `REMOVED` |

**Contradiction:** PRD uses `active` (the DB schema uses `available`) and `deactivated` (the DB schema uses `removed`). These refer to the same states but with different names. No document currently includes `DRAFT` in the DB enum. `deactivated` appears only in PRD and not in the schema at all.

**Resolution:** Adopt the brief's authoritative set: `DRAFT`, `AVAILABLE`, `NEEDS_CONFIRMATION`, `SOLD_OUT`, `EXPIRED`, `REMOVED`. Remove `active` and `deactivated` from all documents. Update every table, enum, state diagram, RLS policy, and flow that references old names.

---

### C-03 · `is_active` Boolean vs Lifecycle Status — Overlapping Responsibility

| File | Section | What It Says |
|---|---|---|
| `DATABASE_SCHEMA.md` | §3.6 `listings` table | Has BOTH `availability_status` enum AND `is_active BOOLEAN` |
| `DATABASE_SCHEMA.md` | §3.6 RLS policy | Public read requires `is_active = TRUE AND availability_status NOT IN ('removed','expired')` |
| `PRD.md` | §7.4 | "Deactivate listing: Status → `deactivated`" (implies a status transition, not a boolean) |
| Brief | Part 3.2 | "Choose ONE authoritative lifecycle field. Avoid contradictory combinations of `availability_status`, `is_active`, `is_deleted`" |

**Contradiction:** The schema has two overlapping fields that can both hide a listing from buyers: setting `is_active = false` OR having `availability_status = 'removed'`. It is unclear which wins, what the difference means, and how the seller dashboard should display them.

**Resolution:** Remove `is_active` from `listings`. The single lifecycle field is `availability_status`. Seller "pausing" a listing → `REMOVED` is too permanent; introduce a `DRAFT` state recovery path, or treat a seller-paused listing as returning to `DRAFT`. The `deleted_at` soft-delete timestamp is retained for a distinct purpose: audit trail and hard-delete scheduling. Its role (audit only, never a visibility filter on its own) will be explicitly documented.

> **Note on `profiles.is_active`:** This field on `profiles` and `seller_profiles` is a different concept (account suspension) and is **not** affected by this resolution. It stays.

---

### C-04 · `sold_out` Visibility to Buyers — Direct Contradiction

| File | Section | What It Says |
|---|---|---|
| `PRD.md` | FR-005 | "`sold_out` listings SHALL be visually distinguished and **appear in the grid** but with WhatsApp button disabled" |
| `PRD.md` | §7.3 State Definitions table | `sold_out` Visible to Buyers = **"Yes (with badge)"** |
| `DATABASE_SCHEMA.md` | §3.6 RLS public read | `availability_status NOT IN ('removed', 'expired')` — `sold_out` is **NOT** in the exclusion list, so it IS readable |
| `SECURITY.md` | §4.3 | Same condition — `sold_out` is publicly readable |
| `USER_FLOWS.md` | §7 Availability Matrix | `sold_out` Visible to Buyers = **"No (hidden from browse)"** |
| Brief | Part 3.2 | **"SOLD_OUT: hidden from normal public discovery"** |

**Contradiction:** PRD and schema say sold_out IS visible. USER_FLOWS says it is NOT. These are directly opposite.

**Resolution:** Apply the brief's ruling: `SOLD_OUT` is **hidden from normal public marketplace discovery**. The question of whether sold-out items remain visible on the **seller's own storefront** (greyed out) is an OPEN DECISION (see OD-05). Update all RLS policies to add `sold_out` to the exclusion list for the public buyer query.

---

### C-05 · `needs_confirmation` Visibility — Configurable vs Defined

| File | Section | What It Says |
|---|---|---|
| `PRD.md` | FR-006 | Listings in `needs_confirmation` "SHALL NOT appear in the public storefront grid" |
| `PRD.md` | §7.3 State Definitions table | Visible to Buyers = **"Configurable (hide or show stale badge)"** |
| `USER_FLOWS.md` | §7 Availability Matrix | Visible to Buyers = **"Yes (with badge)"** |
| Brief | Part 3.2 | **"NEEDS_CONFIRMATION: visible with a clear availability warning"** |

**Contradiction:** PRD FR-006 says hidden; PRD §7.3 says configurable; User Flows says visible. Three answers.

**Resolution:** Apply the brief's ruling: `NEEDS_CONFIRMATION` is **publicly visible with a clear "availability not confirmed" warning badge**. Update FR-006, §7.3, and all flow diagrams.

---

### C-06 · Image Count and Size Limits — Three Different Values

| File | Section | What It Says |
|---|---|---|
| `PRD.md` | §7.4 Listing Form | **min 1, max 5 photos; 5 MB** per image |
| `PRD.md` | FR-012 | "1 and 5 photos per listing. Each image SHALL be a maximum of **5 MB**" |
| `ARCHITECTURE.md` | §3.5 Storage | "Maximum **3**"; **2 MB** per image |
| `SECURITY.md` | §5 | Max file size: **2 MB** |
| `API_DESIGN.md` | Folder structure notes | "max 3 images" |
| `SELLER_ONBOARDING_GUIDE.md` | §6 | "up to **3 photos**" |

**Contradiction:** PRD says 5 images / 5 MB. Architecture, Security, API Design, and Seller Guide say 3 images / 2 MB.

**Resolution:** Apply the brief's recommendation: **3 images maximum, 2 MB each** (consistent with 4 of 5 documents and the brief's "simple MVP maximum" guidance). Update PRD FR-011/012 and §7.4.

---

### C-07 · Photo is Required vs Optional

| File | Section | What It Says |
|---|---|---|
| `PRD.md` | FR-011 | "Sellers SHALL be able to create a listing with … **minimum one photo**" |
| `PRD.md` | §7.4 Listing Form | Photos: **Yes (min 1**, max 5) — marked as **Required** |
| `DATABASE_SCHEMA.md` | §3.7 | `listing_images` has no NOT NULL linkage to listings; images are optional at the DB level |
| Brief | Part 2.3 | "**A listing may be published without a photo** (a text-only listing is better than none)" |

**Contradiction:** PRD makes photos mandatory; the brief explicitly makes them optional.

**Resolution:** Photos are **optional**. The admin dashboard surfaces no-photo listings so a human can follow up with sellers. Remove the minimum-1 constraint from PRD and schema notes.

---

### C-08 · Listing Title Character Limit

| File | Section | What It Says |
|---|---|---|
| `PRD.md` | §7.4 Listing Form, FR-011 | Max **80 characters** |
| `DATABASE_SCHEMA.md` | §3.6 `listings` CHECK constraint | `char_length(title) BETWEEN 2 AND **120**` |

**Contradiction:** 80 vs 120 characters.

**Resolution:** Apply **120 characters** (the DB constraint) as the authoritative limit. The PRD constraint of 80 was set before the schema was written and is more restrictive without a stated reason. 120 is sufficient for a descriptive product title without being excessively long.

---

### C-09 · Listing Description Character Limit

| File | Section | What It Says |
|---|---|---|
| `PRD.md` | §7.4 Listing Form, FR-011 | Max **500 characters** |
| `DATABASE_SCHEMA.md` | §3.6 | `char_length(description) <= **2000**` |

**Contradiction:** 500 vs 2000 characters.

**Resolution:** Apply **500 characters** (PRD value). Services and complex products need more detail, but 2000 is excessive for a campus discovery card. 500 characters (~80–100 words) is sufficient. Update the DB CHECK constraint to `<= 500`.

> *Alternative: 1000 characters as a compromise. Flag as OD-04 if founder wants input.*

---

### C-10 · `seller_profiles` — Missing `user_id` Column Referenced in Security Policies

| File | Section | What It Says |
|---|---|---|
| `DATABASE_SCHEMA.md` | §3.4 | `seller_profiles.id` is BOTH the PK **and** the FK to `profiles.id`. There is NO `user_id` column. |
| `SECURITY.md` | §4.2 | RLS policies reference `user_id = auth.uid()` on `seller_profiles` — this column **does not exist** |
| `SECURITY.md` | §4.3 | `listings` SELECT policy checks `seller_id IN (SELECT id FROM public.seller_profiles WHERE user_id = auth.uid())` — references non-existent column |

**Contradiction:** The Security document was written assuming `seller_profiles` has a separate `user_id` column. The Database Schema document uses `id` as the user link (the PK = the user's auth UUID). All RLS policies in `SECURITY.md` that reference `user_id` will fail to compile.

**Resolution:** In all SECURITY.md RLS policies, replace `user_id = auth.uid()` with `id = auth.uid()` on `seller_profiles`. Listings policies should check `seller_id = auth.uid()` directly (since `listings.seller_id` → `seller_profiles.id` → `auth.users.id`).

---

### C-11 · `listing_events` Event Types — Out of Sync Between Schema and Security

| File | Section | What It Says |
|---|---|---|
| `DATABASE_SCHEMA.md` | §3.8 | Allowed event types (CHECK constraint): `'created', 'updated', 'activated', 'deactivated', 'expired', 'sold_out', 'availability_confirmed', 'removed', 'reported', 'report_resolved'` |
| `SECURITY.md` | §4.5 | Anon INSERT policy allows `event_type IN ('view', 'contact_initiated')` |

**Contradiction:** `'view'` and `'contact_initiated'` appear in the Security doc's RLS policy but are not in the Database Schema's CHECK constraint. Any INSERT of these event types would fail at the database level.

**Resolution:** Add `'contact_tapped'` (renamed from `contact_initiated` for clarity) to the CHECK constraint in `DATABASE_SCHEMA.md`. Add `'view'` if view tracking is in scope. Remove the anon INSERT policy for `listing_events` entirely — contact taps should be recorded server-side (via a Server Action) using the service role, not via an open anon INSERT. This also prevents clients from spoofing contact or view events.

---

### C-12 · Hall on Listings — Implicit Decision, Not Documented as a Decision

| File | Section | What It Says |
|---|---|---|
| `DATABASE_SCHEMA.md` | §3.6 | `listings.hall_id UUID NOT NULL` — listings have their own hall FK |
| `PRD.md` | §9.5 Scalability | "`hall_id` on all relevant tables" — implies listings store hall |
| `USER_FLOWS.md` | Throughout | References filtering "by hall" without specifying the source field |
| Brief | Part 2.4 | "This is an OPEN DECISION. Recommended default: each listing inherits the seller's hall and does not store its own." |

**Contradiction:** The existing schema stores `hall_id` on listings as a denormalized field. The brief recommends listings should inherit the hall from the seller and optionally allow override. This is an architectural choice that affects the schema, RLS, search filters, and all queries. It was silently decided in the schema without being recorded as a choice.

**Resolution:** Mark as OPEN DECISION (OD-02). Recommend the brief's default: listings inherit from seller; `hall_id` on listings is **derived at query time, not stored**, unless a per-listing override is needed. Document both options with trade-offs. The schema change is: remove `listings.hall_id` and join through `seller_profiles.hall_id` in queries, OR keep `listings.hall_id` but auto-populate it from the seller's hall at insert time (via trigger). **The recommended default is to keep `listings.hall_id` as a denormalized convenience column auto-populated at insert from `seller_profiles.hall_id`, with no UI for override in V1.** This keeps the filter query simple and avoids a join on every search, while the override capability can be added later.

---

### C-13 · Two-Phase Expiry Logic — Not Reflected in Schema

| File | Section | What It Says |
|---|---|---|
| `PRD.md` | §7.3, FR-046–048 | Two timestamps: `confirm_before` (triggers → `needs_confirmation`) and a grace period after which → `expired` |
| `PRD.md` | FR-019 | Listings SHALL record `confirm_before` timestamp |
| `DATABASE_SCHEMA.md` | §3.6 | Only `expires_at` timestamp exists. No `confirm_before` field. |
| `DATABASE_SCHEMA.md` | §5.3 | `mark_expired_listings()` does a **single** transition: active → expired when `expires_at < now()` |

**Contradiction:** PRD defines a two-phase system (confirm_before → needs_confirmation → grace → expired). The schema only implements a one-phase system (expires_at → expired). The `needs_confirmation` state can never be triggered automatically with the current schema.

**Resolution:** Add `confirm_before TIMESTAMPTZ` to `listings`. The expiry cron runs in two passes:
1. `AVAILABLE` → `NEEDS_CONFIRMATION` when `now() > confirm_before`
2. `NEEDS_CONFIRMATION` → `EXPIRED` when `now() > expires_at` (expires_at = confirm_before + grace_period)

The `confirm_before` and `expires_at` values are set at listing creation from category defaults and reset when a seller reconfirms. See R-02 for the recommended defaults.

---

### C-14 · Storefront URL Pattern — Three Different Formats

| File | Section | What It Says |
|---|---|---|
| `ARCHITECTURE.md` | §3.1 | `/sellers/[id]/page.tsx` — ID-based route |
| `API_DESIGN.md` | §4, §9 Folder Structure | `/sellers/[storeSlug]` — slug-based route |
| `USER_FLOWS.md` | §3.3 | `/sellers/[id]` — ID-based |
| Brief | Part 2.2 | `campusstore.com/store/akua-essentials` — `/store/[storeSlug]` |

**Contradiction:** Three different URL patterns across four documents.

**Resolution:** Adopt the brief's format: `/store/[storeSlug]`. This is more user-friendly, shareable, and matches the brief's intent. All documents updated consistently.

---

### C-15 · `seller_profiles` — Missing `storefront_slug` Column

| File | Section | What It Says |
|---|---|---|
| `DATABASE_SCHEMA.md` | §3.4 | No `storefront_slug` column defined in `seller_profiles` |
| `API_DESIGN.md` | §4 Route Handlers | References `/sellers/[storeSlug]` as a route parameter |
| Brief | Part 2.2 | "shareable URL, for example campusstore.com/store/akua-essentials" |
| Brief | Part 5.2 | "storefront slug is unique and the public storefront resolves through the slug" |

**Contradiction:** The storefront slug is used in routes and referenced in the brief but does not exist in the database schema. `store_name` exists but is not the same as a URL slug.

**Resolution:** Add `storefront_slug TEXT NOT NULL UNIQUE` to `seller_profiles`. Auto-generated from `store_name` at registration (slugified, deduplicated). This is a first-class column, not derived at query time, because it must be globally unique and URL-safe.

---

### C-16 · `seller_profiles` — Missing `storefront_image_url` Column

| File | Section | What It Says |
|---|---|---|
| `DATABASE_SCHEMA.md` | §3.4 | No storefront image column |
| Brief | Part 2.1 | "Storefront image or logo" is an optional field on seller profile |

**Contradiction:** The brief defines storefront image as a valid optional field; the schema has no place for it.

**Resolution:** Add `storefront_image_url TEXT NULL` to `seller_profiles`. Stored as a Supabase Storage path; served via CDN. Upload uses the same Storage bucket as listing images.

---

### C-17 · Categories in Seller Guide vs Schema — Different Lists

| File | Section | Categories Listed |
|---|---|---|
| `SELLER_ONBOARDING_GUIDE.md` | §2 | Food, Clothing & Accessories, Electronics, **Books & Stationery**, Services, **Free Items**, Other |
| `DATABASE_SCHEMA.md` | §3.5 Seed | Food & Snacks, Groceries, Clothing & Accessories, Personal Care, Electronics, Services |

**Contradiction:** Seller Guide lists "Books & Stationery", "Free Items", and "Other" which don't exist in the schema. Schema has "Groceries" and "Personal Care" not in the guide.

**Resolution:** Use the schema's category list as authoritative (it was more carefully designed with expiry defaults). Update Seller Guide to match. "Books & Stationery" can be added as a category if the founder wants it — record as OD-07. Remove "Free Items" (a "GHS 0 price" listing covers this case without a separate category).

---

### C-18 · Roadmap — Missing M0, Misaligned Milestone Count

| File | Section | What It Says |
|---|---|---|
| `IMPLEMENTATION_ROADMAP.md` | All | 8 milestones (M1–M8), all engineering milestones, no product validation milestone |
| Brief | Part 11 | Requires M0 (manual campus pilot before engineering), then M1–M6 — **7 total** |

**Contradiction:** Current roadmap starts with engineering; brief requires a pre-engineering product validation milestone and a tighter 7-milestone structure.

**Resolution:** Restructure to M0–M6 as specified. M0 is the manual campus pilot (no code). M1–M5 are engineering. M6 is pilot launch and evaluation. Pilot metrics must be defined in M0 and revisited in M6.

---

### C-19 · Admin Role Field — `profiles.role` vs `profiles.is_admin`

| File | Section | What It Says |
|---|---|---|
| `PRD.md` | §6.3 | "Admin privilege is set directly in the database (`profiles.role = 'admin'`)" |
| `DATABASE_SCHEMA.md` | §3.3 | `profiles.is_admin BOOLEAN NOT NULL DEFAULT FALSE` |
| `SECURITY.md` | §2.2 | `profiles.is_admin = true` |

**Contradiction:** PRD implies a `role` text enum field; DB schema uses a boolean `is_admin`.

**Resolution:** Keep `is_admin BOOLEAN` from the schema (simpler, already in schema, referenced correctly by Security and Architecture). Remove `profiles.role = 'admin'` language from PRD. The middleware checks `profiles.is_admin = true`. A future `role` text enum would only be needed if tiered admin levels are required.

---

### C-20 · Listing `slug` — Referenced in PRD but Missing from Schema

| File | Section | What It Says |
|---|---|---|
| `PRD.md` | FR-007 | "Each listing SHALL have a unique, human-readable slug-based URL (`/listing/[slug]`)" |
| `DATABASE_SCHEMA.md` | §3.6 | No `slug` column on `listings` — routes would use `id` |
| `API_DESIGN.md` | §4 | Route: `GET /api/listings/[id]` — ID-based, not slug |

**Contradiction:** PRD requires slug URLs for listings; schema and API design use ID-based routes.

**Resolution:** Add `slug TEXT NOT NULL UNIQUE` to `listings`. Auto-generated from `title` at creation (slugified + short random suffix for uniqueness). The public URL is `/listing/[slug]`. The API route `GET /api/listings/[slug]` looks up by slug. The `id` is used internally. This improves shareability and readability (matches the brief's storefront slug model).

---

### C-21 · Anonymous Report Submission — Contradicted Between Schema and Security

| File | Section | What It Says |
|---|---|---|
| `DATABASE_SCHEMA.md` | §3.9 RLS | "Authenticated users can submit a report" — INSERT requires `auth.uid() IS NOT NULL OR reporter_id IS NULL` |
| `SECURITY.md` | §4.6 | `reports_insert_anon` — allows anon INSERT WITH CHECK (true) |
| `PRD.md` | §6.1 Buyer Can | "Flag a listing as inappropriate (via a lightweight report form; **no login required**)" |

**Contradiction:** PRD says anonymous reports are allowed. Security doc implements it correctly (anon INSERT policy). Database Schema INSERT check requires `auth.uid() IS NOT NULL` — which excludes anon users.

**Resolution:** Anonymous reporting IS allowed (consistent with PRD and brief). Fix the Database Schema RLS to allow anon INSERT on `reports`. The Security doc's implementation is correct; the DB schema's INSERT check is too restrictive.

---

### C-22 · WhatsApp Number Privacy — Overstated Protection in PRD

| File | Section | What It Says |
|---|---|---|
| `PRD.md` | §6.1 | "See seller's full phone number directly on the page (linked via wa.me, **not displayed as plain text in V1**)" |
| `PRD.md` | FR-016 | "The seller's raw phone number SHALL NOT be rendered as visible plain text in the page HTML" |
| `SECURITY.md` | §9 | "buyers receive the number when they open the click-to-chat link" |
| Brief | Part 1.4 | "Be honest about privacy: a click-to-chat URL contains the seller's phone number. **Do not claim the number is completely hidden from buyers.**" |

**Contradiction:** PRD implies strong number hiding. The brief explicitly requires honesty: the number is in the wa.me URL and visible to any buyer who inspects the link.

**Resolution:** Update PRD and Security to state clearly: "The seller's WhatsApp number is not displayed as text on the page, but it is embedded in the wa.me click-to-chat URL and is therefore accessible to any buyer who opens or inspects the link. This is a known and accepted behaviour of the wa.me protocol." Remove any claim that the number is "completely hidden."

---

### C-23 · Storefront and Product Discovery — Not Fully Reflected in USER_FLOWS

| File | Section | What It Says |
|---|---|---|
| `USER_FLOWS.md` | §3.1 | Buyer flow: Home → Category Grid → Category Listings → Listing Detail |
| Brief | Part 1.3 | Main marketplace aggregates products from **all participating sellers**; buyers discover individual products from the homepage without visiting storefronts |
| `USER_FLOWS.md` | §3.3 | Seller storefront is accessible from listing detail — correct |

**Contradiction (gap):** USER_FLOWS does not include a flow for the homepage showing a product grid across all sellers (not category-first). The brief requires the homepage to feel like a "campus discovery platform" where individual products from all sellers are immediately visible.

**Resolution:** Add a "Marketplace Homepage" flow to USER_FLOWS. The homepage shows a product grid of AVAILABLE + NEEDS_CONFIRMATION listings across all sellers in the configured hall, sortable by recency. Category filter chips appear above. This is the primary discovery flow. Storefront visits are secondary.

---

### C-24 · Seller Multi-Category — Not Explicitly Supported in Flows

| File | Section | What It Says |
|---|---|---|
| `USER_FLOWS.md` | Throughout | Seller flows show single category creation |
| `API_DESIGN.md` | §9 Folder Structure | Only one "New Listing" flow |
| Brief | Part 1.2 | "A seller can sell different types of products at once … All managed under one seller account" |
| Brief | Part 2.3 | "A seller may have many listings across different categories and must not need a new storefront to sell in a new category" |

**Contradiction (gap):** The user flows do not explicitly document the multi-category case. This creates a risk that the UI is built as if each seller has one category.

**Resolution:** Add an explicit seller flow for "Add product in a different category." The storefront page should group listings by category (tabs or sections) as the brief specifies. Document this in USER_FLOWS and ARCHITECTURE.

---

### C-25 · `needs_confirmation` — Triggered Automatically but No `confirm_before` in Schema

Already covered in C-13. Listed here separately to highlight the USER_FLOWS impact: USER_FLOWS §4.6 describes "Reactivate Expired Listing" but has no flow for responding to a `needs_confirmation` prompt. This flow must be added.

---

### C-26 · Pilot Metrics — Entirely Absent

| File | Section | What It Says |
|---|---|---|
| `IMPLEMENTATION_ROADMAP.md` | All | No pilot metrics defined anywhere |
| Brief | Part 11 | Requires specific, measurable pilot metrics in M0 and M6 |

**Resolution:** Define pilot metrics in IMPLEMENTATION_ROADMAP.md M0 and M6 sections. See R-03 for the recommended set.

---

## 2. Recommendations on Evaluated Decisions

### R-01 · Authentication Method

**Decision required:** Which single primary authentication method for sellers and admins?

**Options evaluated:**

| Method | Cost | Friction | Reliability | Supabase Support |
|---|---|---|---|---|
| Email + Password | Free | Medium (password management) | High | ✅ Native |
| Email Magic Link | Free | Low (one click) | Depends on email delivery in Ghana | ✅ Native |
| Google Sign-In | Free | Very low (one tap) | High | ✅ OAuth provider |
| Phone OTP (SMS) | Per-message cost (Twilio/etc.) | Low for Ghanaians | Medium (SMS delivery in Ghana varies) | ✅ But requires paid SMS provider |

**Key inputs from brief:**
- Phone OTP requires a paid SMS provider and per-message cost.
- The seller's WhatsApp number can be captured as a plain profile field (no OTP verification needed in pilot).
- Do not implement multiple methods without strong justification.

**Recommendation: Google Sign-In as primary, Email + Password as fallback.**

**Reasoning:**
- Google Sign-In (OAuth via Supabase) has zero per-message cost, near-zero friction for Ghanaian students (most have Google accounts via Gmail or Android), and is a one-tap flow on mobile.
- It eliminates forgotten passwords and reduces support burden.
- Supabase supports Google OAuth natively with no additional configuration cost.
- Email + Password remains available as a fallback for sellers without Google accounts.
- The WhatsApp number is captured as a standard profile field (text input) during onboarding — no OTP verification of that number in V1. Trust is established through admin approval.
- Phone OTP is deferred to V2 (can be added without breaking auth session model).

**Record as OD-01 for founder to confirm or override.**

---

### R-02 · Expiry Defaults and Grace Periods

**Recommended defaults:**

| Category | `confirm_before` (→ NEEDS_CONFIRMATION) | Grace period (→ EXPIRED) | `expires_at` = confirm_before + grace |
|---|---|---|---|
| Food & Snacks | 24 hours | 6 hours | 30 hours from creation |
| Groceries | 48 hours | 12 hours | 60 hours |
| Clothing & Accessories | 7 days | 48 hours | 9 days |
| Personal Care | 7 days | 48 hours | 9 days |
| Electronics | 30 days | 72 hours | ~33 days |
| Services | No expiry (NULL) | No expiry | NULL |

**Reasoning:**
- Food sellers check in frequently anyway; a 6-hour grace is enough warning without punishing a seller who is momentarily offline.
- General physical products have slower turnover; 48-hour grace gives sellers a business day to respond.
- Services are ongoing; forcing expiry would create unnecessary work for tutors, designers, etc.
- All values are stored in `categories.default_expiry_hours` and `categories.default_grace_hours` and are administrator-adjustable without a code deploy.

---

### R-03 · Seller Approval Model

**Options:**
- (a) Admin must approve before listings are visible.
- (b) Sellers publish immediately; admin moderates after the fact via reports.

**Recommendation: Option (a) — admin approval for the pilot.**

**Reasoning:**
- The pilot has approximately 10 sellers the admin likely knows personally. Manual approval is trivially fast.
- Approval creates a trust signal: buyers see only "vetted" sellers.
- Food sellers who need same-day listing visibility are onboarded before they start selling (not mid-service). Approval delay is a one-time event, not recurring.
- After the pilot, if seller volume grows, the policy can switch to (b) with reports-based moderation.

**Record as OD-01b for founder to confirm.**

---

### R-04 · Pilot Metrics (M0 and M6)

**Recommended metrics:**

| Metric | How Measured |
|---|---|
| **Seller time to first published listing** | Timestamp delta: `seller_profiles.created_at` → first `listing.created_at` where status = AVAILABLE |
| **14-day seller retention** | % of sellers with at least one AVAILABLE or NEEDS_CONFIRMATION listing 14 days after their first listing |
| **Active listing count at pilot end** | Count of listings with status IN (AVAILABLE, NEEDS_CONFIRMATION) at M6 evaluation date |
| **Contact taps per listing** | Count of `listing_events` with `event_type = 'contact_tapped'` per listing per week |
| **Buyer return visits** | Count of unique sessions (approximated via Vercel Analytics page views) in a rolling 7-day window |
| **Self-reported purchases** | Follow-up question to buyers and sellers via admin WhatsApp: "Did you complete this purchase?" — manual count, recorded in a simple spreadsheet |

**Important disclaimer to include in M0:** Contact taps measure interest, not completed purchases. Purchase data in V1 depends on a manual follow-up survey. Do not report contact taps as sales.

---

### R-05 · Sold-Out on Seller Storefront

**Recommendation:** Sold-out listings SHOULD remain visible (greyed out, no WhatsApp button) on the **seller's own storefront** only. They should be hidden from the **main marketplace discovery grid**.

**Reasoning:** A seller's storefront is a browsable catalogue of everything they sell. Showing sold-out items communicates the range of a seller's business and signals that the seller is active. Buyers can see "Jollof Rice — Sold Out Today" and understand the seller will likely restock. The main marketplace grid shows available stock only; showing sold-out there wastes buyer attention.

**Record as OD-05 for founder to confirm.**

---

## 3. Open Decisions Requiring Founder Approval

Each item is an OPEN DECISION. No implementation begins on these until a decision is recorded.

| # | Decision | Recommended Default | Urgency |
|---|---|---|---|
| **OD-01** | Primary authentication method | Google Sign-In + Email/Password fallback | Blocks M2 |
| **OD-01b** | Seller approval model (approve-first vs publish-immediately) | Approve-first for pilot | Blocks M2 |
| **OD-02** | Hall on listings: inherit from seller (derived) vs store own `hall_id` | Store denormalized `hall_id` auto-populated from seller at insert | Blocks M2 schema |
| **OD-03** | Brand name and domain | "Campus Store" placeholder until decided | Blocks go-live only |
| **OD-04** | Listing description character limit | 500 characters | Blocks M2 schema |
| **OD-05** | Sold-out items on seller's own storefront (visible greyed-out vs hidden) | Visible and greyed-out on storefront; hidden from marketplace | Blocks M3 UI |
| **OD-06** | Pilot hall identity | Configure via `NEXT_PUBLIC_HALL_SLUG` env var + DB seed | Blocks seed data |
| **OD-07** | Add "Books & Stationery" as a category? | No in V1 (use existing categories); revisit post-pilot | Low urgency |
| **OD-08** | "Store-level selling today" toggle for time-sensitive sellers | Recommended: add it; one tap confirms all food listings | Blocks M4 |
| **OD-09** | Seller verification depth (name + WhatsApp only vs ID document) | Name + WhatsApp only for pilot | Blocks M2 |
| **OD-10** | Buyer-seller disclaimer copy (final wording) | *"Campus Store connects buyers and sellers. We do not handle payments, guarantee transactions, or facilitate delivery."* | Blocks M3 |
| **OD-11** | Future seller fee model | No fees in V1; plan optional in V2 | No urgency |
| **OD-12** | University endorsement or independent operation | Independent, no implied UG endorsement | Affects all copy |
| **OD-13** | Data retention for deleted listings | Soft-delete retained for 90 days, then eligible for hard delete | Blocks M5 policy |
| **OD-14** | Maximum images per listing | 3 images, 2 MB each | Blocks M2 schema |
| **OD-15** | Who creates the first admin account? | Founder sets `is_admin = true` via Supabase dashboard | Blocks M5 |

---

## 4. Documents to Change and How

Stage B will rewrite the following documents. Changes are described conservatively — no content that is correct and consistent will be deleted.

| Document | Changes Required |
|---|---|
| **PRD.md** | (1) Replace all `active`/`deactivated` state references with `AVAILABLE`/`REMOVED`. (2) Update listing state table and diagram. (3) Photos: change from required to optional. (4) Max images: 5→3, max size: 5MB→2MB. (5) Title limit: 80→120 chars. (6) `needs_confirmation` visibility: mark as visible-with-badge. (7) `sold_out` visibility: hidden from marketplace, see OD-05 for storefront. (8) Auth: replace "phone number" with recommended method (OD-01). (9) Remove `profiles.role = 'admin'`; use `is_admin BOOLEAN`. (10) Fix disclaimer on WhatsApp number privacy. (11) Add multi-category seller flows. (12) Add `slug` to listings in requirements. (13) Update storefront URL to `/store/[storeSlug]`. |
| **ARCHITECTURE.md** | (1) Update module list to reflect storefront as first-class feature. (2) Update route references: `/sellers/[id]` → `/store/[storeSlug]`. (3) Update NotificationService to reflect it is a URL builder (remove `notifySellerOfInterest` as V2 concern from main V1 description). (4) Update auth section to reflect recommended method (OD-01). (5) Remove `is_active` from listings in any schema references. |
| **DATABASE_SCHEMA.md** | (1) Add `DRAFT` to `availability_status` enum. Rename `available`→keep (it's correct); ensure `active` is not in the enum. (2) Remove `is_active BOOLEAN` from `listings` table. (3) Add `confirm_before TIMESTAMPTZ` to `listings`. (4) Add `slug TEXT NOT NULL UNIQUE` to `listings`. (5) Add `storefront_slug TEXT NOT NULL UNIQUE` to `seller_profiles`. (6) Add `storefront_image_url TEXT NULL` to `seller_profiles`. (7) Add `default_grace_hours INTEGER` to `categories`. (8) Update `listings.hall_id` handling to reflect OD-02 resolution. (9) Fix description CHECK: `<= 500`. (10) Update `mark_expired_listings()` to two-phase function (confirm_before → NEEDS_CONFIRMATION, then → EXPIRED). (11) Add `contact_tapped` to `listing_events` CHECK constraint. (12) Fix reports anonymous INSERT policy. (13) Update ER diagram to reflect new columns. (14) Update seed data: add `default_grace_hours`, `storefront_slug` values, `slug` on listings. |
| **SECURITY.md** | (1) Fix all `user_id = auth.uid()` references on `seller_profiles` → `id = auth.uid()`. (2) Fix listings RLS to use `seller_id = auth.uid()`. (3) Update listings public SELECT policy: add `sold_out` to exclusion list. (4) Add `DRAFT` to public exclusion list. (5) Update `listing_events` anon INSERT policy (remove it; contact tap recording is server-side). (6) Fix reports anon INSERT policy to allow anonymous reports. (7) Update WhatsApp number privacy statement to be honest about wa.me URL. (8) Update auth section to reflect OD-01. |
| **USER_FLOWS.md** | (1) Add "Marketplace Homepage" flow (product grid across all sellers, not category-first). (2) Add "Add product in a different category" seller flow. (3) Add "Respond to needs_confirmation prompt" seller flow. (4) Fix availability matrix: sold_out = hidden from marketplace; needs_confirmation = visible with badge. (5) Update all state names to authoritative set. (6) Update storefront URL to `/store/[storeSlug]`. (7) Update registration flow to reflect recommended auth method. |
| **API_DESIGN.md** | (1) Update all route references: `/sellers/[storeSlug]` → `/store/[storeSlug]`. (2) Add `slug` to CreateListingSchema. (3) Add `storefront_slug` to CreateSellerProfileSchema. (4) Update Server Actions to reflect: no `is_active` on listings, two-phase expiry, DRAFT as a valid initial status. (5) Update `updateAvailabilitySchema` to reflect authoritative state names. (6) Add `recordContactTap` server action to listing actions. (7) Update folder structure to reflect new routes. |
| **IMPLEMENTATION_ROADMAP.md** | (1) Restructure: add M0 (product validation, pre-engineering), renumber existing milestones as M1–M5, make current M8 into M6 (Pilot Launch). (2) Add pilot metrics to M0 and M6. (3) Add "contact tap recording" to M3 scope. (4) Add "admin manual reminder via WhatsApp" to M5 scope. (5) Remove day-count estimates or clearly state assumptions behind them. |
| **ASSUMPTIONS_AND_OPEN_QUESTIONS.md** | (1) Replace old open questions format with consolidated OD-01–OD-15 from this plan. (2) Carry forward all previously valid assumptions. (3) Add new assumptions: Google OAuth as auth (if approved), two-phase expiry, photos optional, sold-out hidden from marketplace. (4) Add new risks: Google OAuth availability in Ghana, Supabase OAuth callback URL configuration. |
| **SELLER_ONBOARDING_GUIDE.md** | (1) Fix category list to match schema (remove Books & Stationery, Free Items; add Groceries, Personal Care). (2) Update sign-up steps to reflect actual auth method (OD-01). (3) Update photo count to "up to 3 photos". (4) Clarify WhatsApp number is in the contact link. |
| **README.md** | (1) Update document map to include this REVISION_PLAN. (2) Update open questions table with OD-01–OD-15 numbers. (3) Update quick reference to reflect authoritative state names and storefront URL. |

---

## Summary for the Founder

**What to review in this plan:**

1. **C-01–C-26:** The contradictions list. No action needed unless you disagree with a resolution.
2. **OD-01 to OD-15:** The open decisions. Each one needs a "yes/proceed with default" or an override. Highest-urgency items: OD-01, OD-01b, OD-02, OD-05, OD-06.
3. **R-01 (Auth):** Google Sign-In + Email/Password — does this match your intentions?
4. **R-03 (Approval):** Approve-first for pilot — confirm this.
5. **R-05 (Sold-out on storefront):** Visible-greyed-out on storefront, hidden from marketplace — confirm this.

**Stage B begins only after you review this document and approve (or modify) the plan.**

---

*Document produced: 2026-11-10 | Stage A — awaiting founder review*

