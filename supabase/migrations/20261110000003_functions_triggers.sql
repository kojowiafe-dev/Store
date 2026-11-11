-- ==============================================================================
-- Migration: 20261110000003_functions_triggers.sql
-- Campus Store: Triggers, Search Vectors, and Two-Phase Expiry Functions
-- ==============================================================================

-- 1. Full-Text Search Vector Maintenance Trigger
CREATE OR REPLACE FUNCTION public.trg_listings_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_listings_search_vector
  BEFORE INSERT OR UPDATE OF title, description
  ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_listings_search_vector_update();

-- 2. updated_at Timestamp Maintenance Trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_universities_updated_at    BEFORE UPDATE ON public.universities    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_halls_updated_at           BEFORE UPDATE ON public.halls           FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated_at        BEFORE UPDATE ON public.profiles        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_seller_profiles_updated_at BEFORE UPDATE ON public.seller_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_categories_updated_at      BEFORE UPDATE ON public.categories      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_listings_updated_at        BEFORE UPDATE ON public.listings        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Prevent is_admin Self-Escalation Trigger
CREATE OR REPLACE FUNCTION public.prevent_is_admin_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     AND current_setting('role', true) != 'service_role' THEN
    RAISE EXCEPTION 'is_admin may only be altered by an administrative database script or service_role routine.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_is_admin_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_is_admin_self_update();

-- 4. Two-Phase Automated Expiry Worker Function
CREATE OR REPLACE FUNCTION public.process_listing_expiry_transitions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_needs_confirm_count INTEGER := 0;
  v_expired_count       INTEGER := 0;
  v_batch_ids           UUID[];
BEGIN
  -- Phase 1: AVAILABLE -> NEEDS_CONFIRMATION
  SELECT array_agg(id) INTO v_batch_ids
  FROM public.listings
  WHERE availability_status = 'AVAILABLE'
    AND confirm_before <= now()
    AND deleted_at IS NULL;

  IF v_batch_ids IS NOT NULL THEN
    UPDATE public.listings
       SET availability_status = 'NEEDS_CONFIRMATION',
           updated_at          = now()
     WHERE id = ANY(v_batch_ids);

    GET DIAGNOSTICS v_needs_confirm_count = ROW_COUNT;

    INSERT INTO public.listing_events (listing_id, actor_id, event_type, payload)
    SELECT id, NULL, 'needs_confirmation_triggered', jsonb_build_object('triggered_at', now())
    FROM unnest(v_batch_ids) AS id;
  END IF;

  -- Phase 2: NEEDS_CONFIRMATION -> EXPIRED
  SELECT array_agg(id) INTO v_batch_ids
  FROM public.listings
  WHERE availability_status = 'NEEDS_CONFIRMATION'
    AND expires_at <= now()
    AND deleted_at IS NULL;

  IF v_batch_ids IS NOT NULL THEN
    UPDATE public.listings
       SET availability_status = 'EXPIRED',
           updated_at          = now()
     WHERE id = ANY(v_batch_ids);

    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    INSERT INTO public.listing_events (listing_id, actor_id, event_type, payload)
    SELECT id, NULL, 'expired', jsonb_build_object('expired_at', now())
    FROM unnest(v_batch_ids) AS id;
  END IF;

  RETURN jsonb_build_object(
    'needs_confirmation_updated', v_needs_confirm_count,
    'expired_updated', v_expired_count,
    'executed_at', now()
  );
END;
$$;

