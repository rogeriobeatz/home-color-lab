import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface PaintFormData {
  name: string;
  code: string;
  hex: string;
  category: string;
  rgb?: string;
  cmyk?: string;
  ral?: string;
  ncs?: string;
}

interface PaintFormProps {
  onSubmit: (data: PaintFormData) => Promise<void>;
  categories?: string[];
  compact?: boolean;
}

export function PaintForm({ onSubmit, categories = ['neutros', 'quentes', 'frios', 'pasteis', 'vibrantes'], compact = false }: PaintFormProps) {
  const [form, setForm] = useState<PaintFormData>({
    name: '',
    code: '',
    hex: '#000000',
    category: 'neutros',
    rgb: '',
    cmyk: '',
    ral: '',
    ncs: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      setForm({
        name: '',
        code: '',
        hex: '#000000',
        category: 'neutros',
        rgb: '',
        cmyk: '',
        ral: '',
        ncs: '',
      });
      setShowAdvanced(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof PaintFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Nome da Cor</Label>
            <Input
              placeholder="Ex: Branco Neve"
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Código</Label>
            <Input
              placeholder="Ex: B001"
              value={form.code}
              onChange={e => updateField('code', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cor (HEX)</Label>
            <div className="flex gap-1">
              <input
                type="color"
                value={form.hex}
                onChange={e => updateField('hex', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
                disabled={isSubmitting}
              />
              <Input
                placeholder="#000000"
                value={form.hex}
                onChange={e => updateField('hex', e.target.value)}
                className="font-mono text-xs"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={form.category}
            onChange={e => updateField('category', e.target.value)}
            className="flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
          >
            {categories.map(cat => (
              <option key={cat} value={cat} className="capitalize">
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Ocultar' : 'Formatos'}
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.name || !form.code} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-border">
            <div className="space-y-1">
              <Label className="text-xs">RGB</Label>
              <Input
                placeholder="255, 255, 255"
                value={form.rgb}
                onChange={e => updateField('rgb', e.target.value)}
                className="text-xs"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CMYK</Label>
              <Input
                placeholder="0, 0, 0, 0"
                value={form.cmyk}
                onChange={e => updateField('cmyk', e.target.value)}
                className="text-xs"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">RAL</Label>
              <Input
                placeholder="RAL 9016"
                value={form.ral}
                onChange={e => updateField('ral', e.target.value)}
                className="text-xs"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">NCS</Label>
              <Input
                placeholder="NCS S 0300-N"
                value={form.ncs}
                onChange={e => updateField('ncs', e.target.value)}
                className="text-xs"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}
      </form>
    );
  }

  // Full layout
  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-card rounded-lg border border-border">
      <div className="space-y-4">
        <h3 className="font-display font-semibold text-foreground">Informações Básicas</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da Cor</Label>
            <Input
              placeholder="Ex: Branco Neve"
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label>Código</Label>
            <Input
              placeholder="Ex: B001"
              value={form.code}
              onChange={e => updateField('code', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <select
            value={form.category}
            onChange={e => updateField('category', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
          >
            {categories.map(cat => (
              <option key={cat} value={cat} className="capitalize">
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Cor (HEX)</Label>
          <div className="flex gap-3">
            <input
              type="color"
              value={form.hex}
              onChange={e => updateField('hex', e.target.value)}
              className="w-16 h-10 rounded cursor-pointer border-0"
              disabled={isSubmitting}
            />
            <Input
              placeholder="#000000"
              value={form.hex}
              onChange={e => updateField('hex', e.target.value)}
              className="font-mono flex-1"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">Formatos Profissionais</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="space-y-2">
              <Label>RGB (opcional)</Label>
              <Input
                placeholder="255, 255, 255"
                value={form.rgb}
                onChange={e => updateField('rgb', e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">Formato: R, G, B (0-255)</p>
            </div>
            <div className="space-y-2">
              <Label>CMYK (opcional)</Label>
              <Input
                placeholder="0, 0, 0, 0"
                value={form.cmyk}
                onChange={e => updateField('cmyk', e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">Formato: C, M, Y, K (0-100)</p>
            </div>
            <div className="space-y-2">
              <Label>RAL (opcional)</Label>
              <Input
                placeholder="RAL 9016"
                value={form.ral}
                onChange={e => updateField('ral', e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">Ex: RAL 9016, RAL 1026</p>
            </div>
            <div className="space-y-2">
              <Label>NCS (opcional)</Label>
              <Input
                placeholder="NCS S 0300-N"
                value={form.ncs}
                onChange={e => updateField('ncs', e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">Ex: NCS S 0300-N</p>
            </div>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || !form.name || !form.code}>
        {isSubmitting ? 'Adicionando...' : 'Adicionar Cor'}
      </Button>
    </form>
  );
}
