-- ==========================================
-- OPTIMIZE: MAKE FUNCTION STABLE
-- ==========================================

-- Masalah: Fungsi is_super_admin berjalan berkali-kali untuk setiap baris data (VOLATILE)
-- sehingga menyebabkan loading halaman menjadi sangat lambat (berat).
-- Solusi: Kita tambahkan properti STABLE agar hasilnya di-cache (diingat) oleh database 
-- selama satu query berjalan.

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

-- Refresh cache
NOTIFY pgrst, 'reload schema';
