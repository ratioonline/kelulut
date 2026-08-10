-- Migration untuk menghubungkan Produk dengan UMKM

-- Tambahkan kolom umkm_id ke tabel products jika belum ada
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS umkm_id UUID REFERENCES public.umkms(id) ON DELETE SET NULL;
