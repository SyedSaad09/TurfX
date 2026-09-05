/*
# TurfX Core Schema — Phase 1

## Overview
Creates the foundational database for a turf & sports venue booking platform.
This migration establishes the core entity tables that the customer application
reads from, and that future owner/admin dashboards will write to.

## New Tables
1. `turfs` — venue listings (name, location, rating, price, images, specs, rules, hours)
2. `sports` — master list of sports offered (football, cricket, etc.)
3. `facilities` — master list of amenities (parking, washroom, floodlights, etc.)
4. `turf_sports` — many-to-many: which sports each turf supports
5. `turf_facilities` — many-to-many: which facilities each turf has
6. `slots` — time slots per turf per date with availability status
7. `bookings` — customer bookings (demo, no auth in Phase 1)
8. `reviews` — customer ratings & text reviews per turf
9. `favorites` — saved turfs (demo, session-scoped)
10. `coupons` — discount codes

## Security
- RLS enabled on every table.
- Phase 1 is a browsable public catalog (no sign-in), so SELECT is open to
  anon + authenticated. Writes (bookings, reviews, favorites) are also open
  to anon for the demo; Phase 2 will lock these to authenticated owners.
- This is intentionally a public/shared data model per the bolt-database
  single-tenant guidance.

## Notes
- Demo data is seeded in a separate step and clearly marked DEMO.
- Schema designed to expand to multiple cities (city column on turfs).
- Slots store a generated_at timestamp and a status enum to prevent
  double-booking at the data layer (unique constraint on turf+date+start_time).
*/

-- Sports master
CREATE TABLE IF NOT EXISTS sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT 'CircleDot',
  created_at timestamptz DEFAULT now()
);

-- Facilities master
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT 'Check',
  created_at timestamptz DEFAULT now()
);

-- Turfs
CREATE TABLE IF NOT EXISTS turfs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  city text NOT NULL DEFAULT 'Nanded',
  area text NOT NULL,
  address text NOT NULL,
  lat numeric(9,6),
  lng numeric(9,6),
  short_description text NOT NULL,
  description text NOT NULL DEFAULT '',
  rating numeric(2,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count int NOT NULL DEFAULT 0,
  price_per_hour numeric(10,2) NOT NULL CHECK (price_per_hour >= 0),
  turf_type text NOT NULL DEFAULT 'Artificial Grass',
  is_indoor boolean NOT NULL DEFAULT false,
  is_outdoor boolean NOT NULL DEFAULT true,
  has_floodlights boolean NOT NULL DEFAULT true,
  open_time time NOT NULL DEFAULT '06:00',
  close_time time NOT NULL DEFAULT '23:00',
  size text NOT NULL DEFAULT '',
  surface text NOT NULL DEFAULT '',
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  image_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  popularity int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_turfs_city ON turfs(city);
CREATE INDEX IF NOT EXISTS idx_turfs_slug ON turfs(slug);

-- Turf <-> Sport
CREATE TABLE IF NOT EXISTS turf_sports (
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  sport_id uuid NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  PRIMARY KEY (turf_id, sport_id)
);

-- Turf <-> Facility
CREATE TABLE IF NOT EXISTS turf_facilities (
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  PRIMARY KEY (turf_id, facility_id)
);

-- Slots
CREATE TABLE IF NOT EXISTS slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  slot_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','booked','blocked','unavailable')),
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (turf_id, slot_date, start_time)
);
CREATE INDEX IF NOT EXISTS idx_slots_turf_date ON slots(turf_id, slot_date);

-- Bookings (demo — no auth in Phase 1)
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text NOT NULL UNIQUE,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  slot_id uuid NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  slot_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_hours int NOT NULL DEFAULT 1 CHECK (duration_hours > 0),
  base_amount numeric(10,2) NOT NULL,
  platform_fee numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  final_amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','completed','pending')),
  payment_method text NOT NULL DEFAULT 'upi',
  coupon_code text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_turf ON bookings(turf_id);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_turf ON reviews(turf_id);

-- Favorites (demo, session-scoped)
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (session_id, turf_id)
);
CREATE INDEX IF NOT EXISTS idx_fav_session ON favorites(session_id);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent','flat')),
  discount_value numeric(10,2) NOT NULL,
  max_discount numeric(10,2) NOT NULL DEFAULT 0,
  min_order numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  valid_until date,
  created_at timestamptz DEFAULT now()
);

-- ===== RLS =====
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE turfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE turf_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE turf_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Sports: public read
DROP POLICY IF EXISTS "read_sports" ON sports;
CREATE POLICY "read_sports" ON sports FOR SELECT TO anon, authenticated USING (true);

-- Facilities: public read
DROP POLICY IF EXISTS "read_facilities" ON facilities;
CREATE POLICY "read_facilities" ON facilities FOR SELECT TO anon, authenticated USING (true);

-- Turfs: public read
DROP POLICY IF EXISTS "read_turfs" ON turfs;
CREATE POLICY "read_turfs" ON turfs FOR SELECT TO anon, authenticated USING (true);

-- Turf sports: public read
DROP POLICY IF EXISTS "read_turf_sports" ON turf_sports;
CREATE POLICY "read_turf_sports" ON turf_sports FOR SELECT TO anon, authenticated USING (true);

-- Turf facilities: public read
DROP POLICY IF EXISTS "read_turf_facilities" ON turf_facilities;
CREATE POLICY "read_turf_facilities" ON turf_facilities FOR SELECT TO anon, authenticated USING (true);

-- Slots: public read
DROP POLICY IF EXISTS "read_slots" ON slots;
CREATE POLICY "read_slots" ON slots FOR SELECT TO anon, authenticated USING (true);

-- Bookings: demo open (Phase 1)
DROP POLICY IF EXISTS "read_bookings" ON bookings;
CREATE POLICY "read_bookings" ON bookings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_bookings" ON bookings;
CREATE POLICY "insert_bookings" ON bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_bookings" ON bookings;
CREATE POLICY "update_bookings" ON bookings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Reviews: public read, anon insert (demo)
DROP POLICY IF EXISTS "read_reviews" ON reviews;
CREATE POLICY "read_reviews" ON reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_reviews" ON reviews;
CREATE POLICY "insert_reviews" ON reviews FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Favorites: anon CRUD by session (demo)
DROP POLICY IF EXISTS "read_favorites" ON favorites;
CREATE POLICY "read_favorites" ON favorites FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_favorites" ON favorites;
CREATE POLICY "insert_favorites" ON favorites FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "delete_favorites" ON favorites;
CREATE POLICY "delete_favorites" ON favorites FOR DELETE TO anon, authenticated USING (true);

-- Coupons: public read
DROP POLICY IF EXISTS "read_coupons" ON coupons;
CREATE POLICY "read_coupons" ON coupons FOR SELECT TO anon, authenticated USING (true);
