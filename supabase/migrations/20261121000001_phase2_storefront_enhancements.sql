-- Phase 2 Storefront Enhancements:
-- 1. Real-time operating status (OPEN_NOW, PRE_ORDER, CLOSED)
-- 2. Operating hours / batch note & primary campus pickup spot
-- 3. University of Ghana (@st.ug.edu.gh) student email verification flag

ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS store_status TEXT NOT NULL DEFAULT 'OPEN_NOW',
  ADD COLUMN IF NOT EXISTS operating_hours_note TEXT,
  ADD COLUMN IF NOT EXISTS primary_pickup_spot TEXT,
  ADD COLUMN IF NOT EXISTS ug_student_verified BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'seller_profiles_store_status_check'
  ) THEN
    ALTER TABLE public.seller_profiles
      ADD CONSTRAINT seller_profiles_store_status_check
      CHECK (store_status IN ('OPEN_NOW', 'PRE_ORDER', 'CLOSED'));
  END IF;
END $$;

-- Backfill ug_student_verified for any existing sellers who registered with @st.ug.edu.gh
UPDATE public.seller_profiles sp
SET ug_student_verified = TRUE
FROM auth.users u
WHERE sp.user_id = u.id
  AND lower(coalesce(u.email, '')) LIKE '%@st.ug.edu.gh';
