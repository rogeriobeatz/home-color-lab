-- Add professional color format fields to paints table
ALTER TABLE public.paints
  ADD COLUMN IF NOT EXISTS rgb text,
  ADD COLUMN IF NOT EXISTS cmyk text,
  ADD COLUMN IF NOT EXISTS ral text,
  ADD COLUMN IF NOT EXISTS ncs text;

-- Add index for RAL and NCS lookups
CREATE INDEX IF NOT EXISTS idx_paints_ral ON public.paints (ral) WHERE ral IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_paints_ncs ON public.paints (ncs) WHERE ncs IS NOT NULL;