-- ============================================================
-- Migration: Shopee-like product features
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Tambah kolom baru ke tabel products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS discount_price INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sold_count     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating         NUMERIC(2,1) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS rating_count   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weight_gram    INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS images         TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS details        TEXT DEFAULT NULL;

-- Tabel product_reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  buyer_name  TEXT NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable by everyone"        ON product_reviews FOR SELECT USING (true);
CREATE POLICY "Reviews insertable by everyone"      ON product_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Reviews manageable by admin"         ON product_reviews FOR ALL USING (auth.role() = 'authenticated');

-- Update sample data dengan kolom baru
UPDATE products SET
  discount_price = NULL,
  sold_count     = 127,
  rating         = 4.8,
  rating_count   = 43,
  images         = ARRAY[]::TEXT[]
WHERE name = 'Madu Kelulut Murni 250ml';

UPDATE products SET
  discount_price = 145000,
  sold_count     = 89,
  rating         = 4.9,
  rating_count   = 31,
  images         = ARRAY[]::TEXT[]
WHERE name = 'Madu Kelulut Murni 500ml';

UPDATE products SET
  sold_count  = 56,
  rating      = 4.7,
  rating_count = 18,
  images      = ARRAY[]::TEXT[]
WHERE name = 'Propolis Kelulut 30ml';

UPDATE products SET
  sold_count  = 34,
  rating      = 4.6,
  rating_count = 12,
  images      = ARRAY[]::TEXT[]
WHERE name = 'Madu Kelulut + Jahe 250ml';

-- Sample reviews
INSERT INTO product_reviews (product_id, buyer_name, rating, comment)
SELECT id, 'Andi S.', 5, 'Madunya asli banget, beda dari yang lain. Rasa asam manisnya khas.'
FROM products WHERE name = 'Madu Kelulut Murni 250ml' LIMIT 1;

INSERT INTO product_reviews (product_id, buyer_name, rating, comment)
SELECT id, 'Siti R.', 5, 'Sudah 3x beli, kualitas konsisten. Sangat recommended!'
FROM products WHERE name = 'Madu Kelulut Murni 250ml' LIMIT 1;

INSERT INTO product_reviews (product_id, buyer_name, rating, comment)
SELECT id, 'Budi W.', 4, 'Bagus, tapi packaging bisa lebih rapi lagi.'
FROM products WHERE name = 'Madu Kelulut Murni 500ml' LIMIT 1;
