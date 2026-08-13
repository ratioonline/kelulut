-- ==========================================
-- PHASE 1: Add 'proktor' role & Transactions
-- ==========================================

-- 1. Update user_role ENUM to include 'proktor'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'proktor';

-- 2. Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    umkm_id UUID REFERENCES public.umkms(id) ON DELETE CASCADE, -- null if official
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'pending', 'cancelled'
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method TEXT, -- 'cash', 'transfer', etc
    type TEXT NOT NULL DEFAULT 'offline', -- 'online', 'offline'
    customer_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create transaction_items table
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_time NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for transactions
-- Admins/Proktors can see all transactions
CREATE POLICY "Admins and Proktors can see all transactions"
    ON public.transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('super_admin', 'proktor')
        )
    );

-- UMKM can see their own transactions
CREATE POLICY "UMKM can see own transactions"
    ON public.transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'umkm_user'
        )
        AND 
        umkm_id IN (SELECT id FROM public.umkms WHERE user_id = auth.uid())
    );

-- Admins and UMKM can insert transactions (Proktor too)
CREATE POLICY "Users can insert transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 6. RLS Policies for transaction_items
CREATE POLICY "Admins and Proktors can see all transaction items"
    ON public.transaction_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('super_admin', 'proktor')
        )
    );

CREATE POLICY "UMKM can see own transaction items"
    ON public.transaction_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions t
            JOIN public.umkms u ON t.umkm_id = u.id
            WHERE t.id = transaction_items.transaction_id
            AND u.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert transaction items"
    ON public.transaction_items FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 7. Update Gallery RLS so UMKM can see everything
-- Drop the restrictive select policy if exists and create a new one
DROP POLICY IF EXISTS "Anyone can view active gallery items" ON public.gallery;
DROP POLICY IF EXISTS "UMKM can view own gallery items" ON public.gallery;

CREATE POLICY "Everyone can view gallery items"
    ON public.gallery FOR SELECT
    USING (true); -- UMKM, Admins, and Public can see all images
