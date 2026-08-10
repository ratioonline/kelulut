-- Pastikan kolom umkm_id memiliki tipe data UUID
-- (Jika sebelumnya terbuat sebagai TEXT, kita ubah dulu)
ALTER TABLE public.products 
  ALTER COLUMN umkm_id TYPE UUID USING umkm_id::UUID;

-- Hapus constraint lama jika ada (untuk menghindari duplikat)
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_umkm_id_fkey;

-- Tambahkan relasi Foreign Key secara paksa
ALTER TABLE public.products
  ADD CONSTRAINT products_umkm_id_fkey 
  FOREIGN KEY (umkm_id) 
  REFERENCES public.umkms(id) 
  ON DELETE SET NULL;

-- Memaksa Supabase (PostgREST) untuk memuat ulang skema relasi terbaru
NOTIFY pgrst, reload_schema;
