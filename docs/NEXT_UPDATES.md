# Campus Store — Next Feature Updates & Growth Roadmap

This document outlines upcoming product enhancements and feature specifications for future iterations of **Campus Store** at the University of Ghana (UG), Legon, with an initial focus on the **Jean Nelson AKA Hall** pilot.

All proposed features strictly follow our core product principles:
- **Discovery-First**: No complex checkout, payment gateway, or heavy delivery logistics in core releases.
- **WhatsApp-Native**: Leverage existing student habits on WhatsApp Status, group chats, and direct messages.
- **Zero Friction**: Keep seller maintenance effort minimal.

---

## 1. WhatsApp Status Flyer Generator (Viral Growth)

### 1.1 Overview
In University of Ghana halls, student sellers rely heavily on posting multiple photos to their personal WhatsApp Status daily. This feature provides a 1-tap **"Create Status Flyer"** tool that formats any listing or entire storefront into a branded 9:16 vertical graphic ready for WhatsApp Status.

### 1.2 User Flow
1. Seller views their listing or storefront dashboard.
2. Taps **"Share as Status Flyer"**.
3. A client-side canvas renders a vertical graphic containing:
   - High-resolution product photo
   - Product title and price in GH₵
   - Availability pill (*"Freshly Made"* / *"In Stock Today"*)
   - Hall badge (*"Jean Nelson AKA Hall, UG Legon"*)
   - Scannable QR code and clean short URL (`campusstore.ug/store/[slug]`)
4. Seller taps **"Post to WhatsApp Status"** (using the Web Share API on mobile to attach the generated PNG) or **"Download Flyer"**.

### 1.3 Technical Design
- **Client-Side Rendering**: Use HTML5 Canvas or SVG-to-Blob rendering (zero server rendering load).
- **Web Share API**: Pass the rendered image blob directly to `navigator.share({ files: [blob] })` so mobile devices open WhatsApp Status directly.
- **No Extra Dependencies**: Lightweight inline Canvas drawing utility.

---

## 2. Structured WhatsApp Multi-Item Pre-Order Builder

### 2.1 Overview
When buyers browse a seller's storefront (e.g. *Ama's Kitchen*), they often want more than one item (e.g. *1x Jollof Rice* + *1x Grilled Chicken* + *1x Zobo Drink*). Currently, they must message each item individually.

### 2.2 User Flow
1. On `/store/[storefront_slug]`, each product card has an optional **"+ Add to enquiry"** button.
2. A lightweight floating bar appears at the bottom:
   - *"2 items selected &middot; GH₵45.00"*
   - Button: **"Message Order on WhatsApp"**
3. Tapping the button opens WhatsApp with a preformatted, copy-paste-ready message:
   ```text
   Hello Ama's Kitchen! I found your storefront on Campus Store.

   I would like to order:
   • 1x Hot Jollof Rice with Grilled Chicken (GH₵35.00)
   • 1x Chilled Zobo Drink (GH₵10.00)

   Total: GH₵45.00
   Delivery / Pickup: Jean Nelson AKA Hall
   Is this available right now?
   ```
4. Seller receives a clear order summary without needing to calculate prices manually.

### 2.3 Technical Design
- **State Management**: Lightweight client-side React state or local session storage for the active basket.
- **No Cart / Checkout**: Does NOT process payments; acts strictly as an enquiry formatter for WhatsApp.

---

## 3. Hostel Pickup Spots & "Active Now" Real-time Status

### 3.1 Overview
Food, snacks, and room services are highly time-sensitive. Students need to know:
1. Is the seller currently cooking/available right now?
2. Where in Jean Nelson AKA Hall can the item be collected?

### 3.2 Feature Specification
- **1-Tap Active Toggle (Seller Dashboard)**:
  - `OPEN_NOW`: *"Cooking & Available (until 10:30 PM)"*
  - `PRE_ORDER`: *"Next batch ready at 1:00 PM"*
  - `CLOSED`: *"Closed for today &middot; Back tomorrow"*
- **Preset Campus Pickup Spots**:
  - Sellers select their preferred handoff locations from a preset list:
    - *Jean Nelson Porter's Lodge*
    - *Jean Nelson Block A / B / C / D Common Room*
    - *Jean Nelson Bush Canteen Walkway*
    - *Balme Library Delivery Drop-off*
  - Displayed as a clean location badge on cards and listing detail pages.

### 3.3 Database Additions
```sql
ALTER TABLE seller_profiles
  ADD COLUMN is_open BOOLEAN DEFAULT TRUE,
  ADD COLUMN operating_hours_note TEXT,
  ADD COLUMN primary_pickup_spot TEXT;
```

---

## 4. Printable Door & Bulletin Board QR Code Generator

### 4.1 Overview
Many student sellers operate directly from their hostel rooms. Many put up handwritten paper signs on their hostel doors or hall notice boards.

### 4.2 User Flow
1. Seller visits `/seller/profile`.
2. Taps **"Print Door Flyer"**.
3. A clean A4 / A5 printable layout is displayed in the browser:
   - Store Name: *e.g. Ama's Kitchen*
   - *"Scan to see today's available meals & prices"*
   - Large, crisp QR code linking to `/store/[storefront_slug]`
   - Room / Hall indicator: *Room 214, Block C, Jean Nelson AKA Hall*
4. Seller prints or saves as PDF to post on their door or notice board.

---

## 5. University Email Verification Badge (`@st.ug.edu.gh`)

### 5.1 Overview
To combat scams and build buyer confidence across university halls, student sellers who sign up or verify their official University of Ghana student email (`@st.ug.edu.gh`) receive a special badge.

### 5.2 Trust Badges
- **UG Student Verified**: Seller verified their `@st.ug.edu.gh` address.
- **Hall Resident Verified**: Seller is verified by the campus hall coordinator.

---

## Implementation Priority Matrix

| Phase | Feature | Effort | Expected Impact |
| :--- | :--- | :--- | :--- |
| **Phase 2.1** | **Structured WhatsApp Order Builder** | Low | High buyer satisfaction & faster orders |
| **Phase 2.2** | **Hostel Pickup Spots & "Active Now" Toggle** | Low | Essential for food sellers & reduces wasted messages |
| **Phase 2.3** | **WhatsApp Status Flyer Generator** | Medium | Viral organic seller acquisition |
| **Phase 2.4** | **Printable Door QR Code** | Low | Offline hall foot traffic conversion |
| **Phase 2.5** | **UG Student Email Badge** | Low | Trust & safety reinforcement |

