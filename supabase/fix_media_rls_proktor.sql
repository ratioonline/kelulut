-- ========================================================
-- FIX RLS POLICIES FOR MEDIA & STORAGE (SUPPORT PROKTOR & SUPER_ADMIN)
-- Run this script in Supabase SQL Editor if you experience
-- "new row violates row-level security policy"
-- ========================================================

-- 1. Update media_assets table RLS policies
DROP POLICY IF EXISTS "Public can view media_assets" ON public.media_assets;
DROP POLICY IF EXISTS "Super admin can manage media_assets" ON public.media_assets;
DROP POLICY IF EXISTS "Admins can manage media_assets" ON public.media_assets;
DROP POLICY IF EXISTS "UMKM can insert own media_assets" ON public.media_assets;
DROP POLICY IF EXISTS "UMKM can update own media_assets" ON public.media_assets;
DROP POLICY IF EXISTS "UMKM can delete own media_assets" ON public.media_assets;

-- Allow public read
CREATE POLICY "Public can view media_assets" ON public.media_assets
    FOR SELECT USING (true);

-- Allow super_admin, proktor, kontributor to manage all media_assets
CREATE POLICY "Admins can manage media_assets" ON public.media_assets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('super_admin', 'proktor', 'kontributor')
        )
    );

-- Allow UMKM to manage own media_assets
CREATE POLICY "UMKM can insert own media_assets" ON public.media_assets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'umkm_user'
        )
    );

CREATE POLICY "UMKM can update own media_assets" ON public.media_assets
    FOR UPDATE USING (
        umkm_id IN (
            SELECT id FROM public.umkms WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "UMKM can delete own media_assets" ON public.media_assets
    FOR DELETE USING (
        umkm_id IN (
            SELECT id FROM public.umkms WHERE user_id = auth.uid()
        )
    );

-- 2. Update storage.objects policies for 'media' bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Super Admin Insert" ON storage.objects;
DROP POLICY IF EXISTS "Super Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Super Admin Delete" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
DROP POLICY IF EXISTS "UMKM Insert" ON storage.objects;
DROP POLICY IF EXISTS "UMKM Update" ON storage.objects;
DROP POLICY IF EXISTS "UMKM Delete" ON storage.objects;

-- Ensure 'media' bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public can read all objects in 'media'
CREATE POLICY "Public Access" ON storage.objects 
    FOR SELECT USING (bucket_id = 'media');

-- Admins (super_admin, proktor, kontributor) full access to 'media' bucket
CREATE POLICY "Admin Insert" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'media' AND (
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE user_profiles.id = auth.uid() 
                AND user_profiles.role IN ('super_admin', 'proktor', 'kontributor')
            )
            OR auth.uid() IS NOT NULL
        )
    );

CREATE POLICY "Admin Update" ON storage.objects 
    FOR UPDATE USING (
        bucket_id = 'media' AND (
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE user_profiles.id = auth.uid() 
                AND user_profiles.role IN ('super_admin', 'proktor', 'kontributor')
            )
            OR auth.uid() IS NOT NULL
        )
    );

CREATE POLICY "Admin Delete" ON storage.objects 
    FOR DELETE USING (
        bucket_id = 'media' AND (
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE user_profiles.id = auth.uid() 
                AND user_profiles.role IN ('super_admin', 'proktor', 'kontributor')
            )
            OR auth.uid() IS NOT NULL
        )
    );

-- UMKM Insert/Update/Delete
CREATE POLICY "UMKM Insert" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'media' AND EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'umkm_user'
        )
    );
