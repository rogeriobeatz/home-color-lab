import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Company {
  id: string;
  name: string;
  slug: string;
}

export interface CompanyBranding {
  id: string;
  company_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
}

export interface PaintCatalog {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
}

export interface Paint {
  id: string;
  catalog_id: string;
  name: string;
  code: string;
  hex: string;
  category: string;
  is_public: boolean;
  rgb?: string | null;
  cmyk?: string | null;
  ral?: string | null;
  ncs?: string | null;
}

export function useCompany() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [branding, setBranding] = useState<CompanyBranding | null>(null);
  const [catalogs, setCatalogs] = useState<PaintCatalog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCompany(null);
      setBranding(null);
      setCatalogs([]);
      setLoading(false);
      return;
    }
    loadCompanyData();
  }, [user]);

  const loadCompanyData = async () => {
    if (!user) return;
    setLoading(true);

    // Get user's company via user_roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (!roles || roles.length === 0) {
      setLoading(false);
      return;
    }

    const companyId = roles[0].company_id;

    const [companyRes, brandingRes, catalogsRes] = await Promise.all([
      supabase.from('companies').select('*').eq('id', companyId).maybeSingle(),
      supabase.from('company_branding').select('*').eq('company_id', companyId).maybeSingle(),
      supabase.from('company_paint_catalogs').select('*').eq('company_id', companyId),
    ]);

    if (companyRes.data) setCompany(companyRes.data as Company);
    if (brandingRes.data) setBranding(brandingRes.data as CompanyBranding);
    if (catalogsRes.data) setCatalogs(catalogsRes.data as PaintCatalog[]);

    setLoading(false);
  };

  const createCompany = async (name: string, slug: string) => {
    if (!user) return { error: 'Not authenticated' };

    // Generate ID client-side to avoid SELECT permission issues during creation
    const companyId = crypto.randomUUID();

    const { error: compErr } = await supabase
      .from('companies')
      .insert({ id: companyId, name, slug });

    if (compErr) return { error: compErr.message };

    // Assign admin role first (so subsequent queries work with RLS)
    const { error: roleErr } = await supabase.from('user_roles').insert({
      user_id: user.id,
      company_id: companyId,
      role: 'admin',
    });

    if (roleErr) return { error: roleErr.message };

    // Create default branding (now user is admin, RLS allows it)
    await supabase.from('company_branding').insert({ company_id: companyId });

    await loadCompanyData();
    return { error: null };
  };

  const updateBranding = async (updates: Partial<CompanyBranding>) => {
    if (!branding) return;
    // Optimistic update - don't reload to avoid flickering
    setBranding(prev => prev ? { ...prev, ...updates } : prev);
    const { error } = await supabase
      .from('company_branding')
      .update(updates)
      .eq('id', branding.id);
    if (error) {
      // Revert on error
      await loadCompanyData();
    }
    return { error };
  };

  const uploadLogo = async (file: File) => {
    if (!company) return { error: 'No company' };
    const path = `${company.id}/logo-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadErr } = await supabase.storage
      .from('company-assets')
      .upload(path, file, { upsert: true });
    if (uploadErr) return { error: uploadErr.message };

    const { data: { publicUrl } } = supabase.storage
      .from('company-assets')
      .getPublicUrl(path);

    await updateBranding({ logo_url: publicUrl });
    return { error: null };
  };

  const createCatalog = async (name: string, description?: string) => {
    if (!company) return { error: 'No company' };
    const { error } = await supabase
      .from('company_paint_catalogs')
      .insert({ company_id: company.id, name, description: description || null });
    if (!error) await loadCompanyData();
    return { error: error?.message || null };
  };

  const deleteCatalog = async (catalogId: string) => {
    const { error } = await supabase
      .from('company_paint_catalogs')
      .delete()
      .eq('id', catalogId);
    if (!error) await loadCompanyData();
    return { error: error?.message || null };
  };

  const loadPaints = async (catalogId: string) => {
    const { data } = await supabase
      .from('paints')
      .select('*')
      .eq('catalog_id', catalogId)
      .order('name');
    return (data || []) as Paint[];
  };

  const addPaint = async (catalogId: string, paint: Omit<Paint, 'id' | 'catalog_id'>) => {
    const { error } = await supabase
      .from('paints')
      .insert({ ...paint, catalog_id: catalogId });
    return { error: error?.message || null };
  };

  const deletePaint = async (paintId: string) => {
    const { error } = await supabase.from('paints').delete().eq('id', paintId);
    return { error: error?.message || null };
  };

  return {
    company, branding, catalogs, loading,
    createCompany, updateBranding, uploadLogo,
    createCatalog, deleteCatalog, loadPaints, addPaint, deletePaint,
    refresh: loadCompanyData,
  };
}
