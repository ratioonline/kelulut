-- 1. Tambahkan nilai baru ke ENUM user_role (agar tidak perlu hapus policy)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'umkm_user';

-- 2. Perbarui role lama (jika ada) ke format baru
UPDATE public.user_profiles 
SET role = 'super_admin' 
WHERE role::TEXT = 'admin';

UPDATE public.user_profiles 
SET role = 'umkm_user' 
WHERE role::TEXT = 'user' AND id = (SELECT id FROM auth.users WHERE email = 'wenakelulut@gmail.com');

-- 3. Masukkan profil UMKM yang hilang
INSERT INTO public.user_profiles (id, role, full_name, created_at)
SELECT id, 'umkm_user', email, NOW()
FROM auth.users
WHERE email = 'wenakelulut@gmail.com'
  AND id NOT IN (SELECT id FROM public.user_profiles);
