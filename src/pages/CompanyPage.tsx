import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Palette, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditorView } from '@/components/editor/EditorView';

interface CompanyData {
  id: string;
  name: string;
  slug: string;
}

interface BrandingData {
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

export interface CompanyPaint {
  id: string;
  name: string;
  code: string;
  hex: string;
  category: string;
  rgb?: string | null;
  cmyk?: string | null;
  ral?: string | null;
  ncs?: string | null;
}

export default function CompanyPage() {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [paints, setPaints] = useState<CompanyPaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    loadCompany(slug);
  }, [slug]);

  const loadCompany = async (slug: string) => {
    setLoading(true);

    const { data: comp } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!comp) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setCompany(comp as CompanyData);

    const [brandingRes, catalogsRes] = await Promise.all([
      supabase.from('company_branding').select('*').eq('company_id', comp.id).maybeSingle(),
      supabase.from('company_paint_catalogs').select('id, is_active').eq('company_id', comp.id),
    ]);

    if (brandingRes.data) setBranding(brandingRes.data as BrandingData);

    if (catalogsRes.data && catalogsRes.data.length > 0) {
      // Filter to only active catalogs
      const activeCatalogs = catalogsRes.data.filter((c: any) => c.is_active !== false);
      const catalogIds = activeCatalogs.map((c: any) => c.id);
      if (catalogIds.length === 0) { setLoading(false); return; }
      const { data: paintsData } = await supabase
        .from('paints')
        .select('*')
        .in('catalog_id', catalogIds)
        .eq('is_public', true)
        .order('name');

      if (paintsData) setPaints(paintsData as CompanyPaint[]);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Empresa não encontrada</h1>
          <p className="text-muted-foreground">Verifique o link e tente novamente.</p>
          <Button asChild>
            <Link to="/">Ir para o início</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <EditorView
      onBack={() => window.history.back()}
      companyName={company?.name}
      companyLogo={branding?.logo_url}
      companyPaints={paints}
      primaryColor={branding?.primary_color}
      secondaryColor={branding?.secondary_color}
    />
  );
}
