-- ========================================================
-- FIX RLS POLICIES FOR UMKM, MEDIA & ROLES (SUPER_ADMIN & PROKTOR)
-- Jalankan skrip ini di Supabase SQL Editor untuk mengatasi masalah:
-- Foto/Logo UMKM tidak tersimpan saat diedit oleh Proktor / Super Admin.
-- ========================================================

-- 1. Perbarui fungsi is_super_admin() agar mengenali role 'super_admin' DAN 'proktor'
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (role IN ('super_admin', 'proktor')) INTO is_admin 
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin, false);
END;
$$;

-- 2. Perbarui policy di tabel user_profiles
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Admin can view all profiles"
  ON public.user_profiles FOR SELECT
  USING ( public.is_super_admin() OR auth.uid() = id );

CREATE POLICY "Admin can manage all profiles"
  ON public.user_profiles FOR ALL
  USING ( public.is_super_admin() )
  WITH CHECK ( public.is_super_admin() );

-- 3. Perbarui RLS policy di tabel umkms
ALTER TABLE public.umkms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active UMKM" ON public.umkms;
DROP POLICY IF EXISTS "Admin full access UMKM" ON public.umkms;
DROP POLICY IF EXISTS "Owner can insert UMKM" ON public.umkms;
DROP POLICY IF EXISTS "Owner can update own UMKM" ON public.umkms;
DROP POLICY IF EXISTS "Owner can delete own UMKM" ON public.umkms;

-- Public dan user dapat melihat UMKM aktif atau UMKM miliknya sendiri / semua jika admin
CREATE POLICY "Public can view active UMKM"
  ON public.umkms FOR SELECT
  USING (
    status = 'active'
    OR auth.uid() = user_id
    OR public.is_super_admin()
  );

-- Admin (Super Admin & Proktor) memiliki akses penuh ke seluruh UMKM
CREATE POLICY "Admin full access UMKM"
  ON public.umkms FOR ALL
  USING ( public.is_super_admin() )
  WITH CHECK ( public.is_super_admin() );

-- Pemilik UMKM dapat menambah & memperbarui profil UMKM miliknya
CREATE POLICY "Owner can insert UMKM"
  ON public.umkms FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_super_admin()
  );

CREATE POLICY "Owner can update own UMKM"
  ON public.umkms FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.is_super_admin()
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_super_admin()
  );

-- 4. Perbarui RLS policy di tabel products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and owner full access products" ON public.products;
CREATE POLICY "Admin and owner full access products"
  ON public.products FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.umkms u
      WHERE u.id = products.umkm_id AND u.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.umkms u
      WHERE u.id = products.umkm_id AND u.user_id = auth.uid()
    )
  );

-- 5. Perbarui policy media_assets & storage
DROP POLICY IF EXISTS "Public can view media_assets" ON public.media_assets;
DROP POLICY IF EXISTS "Admins can manage media_assets" ON public.media_assets;

CREATE POLICY "Public can view media_assets" ON public.media_assets
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage media_assets" ON public.media_assets
  FOR ALL USING (
    public.is_super_admin()
    OR auth.uid() IS NOT NULL
  );

-- Storage bucket 'media' policy
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects 
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Admin Insert" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'media' AND (public.is_super_admin() OR auth.uid() IS NOT NULL)
  );

CREATE POLICY "Admin Update" ON storage.objects 
  FOR UPDATE USING (
    bucket_id = 'media' AND (public.is_super_admin() OR auth.uid() IS NOT NULL)
  );

CREATE POLICY "Admin Delete" ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'media' AND (public.is_super_admin() OR auth.uid() IS NOT NULL)
  );

-- 6. Reload schema cache PostgREST
NOTIFY pgrst, 'reload schema';
