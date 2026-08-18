-- ============================================================
-- SYNC: Tambahkan semua file Storage ke tabel media_assets
-- Project: fixuryzyvbcsxqiyrqke.supabase.co
-- 
-- Cara pakai:
--   1. Buka https://supabase.com/dashboard
--   2. Pilih project Kebun Kelulut
--   3. Klik "SQL Editor" di sidebar kiri
--   4. Paste seluruh isi file ini → klik Run
-- ============================================================

-- Step 1: Cek berapa file yang belum tersync
SELECT 
  'Files di Storage' as keterangan,
  COUNT(*) as jumlah
FROM storage.objects
WHERE bucket_id = 'media'
UNION ALL
SELECT 
  'Records di media_assets',
  COUNT(*)
FROM public.media_assets
UNION ALL
SELECT 
  'Files belum tersync',
  (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'media') - 
  (SELECT COUNT(*) FROM public.media_assets);

-- ============================================================
-- Step 2: SYNC — Insert file storage yang belum ada di media_assets
-- ============================================================
INSERT INTO public.media_assets (
  file_name,
  file_size,
  url,
  mime_type,
  module,
  checksum,
  folder,
  alt_text,
  umkm_id,
  created_at
)
SELECT
  -- Nama file saja (bukan full path)
  SPLIT_PART(so.name, '/', -1) AS file_name,

  -- Ukuran file dalam bytes
  COALESCE((so.metadata->>'size')::INTEGER, 0) AS file_size,

  -- Public URL yang benar
  'https://fixuryzyvbcsxqiyrqke.supabase.co/storage/v1/object/public/media/' || so.name AS url,

  -- MIME type
  COALESCE(
    NULLIF(so.metadata->>'mimetype', ''),
    CASE
      WHEN so.name ILIKE '%.jpg'  THEN 'image/jpeg'
      WHEN so.name ILIKE '%.jpeg' THEN 'image/jpeg'
      WHEN so.name ILIKE '%.png'  THEN 'image/png'
      WHEN so.name ILIKE '%.webp' THEN 'image/webp'
      WHEN so.name ILIKE '%.gif'  THEN 'image/gif'
      WHEN so.name ILIKE '%.svg'  THEN 'image/svg+xml'
      WHEN so.name ILIKE '%.mp4'  THEN 'video/mp4'
      WHEN so.name ILIKE '%.mov'  THEN 'video/quicktime'
      WHEN so.name ILIKE '%.webm' THEN 'video/webm'
      ELSE 'image/webp'
    END
  ) AS mime_type,

  -- Module & folder
  'Media Library' AS module,
  '' AS checksum,

  -- Folder: folder pertama dalam path (misal: Produk, Galeri, dll)
  CASE 
    WHEN POSITION('/' IN so.name) > 0 
    THEN SPLIT_PART(so.name, '/', 1)
    ELSE 'Lainnya'
  END AS folder,

  -- Alt text: nama file tanpa ekstensi
  REGEXP_REPLACE(
    SPLIT_PART(so.name, '/', -1),
    '\.[^.]+$', ''
  ) AS alt_text,

  -- umkm_id: null untuk media umum
  NULL AS umkm_id,

  -- Waktu
  COALESCE(so.created_at, NOW()) AS created_at

FROM storage.objects so
WHERE
  so.bucket_id = 'media'
  -- Hanya gambar & video
  AND (
    so.metadata->>'mimetype' LIKE 'image/%'
    OR so.metadata->>'mimetype' LIKE 'video/%'
    OR so.name ILIKE '%.jpg'  OR so.name ILIKE '%.jpeg'
    OR so.name ILIKE '%.png'  OR so.name ILIKE '%.webp'
    OR so.name ILIKE '%.gif'  OR so.name ILIKE '%.svg'
    OR so.name ILIKE '%.mp4'  OR so.name ILIKE '%.mov'
    OR so.name ILIKE '%.webm'
  )
  -- Jangan duplikat
  AND NOT EXISTS (
    SELECT 1
    FROM public.media_assets ma
    WHERE ma.url = 'https://fixuryzyvbcsxqiyrqke.supabase.co/storage/v1/object/public/media/' || so.name
  );

-- ============================================================
-- Step 3: Verifikasi hasil sync
-- ============================================================
SELECT
  folder,
  COUNT(*) AS jumlah_file,
  ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) AS total_mb
FROM public.media_assets
GROUP BY folder
ORDER BY jumlah_file DESC;
