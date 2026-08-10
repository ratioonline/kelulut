-- ==========================================
-- FIX: INFINITE RECURSION IN RLS (PLPGSQL)
-- ==========================================

-- Masalah sebelumnya: Fungsi 'LANGUAGE sql' terkadang digabungkan (inline) oleh Postgres 
-- ke dalam query utama, sehingga status SECURITY DEFINER-nya terabaikan dan tetap memicu rekursi.
-- Solusi: Kita gunakan 'LANGUAGE plpgsql' agar fungsi tidak di-inline.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (role = 'super_admin') INTO is_admin 
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin, false);
END;
$$;

-- Refresh cache
NOTIFY pgrst, 'reload schema';
