import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, Palette, LogOut, Upload, Plus, Trash2, PaintBucket, Settings, Layers,
  Download, FileUp, Home, Pencil, ToggleLeft, ToggleRight, Image,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useCompany, Paint } from '@/hooks/useCompany';
import { useToast } from '@/hooks/use-toast';
import { PaintForm, PaintFormData } from '@/components/admin/PaintForm';
import { PaintsList } from '@/components/admin/PaintsList';
import { supabase } from '@/integrations/supabase/client';

// Default basic colors catalog (60 colors)
const DEFAULT_BASIC_COLORS: Omit<Paint, 'id' | 'catalog_id'>[] = [
  // Brancos e Off-Whites
  { name: 'Branco Puro', code: 'BC-001', hex: '#FFFFFF', category: 'neutros', is_public: true },
  { name: 'Branco Gelo', code: 'BC-002', hex: '#F8F8F8', category: 'neutros', is_public: true },
  { name: 'Branco Algodão', code: 'BC-003', hex: '#FAF9F6', category: 'neutros', is_public: true },
  { name: 'Marfim', code: 'BC-004', hex: '#FFFFF0', category: 'neutros', is_public: true },
  { name: 'Pérola', code: 'BC-005', hex: '#FDF5E6', category: 'neutros', is_public: true },
  // Cinzas
  { name: 'Cinza Claro', code: 'BC-006', hex: '#D3D3D3', category: 'neutros', is_public: true },
  { name: 'Cinza Médio', code: 'BC-007', hex: '#A9A9A9', category: 'neutros', is_public: true },
  { name: 'Cinza Chumbo', code: 'BC-008', hex: '#808080', category: 'neutros', is_public: true },
  { name: 'Cinza Escuro', code: 'BC-009', hex: '#5A5A5A', category: 'neutros', is_public: true },
  { name: 'Grafite', code: 'BC-010', hex: '#3D3D3D', category: 'neutros', is_public: true },
  // Pretos
  { name: 'Preto', code: 'BC-011', hex: '#1A1A1A', category: 'neutros', is_public: true },
  { name: 'Carvão', code: 'BC-012', hex: '#2C2C2C', category: 'neutros', is_public: true },
  // Beiges e Areia
  { name: 'Areia', code: 'BC-013', hex: '#D4C4A8', category: 'neutros', is_public: true },
  { name: 'Bege', code: 'BC-014', hex: '#DEC4A1', category: 'neutros', is_public: true },
  { name: 'Camurça', code: 'BC-015', hex: '#C4A882', category: 'neutros', is_public: true },
  // Vermelhos
  { name: 'Vermelho Vivo', code: 'BC-016', hex: '#E63946', category: 'quentes', is_public: true },
  { name: 'Vermelho Escuro', code: 'BC-017', hex: '#9B1B30', category: 'quentes', is_public: true },
  { name: 'Bordô', code: 'BC-018', hex: '#722F37', category: 'quentes', is_public: true },
  { name: 'Cereja', code: 'BC-019', hex: '#DE3163', category: 'quentes', is_public: true },
  // Laranjas
  { name: 'Laranja Vibrante', code: 'BC-020', hex: '#FF8C00', category: 'quentes', is_public: true },
  { name: 'Terracota', code: 'BC-021', hex: '#CB6843', category: 'quentes', is_public: true },
  { name: 'Coral', code: 'BC-022', hex: '#FF7F50', category: 'quentes', is_public: true },
  { name: 'Pêssego', code: 'BC-023', hex: '#FFCBA4', category: 'quentes', is_public: true },
  // Amarelos
  { name: 'Amarelo Sol', code: 'BC-024', hex: '#FFD700', category: 'quentes', is_public: true },
  { name: 'Mostarda', code: 'BC-025', hex: '#E4A82B', category: 'quentes', is_public: true },
  { name: 'Amarelo Claro', code: 'BC-026', hex: '#FFFACD', category: 'pasteis', is_public: true },
  { name: 'Ocre', code: 'BC-027', hex: '#CC7722', category: 'quentes', is_public: true },
  // Marrons
  { name: 'Marrom Claro', code: 'BC-028', hex: '#A0785A', category: 'quentes', is_public: true },
  { name: 'Marrom Café', code: 'BC-029', hex: '#6F4E37', category: 'quentes', is_public: true },
  { name: 'Chocolate', code: 'BC-030', hex: '#3E2723', category: 'quentes', is_public: true },
  // Verdes
  { name: 'Verde Folha', code: 'BC-031', hex: '#228B22', category: 'frios', is_public: true },
  { name: 'Verde Musgo', code: 'BC-032', hex: '#556B2F', category: 'frios', is_public: true },
  { name: 'Verde Esmeralda', code: 'BC-033', hex: '#287D7D', category: 'frios', is_public: true },
  { name: 'Verde Menta', code: 'BC-034', hex: '#98FF98', category: 'frios', is_public: true },
  { name: 'Verde Oliva', code: 'BC-035', hex: '#808000', category: 'frios', is_public: true },
  { name: 'Verde Água', code: 'BC-036', hex: '#66CDAA', category: 'frios', is_public: true },
  { name: 'Verde Limão', code: 'BC-037', hex: '#32CD32', category: 'vibrantes', is_public: true },
  // Azuis
  { name: 'Azul Céu', code: 'BC-038', hex: '#87CEEB', category: 'frios', is_public: true },
  { name: 'Azul Royal', code: 'BC-039', hex: '#4169E1', category: 'frios', is_public: true },
  { name: 'Azul Marinho', code: 'BC-040', hex: '#1E3A5F', category: 'frios', is_public: true },
  { name: 'Azul Petróleo', code: 'BC-041', hex: '#006994', category: 'frios', is_public: true },
  { name: 'Azul Bebê', code: 'BC-042', hex: '#B0E0E6', category: 'pasteis', is_public: true },
  { name: 'Turquesa', code: 'BC-043', hex: '#40E0D0', category: 'frios', is_public: true },
  { name: 'Azul Cobalto', code: 'BC-044', hex: '#0047AB', category: 'vibrantes', is_public: true },
  // Roxos e Lilás
  { name: 'Roxo', code: 'BC-045', hex: '#7B4B94', category: 'vibrantes', is_public: true },
  { name: 'Lavanda', code: 'BC-046', hex: '#E6E6FA', category: 'pasteis', is_public: true },
  { name: 'Lilás', code: 'BC-047', hex: '#C8A2C8', category: 'pasteis', is_public: true },
  { name: 'Violeta', code: 'BC-048', hex: '#7B68EE', category: 'vibrantes', is_public: true },
  { name: 'Berinjela', code: 'BC-049', hex: '#4B0082', category: 'vibrantes', is_public: true },
  // Rosas
  { name: 'Rosa Quartzo', code: 'BC-050', hex: '#FFB6C1', category: 'pasteis', is_public: true },
  { name: 'Rosa Chá', code: 'BC-051', hex: '#F4C2C2', category: 'pasteis', is_public: true },
  { name: 'Rosa Antigo', code: 'BC-052', hex: '#BC8F8F', category: 'pasteis', is_public: true },
  { name: 'Pink', code: 'BC-053', hex: '#FF69B4', category: 'vibrantes', is_public: true },
  { name: 'Magenta', code: 'BC-054', hex: '#FF00FF', category: 'vibrantes', is_public: true },
  // Pastéis
  { name: 'Menta Suave', code: 'BC-055', hex: '#B2DFDB', category: 'pasteis', is_public: true },
  { name: 'Azul Sereno', code: 'BC-056', hex: '#B0E0E6', category: 'pasteis', is_public: true },
  { name: 'Verde Suave', code: 'BC-057', hex: '#C1E1C1', category: 'pasteis', is_public: true },
  { name: 'Salmão', code: 'BC-058', hex: '#FA8072', category: 'quentes', is_public: true },
  { name: 'Damasco', code: 'BC-059', hex: '#FFDAB9', category: 'pasteis', is_public: true },
  { name: 'Creme', code: 'BC-060', hex: '#FFFDD0', category: 'neutros', is_public: true },
];

export default function AdminDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    company, branding, catalogs, loading: companyLoading,
    createCompany, updateBranding, uploadLogo,
    createCatalog, deleteCatalog, loadPaints, addPaint, deletePaint,
    refresh,
  } = useCompany();

  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [newCatalogName, setNewCatalogName] = useState('');
  const [activeCatalogId, setActiveCatalogId] = useState<string | null>(null);
  const [paints, setPaints] = useState<Paint[]>([]);
  const [loadingPaints, setLoadingPaints] = useState(false);

  // Edit catalog state
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [editCatalogName, setEditCatalogName] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (activeCatalogId) {
      setLoadingPaints(true);
      loadPaints(activeCatalogId).then(p => {
        setPaints(p);
        setLoadingPaints(false);
      });
    }
  }, [activeCatalogId]);

  // Create default "Cores Básicas" catalog when company is created and has no catalogs
  useEffect(() => {
    if (company && catalogs.length === 0 && !companyLoading) {
      createDefaultCatalog();
    }
  }, [company, catalogs.length, companyLoading]);

  const createDefaultCatalog = async () => {
    if (!company) return;
    const { error } = await createCatalog('Cores Básicas', 'Catálogo padrão com 60 cores essenciais');
    if (error) return;
    // Need to wait for refresh to get the new catalog id
    await refresh();
  };

  // After catalogs load, populate default catalog if empty
  useEffect(() => {
    if (company && catalogs.length > 0) {
      const basicCatalog = catalogs.find(c => c.name === 'Cores Básicas');
      if (basicCatalog) {
        populateDefaultCatalog(basicCatalog.id);
      }
    }
  }, [catalogs]);

  const populateDefaultCatalog = async (catalogId: string) => {
    const existing = await loadPaints(catalogId);
    if (existing.length > 0) return; // already populated
    for (const color of DEFAULT_BASIC_COLORS) {
      await addPaint(catalogId, color);
    }
    if (activeCatalogId === catalogId) {
      const p = await loadPaints(catalogId);
      setPaints(p);
    }
  };

  const handleCreateCompany = async () => {
    if (!companyName || !companySlug) return;
    const { error } = await createCompany(companyName, companySlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Empresa criada!', description: 'Configure sua marca e catálogos.' });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { error } = await uploadLogo(file);
    if (error) toast({ title: 'Erro no upload', description: error, variant: 'destructive' });
    else toast({ title: 'Logo atualizado!' });
  };

  const handleAddCatalog = async () => {
    if (!newCatalogName) return;
    const { error } = await createCatalog(newCatalogName);
    if (error) toast({ title: 'Erro', description: error, variant: 'destructive' });
    else {
      toast({ title: 'Catálogo criado!' });
      setNewCatalogName('');
    }
  };

  const handleAddPaint = async (data: PaintFormData) => {
    if (!activeCatalogId) return;
    const { error } = await addPaint(activeCatalogId, { ...data, is_public: true });
    if (error) toast({ title: 'Erro', description: error, variant: 'destructive' });
    else {
      toast({ title: 'Cor adicionada!' });
      const p = await loadPaints(activeCatalogId);
      setPaints(p);
    }
  };

  const handleDeletePaint = async (paintId: string) => {
    await deletePaint(paintId);
    if (activeCatalogId) {
      const p = await loadPaints(activeCatalogId);
      setPaints(p);
    }
  };

  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value);
    if (!slugManuallyEdited) {
      setCompanySlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setCompanySlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleToggleCatalog = async (catalogId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('company_paint_catalogs')
      .update({ is_active: !currentActive } as any)
      .eq('id', catalogId);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: currentActive ? 'Catálogo desativado' : 'Catálogo ativado' });
      await refresh();
    }
  };

  const handleCatalogLogoUpload = async (catalogId: string, file: File) => {
    if (!company) return;
    const path = `${company.id}/catalog-${catalogId}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadErr } = await supabase.storage
      .from('company-assets')
      .upload(path, file, { upsert: true });
    if (uploadErr) {
      toast({ title: 'Erro no upload', description: uploadErr.message, variant: 'destructive' });
      return;
    }
    const { data: { publicUrl } } = supabase.storage
      .from('company-assets')
      .getPublicUrl(path);
    const { error } = await supabase
      .from('company_paint_catalogs')
      .update({ logo_url: publicUrl } as any)
      .eq('id', catalogId);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Logo do catálogo atualizado!' });
      await refresh();
    }
  };

  const handleRenameCatalog = async (catalogId: string, newName: string) => {
    if (!newName.trim()) return;
    const { error } = await supabase
      .from('company_paint_catalogs')
      .update({ name: newName.trim() })
      .eq('id', catalogId);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Catálogo renomeado!' });
      setEditingCatalogId(null);
      await refresh();
    }
  };

  const sanitizeCSVCell = (value: string): string => {
    if (!value) return '';
    let v = value;
    const firstChar = v.charAt(0);
    if (['=', '+', '-', '@', '\t', '\r'].includes(firstChar)) {
      v = "'" + v;
    }
    if (v.includes(',') || v.includes('\n') || v.includes('"')) {
      v = '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  };

  const handleExportCSV = () => {
    if (paints.length === 0) return;
    const header = 'nome,codigo,hex,categoria';
    const rows = paints.map(p =>
      [p.name, p.code, p.hex, p.category].map(sanitizeCSVCell).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `catalogo-cores.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV exportado!' });
  };

  const VALID_HEX = /^#[0-9A-Fa-f]{3,8}$/;
  const MAX_CSV_ROWS = 1000;

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCatalogId) return;
    if (file.size > 5_000_000) {
      toast({ title: 'Erro', description: 'Arquivo muito grande (máx 5MB)', variant: 'destructive' });
      return;
    }
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const startIdx = lines[0]?.toLowerCase().includes('nome') ? 1 : 0;
    if (lines.length - startIdx > MAX_CSV_ROWS) {
      toast({ title: 'Erro', description: `Máximo ${MAX_CSV_ROWS} cores por importação`, variant: 'destructive' });
      return;
    }
    let added = 0;
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(',').map(s => s.trim());
      if (parts.length < 3) continue;
      const [name, code, rawHex, category] = parts;
      if (!name || name.length > 100) continue;
      if (!code || code.length > 50) continue;
      const hex = rawHex.startsWith('#') ? rawHex : `#${rawHex}`;
      if (!VALID_HEX.test(hex)) continue;
      await addPaint(activeCatalogId, {
        name: name.slice(0, 100), code: code.slice(0, 50),
        hex, category: (category || 'neutros').slice(0, 50),
        is_public: true,
      });
      added++;
    }
    const p = await loadPaints(activeCatalogId);
    setPaints(p);
    toast({ title: `${added} cores importadas!` });
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  if (authLoading || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="font-display text-2xl">Configurar Empresa</CardTitle>
            <CardDescription>Crie o perfil da sua empresa para começar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da empresa</Label>
              <Input placeholder="Minha Loja de Tintas" value={companyName} onChange={e => handleCompanyNameChange(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL personalizada)</Label>
              <Input placeholder="minha-loja" value={companySlug} onChange={e => handleSlugChange(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Será usado na URL: /empresa/{companySlug || 'minha-loja'}
              </p>
            </div>
            <Button className="w-full" onClick={handleCreateCompany} disabled={!companyName || !companySlug}>
              <Plus className="w-4 h-4 mr-2" /> Criar Empresa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get catalog metadata including is_active and logo_url from DB
  const catalogsWithMeta = catalogs as any[];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          {branding?.logo_url ? (
            <img src={branding.logo_url} alt={company.name} className="h-8 w-auto object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Palette className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
          <span className="font-display font-bold text-foreground">{company.name}</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gradient-primary text-primary-foreground hover:opacity-90" size="sm" asChild>
            <Link to="/">
              <Palette className="w-4 h-4 mr-2" /> Simulador de Ambientes
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Branding Section */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Settings className="w-5 h-5" /> Personalização da Marca
            </CardTitle>
            <CardDescription>Configure o logotipo e as cores da sua empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="space-y-2">
                <Label>Logotipo</Label>
                <div className="w-32 h-32 border-2 border-dashed border-border rounded-xl flex items-center justify-center overflow-hidden bg-muted">
                  {branding?.logo_url ? (
                    <img src={branding.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <label className="block">
                  <Button variant="outline" size="sm" className="w-32" asChild>
                    <span>
                      <Upload className="w-3 h-3 mr-1" /> Upload
                      <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
                    </span>
                  </Button>
                </label>
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label>Cor primária</Label>
                  <div className="flex gap-2">
                    <input type="color" value={branding?.primary_color || '#1a8a7a'} onChange={e => updateBranding({ primary_color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                    <Input value={branding?.primary_color || '#1a8a7a'} onChange={e => updateBranding({ primary_color: e.target.value })} className="w-28 font-mono text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor secundária</Label>
                  <div className="flex gap-2">
                    <input type="color" value={branding?.secondary_color || '#e8734a'} onChange={e => updateBranding({ secondary_color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                    <Input value={branding?.secondary_color || '#e8734a'} onChange={e => updateBranding({ secondary_color: e.target.value })} className="w-28 font-mono text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Catalogs Section */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Layers className="w-5 h-5" /> Catálogos de Tintas
            </CardTitle>
            <CardDescription>Gerencie seus catálogos e cores disponíveis para os clientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Nome do novo catálogo..." value={newCatalogName} onChange={e => setNewCatalogName(e.target.value)} />
              <Button onClick={handleAddCatalog} disabled={!newCatalogName}>
                <Plus className="w-4 h-4 mr-1" /> Criar
              </Button>
            </div>

            <Separator />

            {catalogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum catálogo criado ainda. Crie um acima para começar.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {catalogsWithMeta.map((catalog: any) => (
                  <div
                    key={catalog.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      activeCatalogId === catalog.id
                        ? 'border-primary bg-primary/5'
                        : catalog.is_active === false
                        ? 'border-border bg-muted/50 opacity-60'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setActiveCatalogId(activeCatalogId === catalog.id ? null : catalog.id)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        {catalog.logo_url ? (
                          <img src={catalog.logo_url} alt="" className="w-8 h-8 rounded object-contain border border-border" />
                        ) : (
                          <PaintBucket className="w-5 h-5 text-primary" />
                        )}
                        {editingCatalogId === catalog.id ? (
                          <Input
                            value={editCatalogName}
                            onChange={e => setEditCatalogName(e.target.value)}
                            onBlur={() => handleRenameCatalog(catalog.id, editCatalogName)}
                            onKeyDown={e => { if (e.key === 'Enter') handleRenameCatalog(catalog.id, editCatalogName); }}
                            className="h-7 text-sm"
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span className="font-medium text-foreground">{catalog.name}</span>
                        )}
                      </button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingCatalogId(catalog.id);
                            setEditCatalogName(catalog.name);
                          }}
                          title="Renomear"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <label title="Logo do catálogo">
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <span>
                              <Image className="w-3 h-3" />
                              <input
                                type="file" accept="image/*" className="sr-only"
                                onChange={e => {
                                  const f = e.target.files?.[0];
                                  if (f) handleCatalogLogoUpload(catalog.id, f);
                                }}
                              />
                            </span>
                          </Button>
                        </label>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={e => {
                            e.stopPropagation();
                            handleToggleCatalog(catalog.id, catalog.is_active !== false);
                          }}
                          title={catalog.is_active !== false ? 'Desativar' : 'Ativar'}
                        >
                          {catalog.is_active !== false ? (
                            <ToggleRight className="w-4 h-4 text-primary" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await deleteCatalog(catalog.id);
                            if (activeCatalogId === catalog.id) setActiveCatalogId(null);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {catalog.is_active === false && (
                      <p className="text-xs text-muted-foreground">Catálogo desativado — não aparece para clientes</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Paint management for active catalog */}
            {activeCatalogId && (
              <div className="mt-4 space-y-4">
                <Separator />
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-semibold text-foreground">Cores do Catálogo</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={paints.length === 0}>
                      <Download className="w-3 h-3 mr-1" /> CSV
                    </Button>
                    <label>
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <FileUp className="w-3 h-3 mr-1" /> Importar
                          <input ref={csvInputRef} type="file" accept=".csv" className="sr-only" onChange={handleImportCSV} />
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
                <PaintForm onSubmit={handleAddPaint} compact />
                <PaintsList paints={paints} loading={loadingPaints} onDelete={handleDeletePaint} empty="Nenhuma cor neste catálogo. Adicione acima." />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
