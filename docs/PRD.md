# Product Requirements Document (PRD) — Campus Store

**Platform:** Campus Store — WhatsApp-Native Campus Product Discovery Network  
**Target Market:** University of Ghana (UG), Legon (Initial Pilot: One Hall, ~10 Sellers)  
**Version:** 2.0 (Standardized Architecture & Consistent Specification)  
**Status:** Approved for Implementation Planning  

---

## 1. Executive Summary

**Campus Store** is a lightweight, mobile-first product discovery marketplace tailored for the residential campus environment of the University of Ghana, Legon. 

Student micro-sellers currently advertise products across ephemeral WhatsApp statuses, noisy hall group chats, and broadcast lists. This creates high friction: buyers cannot search across sellers, food availability is volatile, and sellers must post repeatedly.

Campus Store turns this dynamic into structured discovery:
1. **Sellers** create a digital storefront under one account, publish individual products across multiple categories (food, clothing, personal care, electronics, groceries, services), and manage availability.
2. **Buyers** browse the marketplace anonymously without creating an account or installing an app, filter by category and hall, search products, inspect seller storefronts, and tap a prefilled WhatsApp link to initiate a direct transaction.
3. **Transactions & Fulfillment** happen off-platform over WhatsApp and peer-to-peer mobile payment (e.g. Mobile Money). Campus Store does not process payments, manage delivery, or charge transaction fees in V1.

---

## 2. Core Principles & Non-Negotiables

1. **Discovery-First, Not Traditional E-Commerce:** No cart, no checkout, no payment gateway, no shipping logistics.
2. **WhatsApp as the Interaction Layer:** Click-to-chat links (`wa.me`) connect buyers directly to sellers.
3. **Frictionless Buyer Experience:** 100% public browsing. No buyer sign-up or login required.
4. **Minimal Seller Overhead:** An approved seller can register and publish a product in under 5 minutes.
5. **Authoritative Two-Phase Availability:** Clear lifecycle (`AVAILABLE`, `NEEDS_CONFIRMATION`, `SOLD_OUT`, `EXPIRED`, `PAUSED`, `REMOVED`) with automated expiry transitions to prevent stale inventory from eroding trust.
6. **One Seller, One Storefront, Many Products:** A seller has one account, one storefront, and multiple independent listings across diverse categories.
7. **Transparent Scope & Legal Boundaries:** The platform never implies it guarantees transactions or payments.
8. **Scalable Modular Monolith:** Next.js (App Router), TypeScript strict mode, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage, RLS) hosted on Vercel.

---

## 3. User Roles & Capabilities

### 3.1 Buyer (Unauthenticated)
- **Browse & Search:** Access the public marketplace homepage, search listings by keyword, and filter by hall or category.
- **Inspect Listings:** View product images, title, price (or "Negotiable" / "Contact for Price" in GHS), description, seller hall, and availability status.
- **Inspect Storefronts:** View a seller’s dedicated digital storefront (`/store/[storefront_slug]`) with all their eligible products.
- **Contact Seller:** Tap "Chat on WhatsApp" to open a pre-filled WhatsApp conversation on the seller's phone.
- **Report Content:** Submit an anonymous abuse or moderation report against a listing.
- *Restrictions:* Cannot create listings or access dashboard views.

### 3.2 Seller (Authenticated)
- **Account & Storefront Setup:** Register via email and password (with email verification), create a profile with display name and verified WhatsApp number, configure a unique `storefront_slug`, optional storefront image, bio, and hall affiliation.
- **Listing Management:** Create, edit, pause, resume, mark sold out, or soft-delete products. Up to 3 photos per listing (max 2 MB each, optional photos).
- **Availability Management:** Single-tap confirmation ("Yes, Still Available") for listings in `NEEDS_CONFIRMATION` or `EXPIRED`.
- **Multi-Category Sales:** Manage products across diverse categories (e.g. food and personal care) within the same storefront.
- *Restrictions:* Cannot edit another seller's listings or escalate privileges to admin. Cannot publish live listings until approved by an administrator in the pilot.

### 3.3 Administrator (Authenticated, Elevated)
- **Seller Approval:** Review pending seller applications, approve or reject sellers, and suspend abusive accounts.
- **Listing Moderation:** Inspect all listings across any status, remove policy-violating listings with internal audit notes.
- **Report Resolution:** Review buyer moderation reports and resolve or dismiss flags.
- **Operational Reminders:** Generate manual prefilled WhatsApp reminder links to prompt sellers whose listings need confirmation.
- **Configuration:** Manage halls and category expiry defaults.

---

## 4. MVP Scope Boundaries

### In Scope (V1)
- Single campus: University of Ghana (UG), Legon.
- Configurable pilot hall (e.g., Commonwealth Hall) with multi-hall schema support.
- Pilot cohort of ~10 approved sellers.
- Canonical categories: Food & Snacks, Groceries, Clothing & Accessories, Personal Care, Electronics, Services.
- Email & password seller authentication with email verification via Supabase Auth.
- Public anonymous buyer browsing, search, and category/hall filtering.
- Seller digital storefronts at `/store/[storefront_slug]`.
- Multi-photo upload (max 3 images, 2 MB each) to Supabase Storage with client compression.
- Two-phase availability lifecycle (`confirm_before` and `expires_at`).
- Automated background worker function for expiry transitions.
- WhatsApp click-to-chat links with prefilled contextual text.
- Anonymous and authenticated report submissions.
- Admin dashboard for seller approval, report review, and listing takedowns.

### Explicitly Out of Scope (V1)
- Online payments, checkout, escrow, or Mobile Money (MoMo) integration.
- Delivery logistics, dispatch riders, or order tracking.
- WhatsApp Business API automation, group scraping, or automated inbound bots.
- Buyer account creation, shopping carts, or wishlists.
- AI search, recommendation engines, or personalization algorithms.
- Native mobile apps (iOS/Android). PWA capabilities via responsive Next.js web application suffice.

---

## 5. User Journeys

### 5.1 Buyer Discovery Journey
1. **Arrival:** Student opens the site link via WhatsApp group or browser. No registration prompt appears.
2. **Marketplace Discovery:** Student sees live products (`AVAILABLE` and `NEEDS_CONFIRMATION`) across all approved sellers in the active hall.
3. **Filtering & Search:** Filters by "Food & Snacks" or searches "jollof". Results display product photo, price in GHS, title, seller hall, and availability badge.
4. **Product Detail:** Taps a product to open `/listings/[slug]`. Reads description, views swipeable photos, checks disclaimer, and sees the seller's storefront link.
5. **WhatsApp Contact:** Taps "Chat on WhatsApp". Opens the WhatsApp application with prefilled message:
   `"Hello, I found your [Product Title] on Campus Store. Is it still available?"`
6. **Arrangement:** Payment and collection details are arranged directly in WhatsApp.

### 5.2 Seller Onboarding & Storefront Setup
1. **Registration:** Seller navigates to `/seller/register`, enters email, password, display name, and WhatsApp number.
2. **Email Verification:** Supabase Auth sends an email confirmation link. Seller verifies and logs in.
3. **Storefront Creation:** Submits store name, desired `storefront_slug` (e.g., `akua-delights`), hall affiliation, and optional bio/image.
4. **Admin Approval Gate:** Account enters pending state (`is_approved = FALSE`). Admin reviews application and approves seller.
5. **Publishing Products:** Approved seller navigates to `/seller/listings/new`, fills in title, category, price, optional description, uploads up to 3 photos, and taps "Publish".
6. **Live Discovery:** Product immediately enters `AVAILABLE` state and is discoverable on both the marketplace and `/store/akua-delights`.

### 5.3 Two-Phase Availability & Expiry Journey
1. **Initial Publication:** Seller publishes a Food & Snacks item at 12:00 PM. System sets:
   - `confirm_before`: 8:00 AM next day (+20 hours).
   - `expires_at`: 12:00 PM next day (+24 hours).
   - State: `AVAILABLE`.
2. **Warning Trigger:** At 8:00 AM, the scheduled worker runs. Time exceeds `confirm_before`. Status transitions to `NEEDS_CONFIRMATION`. The listing remains visible to buyers with a yellow warning badge: *"Availability needs confirmation"*.
3. **Seller Action:**
   - **Path A (Confirmed):** Seller taps "Still Available" in dashboard. Status returns to `AVAILABLE`. Timestamps reset to +20h / +24h from now.
   - **Path B (Ignored):** At 12:00 PM, time exceeds `expires_at`. Worker transitions listing to `EXPIRED`. Listing is automatically hidden from public discovery.
   - **Path C (Reactivated):** Seller later opens dashboard, taps "Reactivate", and the listing is renewed as `AVAILABLE`.

---

## 6. Functional Requirements

### 6.1 Authentication & Accounts
- **FR-001:** Seller authentication SHALL use email and password with email verification via Supabase Auth.
- **FR-002:** Buyers SHALL access all discovery and storefront pages without signing in or registering.
- **FR-003:** Sellers SHALL link their WhatsApp contact number in E.164 format during profile setup.
- **FR-004:** Each seller SHALL be restricted to exactly one seller profile and one storefront.

### 6.2 Digital Storefronts & Product Management
- **FR-005:** Every approved seller SHALL have a dedicated public storefront at `/store/[storefront_slug]`.
- **FR-006:** `storefront_slug` SHALL be unique, alphanumeric with hyphens, and immutable once published.
- **FR-007:** Sellers SHALL be able to publish multiple products across different categories under one account.
- **FR-008:** Listings SHALL require a title (2–120 characters), category, and price in GHS (or price_negotiable toggle).
- **FR-009:** Photos SHALL be optional. A listing can be published with zero to 3 photos (max 2 MB each).
- **FR-010:** Sellers SHALL be able to edit, pause, resume, mark sold out, or soft-delete their own listings.

### 6.3 Lifecycle, Availability & Expiry
- **FR-011:** Listing lifecycle SHALL use canonical states: `DRAFT`, `AVAILABLE`, `NEEDS_CONFIRMATION`, `SOLD_OUT`, `EXPIRED`, `PAUSED`, `REMOVED`.
- **FR-012:** Public marketplace discovery SHALL display only listings in `AVAILABLE` and `NEEDS_CONFIRMATION` states where `expires_at > now()`.
- **FR-013:** Listings in `SOLD_OUT`, `PAUSED`, `EXPIRED`, `DRAFT`, and `REMOVED` SHALL be hidden from general marketplace discovery.
- **FR-014:** `confirm_before` and `expires_at` SHALL be computed server-side from category defaults on publishing or reconfirming.
- **FR-015:** A scheduled background job SHALL execute two-phase transitions idempotently.

### 6.4 WhatsApp Click-to-Chat Integration
- **FR-016:** Product detail and storefront pages SHALL render a click-to-chat link formatted as `https://wa.me/<E.164>?text=<encoded_message>`.
- **FR-017:** Tapping the WhatsApp button SHALL log a `contact_tapped` event in `listing_events`.
- **FR-018:** The listing detail page SHALL explicitly disclose that communication and payment occur off-platform.

### 6.5 Administration & Moderation
- **FR-019:** Admin dashboard SHALL restrict access to authenticated users with `profiles.is_admin = TRUE`.
- **FR-020:** Admins SHALL be able to approve, reject, or suspend seller accounts.
- **FR-021:** Admins SHALL be able to take down any listing and resolve buyer moderation reports.
- **FR-022:** Admins SHALL be able to launch manual WhatsApp reminder links to prompt unconfirmed sellers.

---

## 7. Non-Functional Requirements

- **Performance:** Largest Contentful Paint (LCP) ≤ 2.5s on mobile 4G. Initial HTML payload server-rendered via Next.js RSC.
- **Data Lightness:** Listing card images served via CDN with WebP conversion, thumbnail dimensions, and client-side compression.
- **Security:** PostgreSQL Row Level Security enabled on all tables. Service role key isolated strictly to server environments.
- **Reliability:** Background expiry job designed to be idempotent and safe against multiple executions or delays.
- **Accessibility:** Semantic HTML, accessible contrast ratios, and aria-labels on interactive WhatsApp triggers.

---

## 8. Acceptance Criteria

1. **Unauthenticated Browsing:** A user can open `/`, execute a search, apply category filters, and open a listing without seeing a login modal.
2. **Seller Onboarding:** A new seller signs up with email/password, confirms email, submits a unique `storefront_slug`, and is placed in pending approval.
3. **Storefront Multi-Product:** An approved seller posts a food item and an electronics item. Both appear under `/store/[storefront_slug]`.
4. **Availability Expiry:** A food listing passes `confirm_before` and displays the warning badge. After `expires_at`, it disappears from public discovery.
5. **Sold-Out Isolation:** When a seller marks a listing `SOLD_OUT`, it immediately vanishes from `/` and category search queries.
6. **WhatsApp Link:** Clicking "Chat on WhatsApp" opens WhatsApp with the seller's correct phone number and prefilled product title.

---

*PRD v2.0 approved and finalized.*
