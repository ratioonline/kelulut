-- Migration untuk menghubungkan Artikel dan Galeri dengan UMKM

-- 1. Tambahkan kolom umkm_id ke tabel articles
ALTER TABLE public.articles
ADD COLUMN umkm_id UUID REFERENCES public.umkms(id) ON DELETE CASCADE;

-- 2. Tambahkan kolom umkm_id ke tabel gallery
ALTER TABLE public.gallery
ADD COLUMN umkm_id UUID REFERENCES public.umkms(id) ON DELETE CASCADE;
