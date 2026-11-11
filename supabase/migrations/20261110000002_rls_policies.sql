-- ==============================================================================
-- Migration: 20261110000002_rls_policies.sql
-- Campus Store: Comprehensive Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS on all 9 tables
ALTER TABLE public.universities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halls           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports         ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. universities & halls & categories
-- ------------------------------------------------------------------------------
CREATE POLICY "universities_public_read" ON public.universities FOR SELECT TO anon, authenticated USING (is_active = TRUE);
CREATE POLICY "universities_admin_all"   ON public.universities FOR ALL    TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "halls_public_read" ON public.halls FOR SELECT TO anon, authenticated USING (is_active = TRUE);
CREATE POLICY "halls_admin_all"   ON public.halls FOR ALL    TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "categories_public_read" ON public.categories FOR SELECT TO anon, authenticated USING (is_active = TRUE);
CREATE POLICY "categories_admin_all"   ON public.categories FOR ALL    TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ------------------------------------------------------------------------------
-- 2. profiles
-- ------------------------------------------------------------------------------
CREATE POLICY "profiles_public_read_approved_sellers"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles sp
      WHERE sp.user_id = profiles.id AND sp.is_approved = TRUE
    )
  );

CREATE POLICY "profiles_owner_read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_owner_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND is_admin = FALSE);

CREATE POLICY "profiles_owner_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_admin = (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- ------------------------------------------------------------------------------
-- 3. seller_profiles
-- ------------------------------------------------------------------------------
CREATE POLICY "seller_profiles_public_read_approved"
  ON public.seller_profiles FOR SELECT
  TO anon, authenticated
  USING (is_approved = TRUE);

CREATE POLICY "seller_profiles_owner_read"
  ON public.seller_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "seller_profiles_owner_insert"
  ON public.seller_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_approved = FALSE);

CREATE POLICY "seller_profiles_owner_update"
  ON public.seller_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_approved = (SELECT sp.is_approved FROM public.seller_profiles sp WHERE sp.id = seller_profiles.id)
  );

CREATE POLICY "seller_profiles_admin_all"
  ON public.seller_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- ------------------------------------------------------------------------------
-- 4. listings
-- ------------------------------------------------------------------------------
CREATE POLICY "listings_public_read"
  ON public.listings FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND availability_status IN ('AVAILABLE', 'NEEDS_CONFIRMATION')
    AND (expires_at IS NULL OR expires_at > now())
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles sp
      WHERE sp.id = listings.seller_id AND sp.is_approved = TRUE
    )
  );

CREATE POLICY "listings_seller_read_own"
  ON public.listings FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles sp
      WHERE sp.id = listings.seller_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "listings_seller_insert_own"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles sp
      WHERE sp.id = listings.seller_id
        AND sp.user_id = auth.uid()
        AND sp.is_approved = TRUE
    )
  );

CREATE POLICY "listings_seller_update_own"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles sp
      WHERE sp.id = listings.seller_id AND sp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles sp
      WHERE sp.id = listings.seller_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "listings_admin_all"
  ON public.listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- ------------------------------------------------------------------------------
-- 5. listing_images
-- ------------------------------------------------------------------------------
CREATE POLICY "listing_images_public_read"
  ON public.listing_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.seller_profiles sp ON sp.id = l.seller_id
      WHERE l.id = listing_images.listing_id
        AND l.deleted_at IS NULL
        AND l.availability_status IN ('AVAILABLE', 'NEEDS_CONFIRMATION')
        AND (l.expires_at IS NULL OR l.expires_at > now())
        AND sp.is_approved = TRUE
    )
  );

CREATE POLICY "listing_images_seller_manage"
  ON public.listing_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.seller_profiles sp ON sp.id = l.seller_id
      WHERE l.id = listing_images.listing_id
        AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "listing_images_admin_all"
  ON public.listing_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- ------------------------------------------------------------------------------
-- 6. listing_events
-- ------------------------------------------------------------------------------
CREATE POLICY "listing_events_seller_read"
  ON public.listing_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.seller_profiles sp ON sp.id = l.seller_id
      WHERE l.id = listing_events.listing_id
        AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "listing_events_admin_all"
  ON public.listing_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- ------------------------------------------------------------------------------
-- 7. reports
-- ------------------------------------------------------------------------------
CREATE POLICY "reports_submit"
  ON public.reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

CREATE POLICY "reports_admin_all"
  ON public.reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

