# Campus Store — Documentation Index & Architecture Specification

> **Platform:** Campus Product Discovery Network (University of Ghana, Legon pilot)  
> **Status:** Architecture Specification v2.0 (Pre-Implementation Phase)  
> **Repository:** `c:\Users\pc\Desktop\Campus Store`  
> **Stack:** Next.js (App Router) · TypeScript (strict) · Tailwind CSS · Supabase (PostgreSQL, Auth, Storage, RLS) · Vercel

---

## 1. Documentation Index

The specification is structured across the following verified documents in `docs/`:

| Document | Purpose | Target Audience |
|---|---|---|
| [PRD.md](./PRD.md) | Product Requirements Document — vision, user roles, journeys, functional/non-functional requirements, acceptance criteria | Founders, Product Managers, Engineers |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture — modular monolith, module responsibilities, sequence diagrams, caching, ADRs | Software Architects, Backend Engineers |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Relational schema — full SQL DDL, canonical enums, RLS policies, two-phase expiry triggers, ER diagram, seed data | Database Engineers, Architects |
| [SECURITY.md](./SECURITY.md) | Defense-in-depth model — auth/authz split, complete SQL RLS policies, storage policies, input validation, pre-flight checklist | Security Engineers, Developers |
| [USER_FLOWS.md](./USER_FLOWS.md) | User interaction flows — buyer discovery, multi-category seller management, admin moderation, state transition matrix, edge cases | UX Designers, Frontend Engineers |
| [API_DESIGN.md](./API_DESIGN.md) | API specification — Next.js Server Actions, route handlers, Zod schemas, WhatsApp link constructor, directory structure | Full-Stack Engineers |
| [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) | Delivery plan — M0 to M6 milestone sequence, pilot measurement framework, testing standards | Tech Leads, Project Managers |
| [ASSUMPTIONS_AND_OPEN_QUESTIONS.md](./ASSUMPTIONS_AND_OPEN_QUESTIONS.md) | Project assumptions, open founder questions (OD-01 to OD-07), decision log, technical risk register | Founders, Stakeholders |
| [SELLER_ONBOARDING_GUIDE.md](./SELLER_ONBOARDING_GUIDE.md) | Friendly, student-facing seller guide for setting up digital storefronts at UG Legon | Pilot Sellers, Campus Community |
| [NEXT_UPDATES.md](./NEXT_UPDATES.md) | Upcoming growth features & roadmap — Status flyer generator, pre-order builder, pickup spots, QR codes | Founders, Engineers, Growth Leads |
| [CHANGELOG.md](./CHANGELOG.md) | Comprehensive audit log of all critical findings resolved, renamed fields, and cross-document verification evidence | Audit Reviewers, Founders |

---

## 2. Quick Reference & Core Architecture Decisions

### 2.1 Core Product Model
- **Marketplace Aggregate:** The homepage aggregates active products across all approved sellers in the active hall. Buyers discover individual products directly without needing to know sellers in advance.
- **Dedicated Digital Storefronts:** Each seller has one account, one verified profile, and one public storefront at `/store/[storefront_slug]`.
- **Multi-Category Sales:** A single seller publishes independent listings across food, clothing, personal care, electronics, groceries, and services under one storefront.
- **Frictionless Anonymous Browsing:** Buyers never register or sign in.
- **Direct WhatsApp Conversion:** Direct click-to-chat links (`wa.me`) connect buyers to sellers with pre-filled context.

### 2.2 Canonical Authentication Standard (C-01)
- **Seller & Admin:** Email and password with email verification via **Supabase Auth**.
- **Buyer:** 100% unauthenticated.
- **Exclusions:** Phone OTP, SMS authentication, and passwordless magic links are omitted from the MVP.

### 2.3 Canonical Listing Lifecycle (C-02, C-03, C-04)
Every listing belongs to exactly one canonical status:

```
┌───────┐      publish      ┌───────────┐   confirm_before    ┌────────────────────┐
│ DRAFT ├──────────────────►│ AVAILABLE ├────────────────────►│ NEEDS_CONFIRMATION │
└───────┘                   └─────┬─────┘                     └─────────┬──────────┘
                                  │                                     │
                             pause│▲resume                     reconfirm│▲ grace expires
                                  ▼│                                    │▼
                            ┌───────────┐         restock     ┌────────────────────┐
                            │  PAUSED   │◄────────────────────┤      EXPIRED       │
                            └─────┬─────┘                     └─────────┬──────────┘
                                  │ mark sold                           │
                                  ▼                                     │
                            ┌───────────┐                               │
                            │ SOLD_OUT  ├───────────────────────────────┘
                            └───────────┘           relist / reactivate
```

- **Publicly Visible:** `AVAILABLE` (normal) and `NEEDS_CONFIRMATION` (with warning badge).
- **Hidden from General Discovery:** `SOLD_OUT`, `EXPIRED`, `PAUSED`, `DRAFT`, `REMOVED`.
- **Single Source of Truth:** `availability_status` is the sole lifecycle field. `is_active` has been completely removed from the listings table.

### 2.4 Two-Phase Expiry Mechanism (C-13)
- Listings track both `confirm_before TIMESTAMPTZ` and `expires_at TIMESTAMPTZ`.
- Configured by category defaults (e.g. Food: 24h duration with 4h confirmation lead time -> trigger at 20h).
- Automated scheduled function `process_listing_expiry_transitions()` transitions listings idempotently.
- Public discovery query filters explicitly check `(expires_at IS NULL OR expires_at > now())` to prevent display leakage even if the cron job is momentarily delayed.

### 2.5 Ownership & Database Integrity (C-10, C-15/16)
- `seller_profiles.user_id` is a `UNIQUE` foreign key referencing `auth.users(id)`.
- RLS policies directly verify ownership via `sp.user_id = auth.uid()`.
- `storefront_slug TEXT NOT NULL UNIQUE` and `storefront_image_url TEXT NULL` are first-class columns on `seller_profiles`.

---

## 3. Milestone Overview (M0–M6)

1. **M0 — Product Validation:** Manual pilot with 3–5 campus sellers in Commonwealth Hall.
2. **M1 — Application Foundation:** Scaffold Next.js App Router, Tailwind, Supabase connection, CI pipeline.
3. **M2 — Database & Auth:** Relational migrations, RLS policies, Supabase email/password auth, seed data.
4. **M3 — Public Discovery:** Marketplace homepage, search, filters, `/listings/[slug]`, `/store/[storefront_slug]`, WhatsApp links.
5. **M4 — Seller Dashboard:** Storefront onboarding, multi-category listing creator (max 3 photos), availability controls.
6. **M5 — Administration & Lifecycle:** Two-phase expiry cron worker, admin approval gate, report review.
7. **M6 — Campus Pilot Launch:** Onboard ~10 sellers from Commonwealth Hall, evaluate against pilot metrics.

---

*Specification v2.0 complete and implementation-ready.*
