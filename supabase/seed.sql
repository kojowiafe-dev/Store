-- ==============================================================================
-- Seed: supabase/seed.sql
-- Campus Store: Development Seed Data for UG Legon / Commonwealth Hall Pilot
-- ==============================================================================

-- 1. Universities
INSERT INTO public.universities (id, name, slug, city, country, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'University of Ghana',
  'ug',
  'Accra',
  'GH',
  TRUE
) ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- 2. Residence Halls
INSERT INTO public.halls (id, university_id, name, slug, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Jean Nelson AKA Hall', 'jean-nelson-aka-hall', TRUE),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Commonwealth Hall', 'commonwealth', TRUE),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Volta Hall', 'volta', TRUE),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Legon Hall', 'legon', TRUE),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Akuafo Hall', 'akuafo', TRUE)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- 3. Standard Categories with Two-Phase Lead Times
INSERT INTO public.categories (id, name, slug, icon, sort_order, default_expiry_hours, default_confirm_lead_hours, is_active)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Food & Snacks',          'food-snacks',    '🍱', 1, 24,   4,  TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Groceries',              'groceries',      '🛒', 2, 48,   8,  TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Clothing & Accessories', 'clothing',       '👗', 3, 168,  48, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Personal Care',          'personal-care',  '🧴', 4, 168,  48, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Electronics',            'electronics',    '📱', 5, 720,  72, TRUE),
  ('10000000-0000-0000-0000-000000000006', 'Services',               'services',       '🛠️', 6, NULL, NULL, TRUE)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, 
    icon = EXCLUDED.icon,
    default_expiry_hours = EXCLUDED.default_expiry_hours,
    default_confirm_lead_hours = EXCLUDED.default_confirm_lead_hours;


-- 3.5 Create corresponding auth.users entries so profiles foreign key succeeds
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
)
VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'ama@campusstore.test',
    '$2a$10$w0B7G4Z6BvE9b7tq4X8Vne9I0Y6I7J8K9L0M1N2O3P4Q5R6S7T8U9',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Ama Mensah"}'::jsonb,
    FALSE
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'kofi@campusstore.test',
    '$2a$10$w0B7G4Z6BvE9b7tq4X8Vne9I0Y6I7J8K9L0M1N2O3P4Q5R6S7T8U9',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Kofi Asante"}'::jsonb,
    FALSE
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'esi@campusstore.test',
    '$2a$10$w0B7G4Z6BvE9b7tq4X8Vne9I0Y6I7J8K9L0M1N2O3P4Q5R6S7T8U9',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Esi Boateng"}'::jsonb,
    FALSE
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000099',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@campusstore.test',
    '$2a$10$w0B7G4Z6BvE9b7tq4X8Vne9I0Y6I7J8K9L0M1N2O3P4Q5R6S7T8U9',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Admin Moderator"}'::jsonb,
    FALSE
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Test User Profiles (Matches auth.users created in local development)
-- UUIDs prefixed with aaaaaaaa-0000-...
INSERT INTO public.profiles (id, display_name, whatsapp_number, bio, is_admin, is_active)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Ama Mensah', '+233501234567', 'Homemade food and fresh juices in Jean Nelson AKA Hall Block B.', FALSE, TRUE),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Kofi Asante', '+233541112233', 'Curated thrifted streetwear and accessories.', FALSE, TRUE),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Esi Boateng', '+233203334455', 'Genuine fast chargers and audio accessories.', FALSE, TRUE),
  ('aaaaaaaa-0000-0000-0000-000000000099', 'Admin Coordinator', '+233240000000', 'Campus Store Moderator & Hall Liaison.', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. Test Seller Profiles (Digital Storefronts)
INSERT INTO public.seller_profiles (id, user_id, hall_id, store_name, storefront_slug, store_description, is_approved, approved_at)
VALUES
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    'Ama’s Kitchen',
    'amas-kitchen',
    'Fresh hot jollof, waakye, and chilled zobo available daily from 12 PM to 10 PM.',
    TRUE,
    now()
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000010',
    'Kofi Vintage Wardrobe',
    'kofi-vintage',
    'Quality grade-A thrift jackets, denim, and sneakers. Pick up at Block C.',
    TRUE,
    now()
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000010',
    'Legon Tech Hub',
    'legon-tech-hub',
    'Verified laptop chargers, phone cables, and audio gear for students.',
    TRUE,
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Sample Listings Across Multiple Categories & Canonical States
INSERT INTO public.listings (
  id, seller_id, category_id, slug, title, description, price, price_negotiable, currency,
  availability_status, confirm_before, expires_at
)
VALUES
  -- Food (AVAILABLE, expires in 24h, confirm in 20h)
  (
    'cccccccc-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'hot-jollof-chicken-shito-8f1',
    'Hot Jollof Rice with Grilled Chicken & Shito',
    'Freshly cooked jollof rice served with spiced grilled chicken drumstick and homemade black shito pepper. Takeaway pack included.',
    35.00,
    FALSE,
    'GHS',
    'AVAILABLE',
    now() + INTERVAL '20 hours',
    now() + INTERVAL '24 hours'
  ),
  -- Food (NEEDS_CONFIRMATION: confirm_before has passed, expires_at in 2 hours)
  (
    'cccccccc-0000-0000-0000-000000000002',
    'bbbbbbbb-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'waakye-delight-combo-b2a',
    'Waakye Combo with Egg, Wele & Fish',
    'Rich waakye combo served with boiled egg, tender cow-skin (wele), fried fish, talia spaghetti, and gari foto.',
    30.00,
    FALSE,
    'GHS',
    'NEEDS_CONFIRMATION',
    now() - INTERVAL '1 hour',
    now() + INTERVAL '3 hours'
  ),
  -- Clothing (AVAILABLE, 7 days)
  (
    'cccccccc-0000-0000-0000-000000000003',
    'bbbbbbbb-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    'vintage-levis-denim-jacket-c7e',
    'Vintage Levi’s Denim Jacket (Oversized, Size L)',
    'Original Levi Strauss denim trucker jacket in washed light blue. Oversized unisex fit in great vintage condition.',
    120.00,
    TRUE,
    'GHS',
    'AVAILABLE',
    now() + INTERVAL '5 days',
    now() + INTERVAL '7 days'
  ),
  -- Electronics (AVAILABLE, 30 days)
  (
    'cccccccc-0000-0000-0000-000000000004',
    'bbbbbbbb-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000005',
    'baseus-65w-gan-fast-charger-f3d',
    'Baseus 65W GaN Fast Charger (Type-C + USB)',
    'Ultra-fast GaN charger capable of charging MacBooks, Dell laptops, iPhones, and Android devices. 2 Type-C ports + 1 USB port.',
    180.00,
    FALSE,
    'GHS',
    'AVAILABLE',
    now() + INTERVAL '27 days',
    now() + INTERVAL '30 days'
  ),
  -- Food (SOLD_OUT by seller - hidden from discovery)
  (
    'cccccccc-0000-0000-0000-000000000005',
    'bbbbbbbb-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'chilled-zobo-ginger-500ml-a4f',
    'Chilled Sobolo with Cloves & Ginger (500ml)',
    'Homemade organic hibiscus drink brewed with fresh ginger and natural sweeteners. Cold and sealed.',
    10.00,
    FALSE,
    'GHS',
    'SOLD_OUT',
    NULL,
    NULL
  ),
  -- Services (AVAILABLE, no expiry)
  (
    'cccccccc-0000-0000-0000-000000000006',
    'bbbbbbbb-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000006',
    'laptop-clean-thermal-paste-service-e2a',
    'Laptop Cleaning, Dust Blow & Thermal Paste Service',
    'Laptop running hot or loud fan? Thorough internal dust cleaning and Arctic MX-4 thermal paste re-application. Same day pickup.',
    50.00,
    TRUE,
    'GHS',
    'AVAILABLE',
    NULL,
    NULL
  )
ON CONFLICT (id) DO NOTHING;
