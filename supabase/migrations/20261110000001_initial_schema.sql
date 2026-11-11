-- Self-healing drop block to ensure clean execution if re-run
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.listing_events CASCADE;
DROP TABLE IF EXISTS public.listing_images CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.seller_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.halls CASCADE;
DROP TABLE IF EXISTS public.universities CASCADE;

DROP TYPE IF EXISTS public.listing_availability_status CASCADE;
DROP TYPE IF EXISTS public.report_reason CASCADE;
DROP TYPE IF EXISTS public.report_status CASCADE;

-- ==============================================================================
-- Migration: 20261110000001_initial_schema.sql
-- Campus Store: Core Relational Schema and Canonical Enums
-- ==============================================================================

-- 1. Canonical Listing Availability Lifecycle Enum
CREATE TYPE listing_availability_status AS ENUM (
  'DRAFT',
  'AVAILABLE',
  'NEEDS_CONFIRMATION',
  'SOLD_OUT',
  'EXPIRED',
  'PAUSED',
  'REMOVED'
);

-- 2. Moderation Enums
CREATE TYPE report_reason AS ENUM (
  'spam',
  'misleading',
  'inappropriate',
  'already_sold',
  'wrong_price',
  'prohibited_item',
  'other'
);

CREATE TYPE report_status AS ENUM (
  'pending',
  'reviewed',
  'dismissed',
  'actioned'
);

-- 3. Universities Table
CREATE TABLE public.universities (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  city        TEXT        NOT NULL,
  country     CHAR(2)     NOT NULL DEFAULT 'GH',
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Halls Table
CREATE TABLE public.halls (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id  UUID        NOT NULL REFERENCES public.universities(id) ON DELETE RESTRICT,
  name           TEXT        NOT NULL,
  slug           TEXT        NOT NULL,
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT halls_university_slug_unique UNIQUE (university_id, slug)
);

CREATE INDEX idx_halls_university_id ON public.halls(university_id);

-- 5. Profiles Table (1:1 with auth.users)
CREATE TABLE public.profiles (
  id               UUID        NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name     TEXT        NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 60),
  whatsapp_number  TEXT        NOT NULL CHECK (whatsapp_number ~ '^\+[1-9]\d{7,14}$'),
  avatar_url       TEXT        NULL,
  bio              TEXT        NULL CHECK (char_length(bio) <= 300),
  is_admin         BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_whatsapp_number ON public.profiles(whatsapp_number);

-- 6. Seller Profiles Table (Digital Storefront)
CREATE TABLE public.seller_profiles (
  id                   UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  hall_id              UUID        NOT NULL REFERENCES public.halls(id) ON DELETE RESTRICT,
  store_name           TEXT        NOT NULL CHECK (char_length(store_name) BETWEEN 2 AND 60),
  storefront_slug      TEXT        NOT NULL UNIQUE CHECK (storefront_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(storefront_slug) BETWEEN 2 AND 60),
  storefront_image_url TEXT        NULL,
  store_description    TEXT        NULL CHECK (char_length(store_description) <= 500),
  is_approved          BOOLEAN     NOT NULL DEFAULT FALSE,
  approved_at          TIMESTAMPTZ NULL,
  approved_by          UUID        NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT seller_profiles_hall_store_name_unique UNIQUE (hall_id, store_name)
);

CREATE INDEX idx_seller_profiles_user_id ON public.seller_profiles(user_id);
CREATE INDEX idx_seller_profiles_hall_id ON public.seller_profiles(hall_id);
CREATE INDEX idx_seller_profiles_slug    ON public.seller_profiles(storefront_slug);

-- 7. Categories Table
CREATE TABLE public.categories (
  id                          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name                        TEXT        NOT NULL,
  slug                        TEXT        NOT NULL UNIQUE,
  icon                        TEXT        NULL,
  sort_order                  SMALLINT    NOT NULL DEFAULT 0,
  default_expiry_hours        INTEGER     NULL CHECK (default_expiry_hours > 0),
  default_confirm_lead_hours  INTEGER     NULL CHECK (default_confirm_lead_hours >= 0),
  is_active                   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT categories_lead_time_less_than_expiry
    CHECK (default_confirm_lead_hours IS NULL OR default_expiry_hours IS NULL OR default_confirm_lead_hours < default_expiry_hours)
);

CREATE INDEX idx_categories_sort_order ON public.categories(sort_order);

-- 8. Listings Table (Two-Phase Expiry & Canonical Lifecycle)
CREATE TABLE public.listings (
  id                   UUID                        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id            UUID                        NOT NULL REFERENCES public.seller_profiles(id) ON DELETE RESTRICT,
  category_id          UUID                        NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  slug                 TEXT                        NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) BETWEEN 2 AND 140),
  title                TEXT                        NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  description          TEXT                        NULL CHECK (char_length(description) <= 500),
  price                NUMERIC(12,2)               NULL CHECK (price IS NULL OR price >= 0),
  price_negotiable     BOOLEAN                     NOT NULL DEFAULT FALSE,
  currency             CHAR(3)                     NOT NULL DEFAULT 'GHS',
  availability_status  listing_availability_status NOT NULL DEFAULT 'DRAFT',
  confirm_before       TIMESTAMPTZ                 NULL,
  expires_at           TIMESTAMPTZ                 NULL,
  expired_notified_at  TIMESTAMPTZ                 NULL,
  deleted_at           TIMESTAMPTZ                 NULL,
  search_vector        TSVECTOR                    NULL,
  created_at           TIMESTAMPTZ                 NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ                 NOT NULL DEFAULT now(),

  CHECK (price IS NOT NULL OR price_negotiable = TRUE),
  CHECK (confirm_before IS NULL OR expires_at IS NULL OR confirm_before <= expires_at)
);

CREATE INDEX idx_listings_seller_id            ON public.listings(seller_id);
CREATE INDEX idx_listings_category_id          ON public.listings(category_id);
CREATE INDEX idx_listings_availability_status  ON public.listings(availability_status);
CREATE INDEX idx_listings_slug                 ON public.listings(slug);
CREATE INDEX idx_listings_expires_at           ON public.listings(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_listings_confirm_before       ON public.listings(confirm_before) WHERE confirm_before IS NOT NULL;
CREATE INDEX idx_listings_search_vector        ON public.listings USING GIN(search_vector);

CREATE INDEX idx_listings_marketplace_discovery
  ON public.listings(category_id, availability_status, created_at DESC)
  WHERE deleted_at IS NULL AND availability_status IN ('AVAILABLE', 'NEEDS_CONFIRMATION');

-- 9. Listing Images Table (Max 3 Photos)
CREATE TABLE public.listing_images (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id     UUID        NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  storage_path   TEXT        NOT NULL,
  display_order  SMALLINT    NOT NULL DEFAULT 0 CHECK (display_order BETWEEN 0 AND 2),
  is_primary     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_images_listing_id ON public.listing_images(listing_id);
CREATE UNIQUE INDEX idx_listing_images_primary
  ON public.listing_images(listing_id)
  WHERE is_primary = TRUE;

-- 10. Listing Events Table (Immutable Audit Log)
CREATE TABLE public.listing_events (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id  UUID        NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  actor_id    UUID        NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type  TEXT        NOT NULL CHECK (event_type IN (
                'created',
                'published',
                'updated',
                'needs_confirmation_triggered',
                'availability_confirmed',
                'sold_out',
                'paused',
                'resumed',
                'expired',
                'reactivated',
                'removed',
                'contact_tapped',
                'reported'
              )),
  payload     JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_events_listing_id  ON public.listing_events(listing_id);
CREATE INDEX idx_listing_events_event_type  ON public.listing_events(event_type);
CREATE INDEX idx_listing_events_created_at  ON public.listing_events(created_at DESC);

-- 11. Reports Table (Moderation)
CREATE TABLE public.reports (
  id           UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id   UUID          NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reporter_id  UUID          NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason       report_reason NOT NULL,
  details      TEXT          NULL CHECK (char_length(details) <= 500),
  status       report_status NOT NULL DEFAULT 'pending',
  reviewed_by  UUID          NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ   NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_listing_id ON public.reports(listing_id);
CREATE INDEX idx_reports_status     ON public.reports(status) WHERE status = 'pending';

