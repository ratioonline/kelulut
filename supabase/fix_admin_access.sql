-- ==========================================
-- FIX: ADMIN PROFILE AND UMKM CREATION
-- ==========================================

-- 1. Berikan izin kepada Admin untuk membuat dan mengedit profil pengguna lain
-- Ini diperlukan agar fitur "Tambah UMKM" bisa membuatkan profil untuk UMKM tersebut.
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.user_profiles;
CREATE POLICY "Admin can manage all profiles"
  ON public.user_profiles FOR ALL
  USING ( public.is_super_admin() );

-- 2. Pastikan akun Anda saat ini terdaftar sebagai super_admin di database
-- Karena sebelumnya pembuatan profil terhalang error 500, kita suntikkan manual sekarang.
INSERT INTO public.user_profiles (id, role, full_name, created_at)
SELECT id, 'super_admin', email, NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
-- Batasi hanya untuk akun Anda yang saat ini terhubung ke profil UMKM atau yang pertama kali dibuat
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (id) DO UPDATE 
SET role = 'super_admin';

-- Refresh cache
NOTIFY pgrst, 'reload schema';
