-- ========================================================================
-- MIGRASI DATA MEDIA LAMA KE MEDIA LIBRARY
-- Jalankan skrip ini di Supabase > SQL Editor
-- Fungsi: Memasukkan URL gambar dari Produk, Galeri, Artikel, dan Program 
-- ke tabel `media_assets` agar muncul di Media Library
-- ========================================================================

-- 1. Insert dari tabel Products
INSERT INTO public.media_assets (file_name, file_size, url, mime_type, module, folder, alt_text, umkm_id, created_at)
SELECT 
    'produk_' || substr(id::text, 1, 8) || '.jpg',
    0,
    image_url,
    'image/jpeg',
    'Produk',
    'Produk',
    name,
    umkm_id,
    created_at
FROM public.products
WHERE image_url IS NOT NULL 
  AND image_url != ''
  AND NOT EXISTS (SELECT 1 FROM public.media_assets WHERE url = public.products.image_url);

-- 2. Insert dari tabel Gallery
INSERT INTO public.media_assets (file_name, file_size, url, mime_type, module, folder, alt_text, umkm_id, created_at)
SELECT 
    'galeri_' || substr(id::text, 1, 8) || '.jpg',
    0,
    image_url,
    'image/jpeg',
    'Galeri',
    'Galeri',
    title,
    umkm_id,
    created_at
FROM public.gallery
WHERE image_url IS NOT NULL 
  AND image_url != ''
  AND NOT EXISTS (SELECT 1 FROM public.media_assets WHERE url = public.gallery.image_url);

-- 3. Insert dari tabel Articles
INSERT INTO public.media_assets (file_name, file_size, url, mime_type, module, folder, alt_text, umkm_id, created_at)
SELECT 
    'artikel_' || substr(id::text, 1, 8) || '.jpg',
    0,
    thumbnail_url,
    'image/jpeg',
    'Artikel',
    'Artikel',
    title,
    umkm_id,
    created_at
FROM public.articles
WHERE thumbnail_url IS NOT NULL 
  AND thumbnail_url != ''
  AND NOT EXISTS (SELECT 1 FROM public.media_assets WHERE url = public.articles.thumbnail_url);

-- 4. Insert dari tabel Programs
INSERT INTO public.media_assets (file_name, file_size, url, mime_type, module, folder, alt_text, created_at)
SELECT 
    'program_' || substr(id::text, 1, 8) || '.jpg',
    0,
    image_url,
    'image/jpeg',
    'Program',
    'Program',
    title,
    created_at
FROM public.programs
WHERE image_url IS NOT NULL 
  AND image_url != ''
  AND NOT EXISTS (SELECT 1 FROM public.media_assets WHERE url = public.programs.image_url);

-- Selesai. Data lama Anda sekarang akan muncul di Media Library.
