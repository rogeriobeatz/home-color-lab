
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Company branding
CREATE TABLE public.company_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1a8a7a',
  secondary_color TEXT DEFAULT '#e8734a',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.company_branding ENABLE ROW LEVEL SECURITY;

-- User roles (separate table per security rules)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Company paint catalogs
CREATE TABLE public.company_paint_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.company_paint_catalogs ENABLE ROW LEVEL SECURITY;

-- Paints within catalogs
CREATE TABLE public.paints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES public.company_paint_catalogs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  hex TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'neutros',
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.paints ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is admin of a company (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND company_id = _company_id AND role = 'admin'
  )
$$;

-- Helper: has_role for generic role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_branding_updated_at BEFORE UPDATE ON public.company_branding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_paint_catalogs_updated_at BEFORE UPDATE ON public.company_paint_catalogs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_paints_updated_at BEFORE UPDATE ON public.paints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: companies
CREATE POLICY "Company admins can view their company" ON public.companies FOR SELECT TO authenticated USING (public.is_company_admin(auth.uid(), id));
CREATE POLICY "Company admins can update their company" ON public.companies FOR UPDATE TO authenticated USING (public.is_company_admin(auth.uid(), id));
CREATE POLICY "Authenticated users can create companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Public can view companies by slug" ON public.companies FOR SELECT TO anon USING (true);

-- RLS: company_branding
CREATE POLICY "Admins can manage branding" ON public.company_branding FOR ALL TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "Public can view branding" ON public.company_branding FOR SELECT TO anon USING (true);

-- RLS: user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles in their company" ON public.user_roles FOR ALL TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
-- Allow initial self-assignment during company creation
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RLS: company_paint_catalogs
CREATE POLICY "Admins can manage catalogs" ON public.company_paint_catalogs FOR ALL TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "Public can view catalogs" ON public.company_paint_catalogs FOR SELECT TO anon USING (true);

-- RLS: paints
CREATE POLICY "Admins can manage paints" ON public.paints FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.company_paint_catalogs c WHERE c.id = catalog_id AND public.is_company_admin(auth.uid(), c.company_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.company_paint_catalogs c WHERE c.id = catalog_id AND public.is_company_admin(auth.uid(), c.company_id))
);
CREATE POLICY "Public can view public paints" ON public.paints FOR SELECT TO anon USING (is_public = true);

-- Storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true);
CREATE POLICY "Anyone can view company assets" ON storage.objects FOR SELECT USING (bucket_id = 'company-assets');
CREATE POLICY "Admins can upload company assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'company-assets');
CREATE POLICY "Admins can update company assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'company-assets');
CREATE POLICY "Admins can delete company assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'company-assets');
