-- ============================================================
-- Kebun Kelulut Sangatta - Database Schema
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Programs (Paket Kunjungan)
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price INTEGER,
  duration TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations (Pemesanan Kunjungan)
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  institution TEXT,
  visit_date DATE NOT NULL,
  num_visitors INTEGER NOT NULL,
  program_id UUID REFERENCES programs(id),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'done', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (Produk Madu)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price INTEGER,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  category TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles (Artikel Blog)
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  thumbnail_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery (Foto Kegiatan)
CREATE TABLE gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Programs: publik bisa baca, hanya admin bisa ubah
CREATE POLICY "Programs are viewable by everyone" ON programs FOR SELECT USING (true);
CREATE POLICY "Programs are editable by authenticated users" ON programs FOR ALL USING (auth.role() = 'authenticated');

-- Products: publik bisa baca, hanya admin bisa ubah
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Products are editable by authenticated users" ON products FOR ALL USING (auth.role() = 'authenticated');

-- Articles: publik bisa baca yang published, admin bisa semua
CREATE POLICY "Published articles are viewable by everyone" ON articles FOR SELECT USING (published = true OR auth.role() = 'authenticated');
CREATE POLICY "Articles are editable by authenticated users" ON articles FOR ALL USING (auth.role() = 'authenticated');

-- Gallery: publik bisa baca, hanya admin bisa ubah
CREATE POLICY "Gallery is viewable by everyone" ON gallery FOR SELECT USING (true);
CREATE POLICY "Gallery is editable by authenticated users" ON gallery FOR ALL USING (auth.role() = 'authenticated');

-- Reservations: siapa saja bisa insert (form publik), admin bisa semua
CREATE POLICY "Anyone can create reservations" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Reservations are manageable by authenticated users" ON reservations FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- Sample Data
-- ============================================================

INSERT INTO programs (title, slug, description, price, duration, is_active) VALUES
  ('Pengenalan Kelulut', 'pengenalan-kelulut', 'Mengenal lebah kelulut, habitat, dan manfaatnya bagi ekosistem. Cocok untuk pelajar dan umum.', 50000, '2 jam', true),
  ('Demo Panen Madu', 'demo-panen-madu', 'Saksikan langsung proses panen madu kelulut secara higienis dan berkelanjutan.', 75000, '2.5 jam', true),
  ('Sruput Madu', 'sruput-madu', 'Nikmati pengalaman mencicipi berbagai jenis madu kelulut langsung dari sumbernya.', 35000, '1 jam', true),
  ('Dokumentasi & Fotografi', 'dokumentasi-fotografi', 'Sesi dokumentasi foto dan video di kebun kelulut dengan latar alam yang indah.', 100000, '3 jam', true);

INSERT INTO products (name, slug, description, price, stock, category, is_available) VALUES
  ('Madu Kelulut Murni 250ml', 'madu-kelulut-murni-250ml', 'Madu kelulut murni tanpa campuran, dipanen langsung dari kebun kami.', 85000, 50, 'Madu', true),
  ('Madu Kelulut Murni 500ml', 'madu-kelulut-murni-500ml', 'Madu kelulut murni kemasan 500ml, cocok untuk konsumsi keluarga.', 160000, 30, 'Madu', true),
  ('Propolis Kelulut 30ml', 'propolis-kelulut-30ml', 'Ekstrak propolis kelulut untuk kesehatan dan imunitas tubuh.', 120000, 25, 'Suplemen', true),
  ('Madu Kelulut + Jahe 250ml', 'madu-kelulut-jahe-250ml', 'Perpaduan madu kelulut dengan jahe untuk menghangatkan tubuh.', 95000, 20, 'Madu', true);

INSERT INTO gallery (title, description, image_url, category) VALUES
  ('Sarang Kelulut', 'Sarang lebah kelulut yang unik di batang kayu', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'Fasilitas'),
  ('Panen Madu', 'Proses panen madu kelulut yang higienis', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800', 'Kegiatan'),
  ('Kebun Kelulut', 'Suasana kebun kelulut yang asri', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', 'Fasilitas'),
  ('Edukasi Siswa', 'Kunjungan siswa sekolah ke kebun kelulut', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800', 'Kegiatan'),
  ('Produk Madu', 'Berbagai produk madu kelulut berkualitas', 'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=800', 'Produk'),
  ('Workshop', 'Workshop pembuatan produk berbasis madu', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800', 'Kegiatan');
