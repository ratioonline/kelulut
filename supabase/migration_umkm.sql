-- ============================================================
-- Migration: UMKM Multi-User Dashboard System
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. user_profiles: role + metadata per user
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'umkm_user' CHECK (role IN ('super_admin','umkm_user')),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. umkms: profil UMKM
CREATE TABLE IF NOT EXISTS umkms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_name TEXT,
  short_description TEXT,
  description TEXT,
  whatsapp TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  province TEXT,
  city TEXT,
  district TEXT,
  village TEXT,
  postal_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  logo TEXT,
  cover_image TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  youtube TEXT,
  year_established INTEGER,
  umkm_category TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. categories: kategori produk terstruktur
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tambah kolom baru ke tabel products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS umkm_id UUID REFERENCES umkms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS minimum_stock INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pcs',
  ADD COLUMN IF NOT EXISTS minimum_order INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. stock_movements: riwayat perubahan stok
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  previous_stock INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('add','subtract','set','adjustment')),
  new_stock INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. review_replies: tanggapan UMKM terhadap review
CREATE TABLE IF NOT EXISTS review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
  umkm_id UUID REFERENCES umkms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  reply TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. audit_logs: catatan aktivitas
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  umkm_id UUID REFERENCES umkms(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE umkms ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ── user_profiles ──
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'super_admin')
  );

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin can manage all profiles"
  ON user_profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'super_admin')
  );

CREATE POLICY "Auth users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── umkms ──
CREATE POLICY "Public can view active UMKM"
  ON umkms FOR SELECT
  USING (
    status = 'active'
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'super_admin')
  );

CREATE POLICY "Owner can update own UMKM"
  ON umkms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin full access UMKM"
  ON umkms FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'super_admin')
  );

CREATE POLICY "Owner can insert UMKM"
  ON umkms FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'super_admin')
  );

-- ── categories ──
CREATE POLICY "Categories viewable by all"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Categories manageable by authenticated"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated');

-- ── stock_movements ──
CREATE POLICY "Stock movements viewable by owner or admin"
  ON stock_movements FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'super_admin')
    OR EXISTS (
      SELECT 1 FROM products p
      JOIN umkms u ON p.umkm_id = u.id
      WHERE p.id = stock_movements.product_id AND u.user_id = auth.uid()
    )
  );

CREATE POLICY "Stock movements insertable by owner or admin"
  ON stock_movements FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- ── review_replies ──
CREATE POLICY "Review replies viewable by all"
  ON review_replies FOR SELECT USING (true);

CREATE POLICY "UMKM owner can insert reply"
  ON review_replies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'super_admin')
  );

CREATE POLICY "UMKM owner can update own reply"
  ON review_replies FOR UPDATE
  USING (auth.uid() = user_id);

-- ── audit_logs ──
CREATE POLICY "Audit logs viewable by owner or admin"
  ON audit_logs FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'super_admin')
    OR EXISTS (
      SELECT 1 FROM umkms u WHERE u.id = audit_logs.umkm_id AND u.user_id = auth.uid()
    )
  );

CREATE POLICY "Audit logs insertable by authenticated"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- Seed default categories
-- ============================================================

INSERT INTO categories (name, slug, description) VALUES
  ('Madu', 'madu', 'Produk madu kelulut murni'),
  ('Suplemen', 'suplemen', 'Suplemen kesehatan berbasis kelulut'),
  ('Olahan', 'olahan', 'Produk olahan madu dan kelulut'),
  ('Perawatan', 'perawatan', 'Produk perawatan tubuh berbasis madu'),
  ('Lainnya', 'lainnya', 'Produk lainnya')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Assign existing admin user as super_admin (if exists)
-- Run this manually with your admin user's UUID:
-- INSERT INTO user_profiles (id, role, full_name) VALUES ('YOUR_ADMIN_UUID', 'super_admin', 'Admin');
-- ============================================================
