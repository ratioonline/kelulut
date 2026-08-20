-- ============================================================
-- Migration: Make title column optional in hero_slides
-- Jalankan di Supabase SQL Editor
-- ============================================================

ALTER TABLE hero_slides ALTER COLUMN title DROP NOT NULL;
