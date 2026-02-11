import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, Palette, LogOut, Upload, Plus, Trash2, PaintBucket, Settings, Layers,
  Download, FileUp, Home, Eye, Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useCompany, Paint } from '@/hooks/useCompany';
import { useToast } from '@/hooks/use-toast';
import { PaintForm, PaintFormData } from '@/components/admin/PaintForm';
import { PaintsList } from '@/components/admin/PaintsList';

export default function AdminDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    company, branding, catalogs, loading: companyLoading,
    createCompany, updateBranding, uploadLogo,
    createCatalog, deleteCatalog, loadPaints, addPaint, deletePaint,
  } = useCompany();

  // Company creation state
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Catalog management
  const [newCatalogName, setNewCatalogName] = useState('');
  const [activeCatalogId, setActiveCatalogId] = useState<string | null>(null);
  const [paints, setPaints] = useState<Paint[]>([]);
  const [loadingPaints, setLoadingPaints] = useState(false);

  // New paint form
  const [newPaint, setNewPaint] = useState<PaintFormData>({ name: '', code: '', hex: '#000000', category: 'neutros' });

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
      if (activeCatalogId) {
        const p = await loadPaints(activeCatalogId);
        setPaints(p);
      }
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

  const handleExportCSV = () => {
    if (paints.length === 0) return;
    const header = 'nome,codigo,hex,categoria';
    const rows = paints.map(p => `${p.name},${p.code},${p.hex},${p.category}`);
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

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCatalogId) return;
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    // skip header if present
    const startIdx = lines[0]?.toLowerCase().includes('nome') ? 1 : 0;
    let added = 0;
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(',').map(s => s.trim());
      if (parts.length >= 3) {
        const [name, code, hex, category] = parts;
        await addPaint(activeCatalogId, {
          name, code,
          hex: hex.startsWith('#') ? hex : `#${hex}`,
          category: category || 'neutros',
          is_public: true,
        });
        added++;
      }
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

  // No company yet — show setup
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
              <Input
                placeholder="Minha Loja de Tintas"
                value={companyName}
                onChange={e => handleCompanyNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL personalizada)</Label>
              <Input
                placeholder="minha-loja"
                value={companySlug}
                onChange={e => handleSlugChange(e.target.value)}
              />
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
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" /> Simulador
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/empresa/${company.slug}`}>
              <Eye className="w-4 h-4 mr-2" /> Página do Cliente
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
              {/* Logo */}
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

              {/* Colors */}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label>Cor primária</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={branding?.primary_color || '#1a8a7a'}
                      onChange={e => updateBranding({ primary_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={branding?.primary_color || '#1a8a7a'}
                      onChange={e => updateBranding({ primary_color: e.target.value })}
                      className="w-28 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor secundária</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={branding?.secondary_color || '#e8734a'}
                      onChange={e => updateBranding({ secondary_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={branding?.secondary_color || '#e8734a'}
                      onChange={e => updateBranding({ secondary_color: e.target.value })}
                      className="w-28 font-mono text-sm"
                    />
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
            {/* Add catalog */}
            <div className="flex gap-2">
              <Input
                placeholder="Nome do novo catálogo..."
                value={newCatalogName}
                onChange={e => setNewCatalogName(e.target.value)}
              />
              <Button onClick={handleAddCatalog} disabled={!newCatalogName}>
                <Plus className="w-4 h-4 mr-1" /> Criar
              </Button>
            </div>

            <Separator />

            {/* Catalog list */}
            {catalogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum catálogo criado ainda. Crie um acima para começar.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {catalogs.map(catalog => (
                  <button
                    key={catalog.id}
                    onClick={() => setActiveCatalogId(activeCatalogId === catalog.id ? null : catalog.id)}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      activeCatalogId === catalog.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PaintBucket className="w-4 h-4 text-primary" />
                        <span className="font-medium text-foreground">{catalog.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await deleteCatalog(catalog.id);
                          if (activeCatalogId === catalog.id) setActiveCatalogId(null);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Paint management for active catalog */}
            {activeCatalogId && (
              <div className="mt-4 space-y-4">
                <Separator />
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-semibold text-foreground">
                    Cores do Catálogo
                  </h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={paints.length === 0}>
                      <Download className="w-3 h-3 mr-1" /> CSV
                    </Button>
                    <label>
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <FileUp className="w-3 h-3 mr-1" /> Importar
                          <input
                            ref={csvInputRef}
                            type="file"
                            accept=".csv"
                            className="sr-only"
                            onChange={handleImportCSV}
                          />
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

                {/* Add paint form */}
                <PaintForm
                  onSubmit={handleAddPaint}
                  compact
                />

                {/* Paint list */}
                <PaintsList
                  paints={paints}
                  loading={loadingPaints}
                  onDelete={handleDeletePaint}
                  empty="Nenhuma cor neste catálogo. Adicione acima."
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
