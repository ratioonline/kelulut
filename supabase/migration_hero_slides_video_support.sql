-- ============================================================
-- Migration: Add Hybrid Media Support (Image + Video) to hero_slides
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tambahkan kolom media_type dengan default 'image' dan constraint CHECK
ALTER TABLE hero_slides 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';

-- Pasang CHECK constraint jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hero_slides_media_type_check'
  ) THEN
    ALTER TABLE hero_slides
    ADD CONSTRAINT hero_slides_media_type_check CHECK (media_type IN ('image', 'video'));
  END IF;
END $$;

-- 2. Tambahkan kolom video_url (nullable)
ALTER TABLE hero_slides 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 3. Tambahkan kolom poster_url (nullable)
ALTER TABLE hero_slides 
ADD COLUMN IF NOT EXISTS poster_url TEXT;

-- 4. Backfill semua data existing agar media_type = 'image' jika kosong
UPDATE hero_slides 
SET media_type = 'image' 
WHERE media_type IS NULL;
