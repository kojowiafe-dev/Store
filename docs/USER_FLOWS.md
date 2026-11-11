# User Flows & Interaction Specification — Campus Store

> **Platform:** Campus Product Discovery Network (University of Ghana, Legon pilot)  
> **Version:** 2.0 — Canonical Lifecycle, Standardized Storefront Flows & Edge Cases  
> **Target:** Mobile-First Responsive Web Application

---

## Table of Contents

1. [Actor Definitions](#1-actor-definitions)
2. [Flow Diagram Notation](#2-flow-diagram-notation)
3. [Buyer User Flows](#3-buyer-user-flows)
   - 3.1 [Marketplace Discovery (Primary Path)](#31-marketplace-discovery-primary-path)
   - 3.2 [Search & Category/Hall Filtering](#32-search--categoryhall-filtering)
   - 3.3 [Product Detail & WhatsApp Contact](#33-product-detail--whatsapp-contact)
   - 3.4 [Seller Digital Storefront Discovery](#34-seller-digital-storefront-discovery)
   - 3.5 [Anonymous Content Reporting](#35-anonymous-content-reporting)
4. [Seller User Flows](#4-seller-user-flows)
   - 4.1 [Registration & Email Verification](#41-registration--email-verification)
   - 4.2 [Storefront Onboarding (Pending Approval Gate)](#42-storefront-onboarding-pending-approval-gate)
   - 4.3 [Publishing Products Across Diverse Categories](#43-publishing-products-across-diverse-categories)
   - 4.4 [Editing & Managing Listings](#44-editing--managing-listings)
   - 4.5 [Two-Phase Availability Confirmation & Reactivation](#45-two-phase-availability-confirmation--reactivation)
   - 4.6 [Pausing, Resuming & Marking Sold Out](#46-pausing-resuming--marking-sold-out)
5. [Administrator User Flows](#5-administrator-user-flows)
   - 5.1 [Seller Application Review](#51-seller-application-review)
   - 5.2 [Listing Moderation & Takedowns](#52-listing-moderation--takedowns)
   - 5.3 [Buyer Report Resolution](#53-buyer-report-resolution)
   - 5.4 [Manual WhatsApp Seller Reminders](#54-manual-whatsapp-seller-reminders)
6. [Canonical State Transition Matrix & Edge Cases](#6-canonical-state-transition-matrix--edge-cases)
7. [Empty, Error & Boundary States](#7-empty-error--boundary-states)

---

## 1. Actor Definitions

| Actor | Auth State | Role in Ecosystem |
|---|---|---|
| **Buyer** | Unauthenticated | Discovers products across halls, views storefronts, and contacts sellers via WhatsApp. Never logs in. |
| **Seller** | Authenticated (Email/Password) | Operates a verified storefront, publishes multi-category products, and confirms stock availability. |
| **Admin** | Elevated (`is_admin = TRUE`) | Approves sellers, moderates listings, handles reports, and sends manual operational reminders. |

---

## 2. Flow Diagram Notation

- `([Start/End Terminal])`
- `[Page, Screen or Automated Job]`
- `[/User Form Input/]`
- `{Decision Branch}`
- `-->` Navigation / Data flow

---

## 3. Buyer User Flows

### 3.1 Marketplace Discovery (Primary Path)

Buyers explore products across all campus sellers immediately upon arrival.

```mermaid
flowchart TD
    A([Buyer Opens Campus Store /]) --> B[Marketplace Homepage]
    B --> C[Active Hall Banner\n'University of Ghana · Commonwealth Hall']
    B --> D[Live Product Grid\nAggregates all AVAILABLE & NEEDS_CONFIRMATION listings]
    D --> E{Item Status?}
    E -->|AVAILABLE| F[Card displays Image, Title, Price in GHS, Hall, Seller Store]
    E -->|NEEDS_CONFIRMATION| G[Card displays 'Confirm Availability' Yellow Warning Badge]
    F --> H[Taps Product Card]
    G --> H
    H --> I[Navigates to /listings/:slug]
```

---

### 3.2 Search & Category/Hall Filtering

```mermaid
flowchart LR
    A[Marketplace Homepage] --> B[/Enter Keyword in Search Bar e.g. 'Jollof'/]
    A --> C[Tap Category Filter Chip e.g. 'Food & Snacks']
    B --> D[Debounced Full-Text Search Query]
    C --> D
    D --> E{Results Found?}
    E -->|Yes| F[Filtered Product Grid]
    E -->|No| G[Helpful Empty State:\n'No matching items in this hall. Try another category.']
    F --> H[Select Product Card]
```

---

### 3.3 Product Detail & WhatsApp Contact

```mermaid
flowchart TD
    A([Navigates to /listings/:slug]) --> B[Listing Detail Page]
    B --> C[Swipeable Image Carousel\nUp to 3 Photos]
    B --> D[Product Title, Price in GHS, Category, Description]
    B --> E[Seller Storefront Card\nStore Name, Hall, Storefront Link]
    B --> F[Off-Platform Transaction Disclaimer]
    B --> G[Chat on WhatsApp CTA Button]
    G --> H[recordContactTap Server Action logs contact_tapped event]
    H --> I[Deep-link opens WhatsApp:\nwa.me/233XXXXXXXXX?text=Hello...]
    I --> J([Buyer & Seller converse in WhatsApp])
```

---

### 3.4 Seller Digital Storefront Discovery

Buyers can view a specific seller's entire product line under their unique URL:

```mermaid
flowchart LR
    A[From Listing Detail or Direct Shared Link] --> B[GET /store/:storefront_slug]
    B --> C[Storefront Header: Store Name, Hall, Bio, Image]
    C --> D[WhatsApp Direct Store Contact Button]
    C --> E[Category Filter Tabs within Store]
    E --> F[Seller's Eligible Products Grid]
    F --> G[Select Product -> /listings/:slug]
```

---

### 3.5 Anonymous Content Reporting

```mermaid
flowchart TD
    A[Listing Detail Page] --> B[Tap 'Report Listing' Flag Icon]
    B --> C[Modal: Anonymous Report Form]
    C --> D[/Select Reason: spam, misleading, inappropriate, sold, wrong_price, other/]
    C --> E[/Optional Details textarea: max 500 chars/]
    C --> F[Submit Report]
    F --> G[POST to reports table with status = 'pending']
    G --> H[Confirmation Toast: 'Thank you. Our moderators will review this listing.']
```

---

## 4. Seller User Flows

### 4.1 Registration & Email Verification

```mermaid
flowchart TD
    A([Navigate to /seller/register]) --> B[/Enter Email, Password, Display Name, WhatsApp Number/]
    B --> C[Submit Form]
    C --> D[Supabase Auth creates auth.users record]
    D --> E[Email Verification Sent]
    E --> F[Seller clicks verification link in inbox]
    F --> G[Navigates to /seller/login]
    G --> H[Session cookie established via @supabase/ssr]
    H --> I[Redirect to /seller/onboarding]
```

---

### 4.2 Storefront Onboarding (Pending Approval Gate)

```mermaid
flowchart TD
    A([/seller/onboarding]) --> B[/Store Name, Desired storefront_slug, Hall, Bio, Storefront Image/]
    B --> C{slug available?}
    C -->|No| D[Inline error: 'Slug already in use. Please choose another.']
    C -->|Yes| E[Create seller_profiles record with is_approved = FALSE]
    E --> F[Screen: 'Application Submitted! Pending Admin Review']
    F --> G[Admin reviews seller in Admin Dashboard]
    G -->|Approved| H[seller_profiles.is_approved = TRUE]
    H --> I[Seller Dashboard unlocked at /seller/dashboard]
```

---

### 4.3 Publishing Products Across Diverse Categories

A single seller account publishes multiple listings in different categories:

```mermaid
flowchart TD
    A([Seller Dashboard -> 'Add Product']) --> B[/Select Category: Food, Clothing, Electronics, Groceries, Services/]
    B --> C[/Title: 2-120 chars/]
    B --> D[/Price in GHS or toggle 'Negotiable'/]
    B --> E[/Description: optional, max 500 chars/]
    B --> F[/Upload 0 to 3 Photos: client compresses to < 500KB/]
    F --> G{Save Draft or Publish?}
    G -->|Save Draft| H[availability_status = 'DRAFT'\nconfirm_before = NULL, expires_at = NULL]
    G -->|Publish| I[availability_status = 'AVAILABLE'\nCalculates confirm_before & expires_at based on category]
    I --> J[Listing immediately live on marketplace & /store/:storefront_slug]
```

---

### 4.4 Editing & Managing Listings

```mermaid
flowchart LR
    A[Dashboard Listing Card] --> B{Select Action}
    B -->|Edit| C[Edit Form: update title, price, photos -> Save]
    B -->|Pause| D[availability_status = 'PAUSED' -> Hidden from public]
    B -->|Resume| E[availability_status = 'AVAILABLE' -> Timestamps reset fresh]
    B -->|Mark Sold Out| F[availability_status = 'SOLD_OUT' -> Hidden from marketplace]
    B -->|Delete| G[Sets deleted_at = now(), availability_status = 'REMOVED']
```

---

### 4.5 Two-Phase Availability Confirmation & Reactivation

```mermaid
flowchart TD
    A[Listing in AVAILABLE State] -->|confirm_before passes| B[Cron transitions status to NEEDS_CONFIRMATION]
    B --> C[Seller Dashboard highlights listing with 'Confirm Availability' banner]
    C --> D{Seller Action}
    D -->|Taps 'Yes, Still Available'| E[Status returns to AVAILABLE\nconfirm_before & expires_at recalculated fresh]
    D -->|Ignores until expires_at passes| F[Cron transitions status to EXPIRED\nListing hidden from discovery]
    F --> G[Seller opens Expired Tab -> Taps 'Reactivate']
    G --> E
```

---

## 5. Administrator User Flows

### 5.1 Seller Application Review

```mermaid
flowchart LR
    A[Admin Dashboard] --> B[Pending Sellers Tab]
    B --> C[Inspect Store Name, WhatsApp Number, Hall, Bio]
    C --> D{Decision}
    D -->|Approve| E[Update seller_profiles.is_approved = TRUE\nSeller listings become eligible for discovery]
    D -->|Reject| F[Record rejection note; seller informed]
```

---

### 5.2 Listing Moderation & Takedowns

```mermaid
flowchart LR
    A[Admin Listings View] --> B[Inspect Any Listing across all statuses]
    B --> C[Takedown / Deactivate Action]
    C --> D[Sets availability_status = 'REMOVED', deleted_at = now()]
    D --> E[Appends 'removed' entry in listing_events with reason]
```

---

### 5.3 Buyer Report Resolution

```mermaid
flowchart TD
    A[Admin Reports Queue] --> B[View Pending Report + Reported Listing]
    B --> C{Action}
    C -->|Dismiss| D[Update reports.status = 'dismissed']
    C -->|Remove Listing| E[Update reports.status = 'actioned'\nRemove listing from public visibility]
    C -->|Suspend Seller| F[Set seller_profiles.is_approved = FALSE]
```

---

### 5.4 Manual WhatsApp Seller Reminders

When listings linger in `NEEDS_CONFIRMATION`, an admin can initiate a prefilled WhatsApp check-in:

```
https://wa.me/233XXXXXXXXX?text=Hi%20[Seller],%20is%20your%20listing%20'[Title]'%20still%20available%20on%20Campus%20Store?
```

---

## 6. Canonical State Transition Matrix & Edge Cases

| Scenario | Prior State | Action / Trigger | Resulting State | Timestamp Impact |
|---|---|---|---|---|
| **Seller confirms in time** | `NEEDS_CONFIRMATION` | Seller taps "Still Available" | `AVAILABLE` | Both `confirm_before` and `expires_at` recalculated fresh from `now()`. |
| **Confirmation window expires** | `NEEDS_CONFIRMATION` | Scheduled cron worker | `EXPIRED` | Hidden from public discovery. Timestamps unchanged. |
| **Seller pauses live item** | `AVAILABLE` | Seller toggles "Pause" | `PAUSED` | Hidden from public. Timestamps cleared. |
| **Seller resumes paused item** | `PAUSED` | Seller toggles "Resume" | `AVAILABLE` | Timestamps calculated fresh from `now()`. |
| **Seller marks sold out** | `AVAILABLE` or `NEEDS_CONFIRMATION` | Seller marks "Sold Out" | `SOLD_OUT` | Timestamps cleared. Excluded from general discovery. |
| **Seller restocks sold item** | `SOLD_OUT` | Seller marks "Back in Stock" | `AVAILABLE` | Timestamps calculated fresh from `now()`. |
| **Seller edits price/text** | `AVAILABLE` | Seller edits title or price | `AVAILABLE` | Timestamps are NOT prolonged (prevents expiry avoidance). |
| **Seller edits in confirmation** | `NEEDS_CONFIRMATION` | Seller edits details without confirming | `NEEDS_CONFIRMATION` | State remains until explicitly reconfirmed. |
| **Cron runs late / delay** | `AVAILABLE` or `NEEDS_CONFIRMATION` | Database query execution | Evaluated live | Public query filter `expires_at > now()` prevents expired items from displaying even before cron runs. |

---

## 7. Empty, Error & Boundary States

1. **No Active Listings in Hall:**
   - Display: *"Nothing on sale in this hall right now. Are you selling something? Tap Become a Seller to list in 3 minutes!"*
2. **Search With Zero Matches:**
   - Display: *"No products match '[query]'. Try a different search term or check all categories."*
3. **Storefront Has No Current Items:**
   - Display: *"[Store Name] currently has no active items. Check back later or message them directly on WhatsApp."*
4. **Seller Awaiting Approval:**
   - Display: *"Your storefront is under review by campus administrators. You can create drafts now; they will go live once your account is approved."*
5. **Listing Link Expired / Removed:**
   - Display: *"This listing is no longer available on Campus Store. Browse active listings in your hall."* With button to `/`.

---

*User flows specification verified and complete.*
