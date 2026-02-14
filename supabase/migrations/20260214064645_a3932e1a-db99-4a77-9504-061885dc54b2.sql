
-- Add logo_url and is_active columns to company_paint_catalogs
ALTER TABLE public.company_paint_catalogs
  ADD COLUMN logo_url text,
  ADD COLUMN is_active boolean NOT NULL DEFAULT true;
