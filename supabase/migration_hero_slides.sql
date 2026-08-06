-- ============================================================
-- Migration: Hero Slides (Dynamic Hero Background)
-- Jalankan di Supabase SQL Editor
-- ============================================================

CREATE TABLE hero_slides (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  subtitle    TEXT,
  image_url   TEXT NOT NULL,
  badge_text  TEXT DEFAULT 'Wisata Edukasi Kelulut',
  cta_primary_label  TEXT DEFAULT 'Reservasi Sekarang',
  cta_primary_url    TEXT DEFAULT '/reservasi',
  cta_secondary_label TEXT DEFAULT 'Lihat Program',
  cta_secondary_url   TEXT DEFAULT '/program',
  is_active   BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hero slides viewable by everyone"
  ON hero_slides FOR SELECT USING (true);

CREATE POLICY "Hero slides manageable by admin"
  ON hero_slides FOR ALL USING (auth.role() = 'authenticated');

-- ── Sample data ──────────────────────────────────────────────
INSERT INTO hero_slides
  (title, subtitle, image_url, badge_text, cta_primary_label, cta_primary_url, cta_secondary_label, cta_secondary_url, is_active, sort_order)
VALUES
(
  'Temukan Keajaiban\nLebah Kelulut',
  'Nikmati wisata edukasi unik bersama lebah kelulut di Sangatta, Kutai Timur. Belajar, panen madu, dan bawa pulang kenangan tak terlupakan.',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80',
  '🐝 Wisata Edukasi Kelulut',
  'Reservasi Sekarang',
  '/reservasi',
  'Lihat Program',
  '/program',
  true,
  1
),
(
  'Panen Madu Kelulut\nLangsung dari Kebun',
  'Saksikan proses panen madu kelulut secara langsung bersama pemandu berpengalaman kami di Sangatta, Kalimantan Timur.',
  'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1600&q=80',
  '🍯 Demo Panen Madu',
  'Pesan Sekarang',
  '/reservasi',
  'Lihat Produk',
  '/produk',
  true,
  2
),
(
  'Edukasi Alam\nuntuk Semua Usia',
  'Program wisata edukasi yang dirancang untuk keluarga, pelajar, dan rombongan. Cocok untuk semua kalangan.',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80',
  '📚 Program Edukasi',
  'Jadwalkan Kunjungan',
  '/reservasi',
  'Tentang Kami',
  '/program',
  true,
  3
);
