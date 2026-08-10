-- ==========================================
-- ULTIMATE FIX: RLS RECURSION
-- ==========================================

-- Akar masalah 500 Internal Server Error yang membandel adalah karena 
-- tabel user_profiles masih memicu rekursi saat mengecek dirinya sendiri.
-- Solusi terbaik dan paling aman adalah membuat tabel user_profiles bisa dibaca 
-- oleh semua orang, karena tidak ada data rahasia (hanya nama, avatar, dan role).

-- 1. Hapus semua policy SELECT yang berpotensi memicu rekursi di user_profiles
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

-- 2. Buat policy SELECT baru yang mengizinkan siapa saja (atau user yg login) 
-- untuk membaca data profil, sehingga TIDAK PERLU mengecek admin lagi saat membaca profil.
CREATE POLICY "Anyone can view profiles"
  ON public.user_profiles FOR SELECT
  USING (true);

-- Refresh cache Supabase
NOTIFY pgrst, 'reload schema';
