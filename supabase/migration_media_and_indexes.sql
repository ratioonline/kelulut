-- ==========================================
-- PHASE 1: PERFORMANCE OPTIMIZATION
-- Create media_assets table & Database Indexes
-- ==========================================

-- 1. Create media_assets table
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    module TEXT NOT NULL,
    checksum TEXT,
    folder TEXT DEFAULT 'Lainnya',
    alt_text TEXT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    umkm_id UUID REFERENCES public.umkms(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_assets
-- Public can view media assets
CREATE POLICY "Public can view media_assets" ON public.media_assets
    FOR SELECT USING (true);

-- Super admin can do everything
CREATE POLICY "Super admin can manage media_assets" ON public.media_assets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'super_admin'
        )
    );

-- UMKM users can insert their own media
CREATE POLICY "UMKM can insert own media_assets" ON public.media_assets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'umkm_user'
        )
    );

-- UMKM users can update/delete their own media
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

-- 2. Create Performance Indexes (Avoid full table scans)

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_umkm_id ON public.products (umkm_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_sold_count ON public.products (sold_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products (is_available);

-- Gallery table indexes
CREATE INDEX IF NOT EXISTS idx_gallery_category ON public.gallery (category);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON public.gallery (created_at DESC);

-- Reservations table indexes
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations (status);
CREATE INDEX IF NOT EXISTS idx_reservations_visit_date ON public.reservations (visit_date DESC);

-- Media Assets table indexes
CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON public.media_assets (folder);
CREATE INDEX IF NOT EXISTS idx_media_assets_module ON public.media_assets (module);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON public.media_assets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_umkm_id ON public.media_assets (umkm_id);

-- 3. Create Storage Bucket for Media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'media' bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Super Admin Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin'));
CREATE POLICY "Super Admin Update" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin'));
CREATE POLICY "Super Admin Delete" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'super_admin'));
CREATE POLICY "UMKM Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'umkm_user'));
CREATE POLICY "UMKM Update" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'umkm_user'));
CREATE POLICY "UMKM Delete" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'umkm_user'));
