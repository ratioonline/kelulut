-- ==========================================
-- FIX: INFINITE RECURSION IN RLS POLICIES
-- ==========================================

-- 1. Buat fungsi helper untuk mengecek status admin (SECURITY DEFINER)
-- Fungsi ini akan mem-bypass RLS sehingga tidak memicu rekursi tanpa batas.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role IN ('super_admin', 'proktor')
  );
$$;

-- 2. Perbarui policy di tabel user_profiles
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
CREATE POLICY "Admin can view all profiles"
  ON user_profiles FOR SELECT
  USING ( public.is_super_admin() );

DROP POLICY IF EXISTS "Admin can manage all profiles" ON user_profiles;
CREATE POLICY "Admin can manage all profiles"
  ON user_profiles FOR ALL
  USING ( public.is_super_admin() );

-- 3. Perbarui policy di tabel umkms
DROP POLICY IF EXISTS "Public can view active UMKM" ON umkms;
CREATE POLICY "Public can view active UMKM"
  ON umkms FOR SELECT
  USING (
    status = 'active'
    OR auth.uid() = user_id
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Admin full access UMKM" ON umkms;
CREATE POLICY "Admin full access UMKM"
  ON umkms FOR ALL
  USING ( public.is_super_admin() );

DROP POLICY IF EXISTS "Owner can insert UMKM" ON umkms;
CREATE POLICY "Owner can insert UMKM"
  ON umkms FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_super_admin()
  );

-- 4. Perbarui policy di stock_movements
DROP POLICY IF EXISTS "Stock movements viewable by owner or admin" ON stock_movements;
CREATE POLICY "Stock movements viewable by owner or admin"
  ON stock_movements FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM products p
      JOIN umkms u ON p.umkm_id = u.id
      WHERE p.id = stock_movements.product_id AND u.user_id = auth.uid()
    )
  );

-- 5. Perbarui policy di review_replies
DROP POLICY IF EXISTS "UMKM owner can insert reply" ON review_replies;
CREATE POLICY "UMKM owner can insert reply"
  ON review_replies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_super_admin()
  );

-- 6. Perbarui policy di audit_logs
DROP POLICY IF EXISTS "Audit logs viewable by owner or admin" ON audit_logs;
CREATE POLICY "Audit logs viewable by owner or admin"
  ON audit_logs FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM umkms u WHERE u.id = audit_logs.umkm_id AND u.user_id = auth.uid()
    )
  );

-- Memaksa reload cache
NOTIFY pgrst, 'reload schema';
