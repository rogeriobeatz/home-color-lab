import { useState, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

// Color conversion utilities
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - rr - k) / (1 - k)) * 100),
    m: Math.round(((1 - gg - k) / (1 - k)) * 100),
    y: Math.round(((1 - bb - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function cmykToRgb(c: number, m: number, y: number, k: number): { r: number; g: number; b: number } {
  const cc = c / 100, mm = m / 100, yy = y / 100, kk = k / 100;
  return {
    r: Math.round(255 * (1 - cc) * (1 - kk)),
    g: Math.round(255 * (1 - mm) * (1 - kk)),
    b: Math.round(255 * (1 - yy) * (1 - kk)),
  };
}

function parseRgbString(s: string): { r: number; g: number; b: number } | null {
  const parts = s.replace(/[^\d,]/g, '').split(',').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [r, g, b] = parts;
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) return null;
  return { r, g, b };
}

function parseCmykString(s: string): { c: number; m: number; y: number; k: number } | null {
  const parts = s.replace(/[^\d,]/g, '').split(',').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return null;
  const [c, m, y, k] = parts;
  if (c < 0 || c > 100 || m < 0 || m > 100 || y < 0 || y > 100 || k < 0 || k > 100) return null;
  return { c, m, y, k };
}

export function PaintForm({ onSubmit, categories = ['neutros', 'quentes', 'frios', 'pasteis', 'vibrantes'], compact = false }: PaintFormProps) {
  const [form, setForm] = useState<PaintFormData>({
    name: '', code: '', hex: '#000000', category: 'neutros',
    rgb: '0, 0, 0', cmyk: '0, 0, 0, 100', ral: '', ncs: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const syncFromHex = useCallback((hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return {};
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    return {
      rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
      cmyk: `${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`,
    };
  }, []);

  const handleHexChange = (hex: string) => {
    const synced = /^#[0-9A-Fa-f]{6}$/.test(hex) ? syncFromHex(hex) : {};
    setForm(prev => ({ ...prev, hex, ...synced }));
  };

  const handleColorPickerChange = (hex: string) => {
    const synced = syncFromHex(hex);
    setForm(prev => ({ ...prev, hex, ...synced }));
  };

  const handleRgbChange = (rgbStr: string) => {
    const parsed = parseRgbString(rgbStr);
    if (parsed) {
      const hex = rgbToHex(parsed.r, parsed.g, parsed.b);
      const cmyk = rgbToCmyk(parsed.r, parsed.g, parsed.b);
      setForm(prev => ({ ...prev, rgb: rgbStr, hex, cmyk: `${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}` }));
    } else {
      setForm(prev => ({ ...prev, rgb: rgbStr }));
    }
  };

  const handleCmykChange = (cmykStr: string) => {
    const parsed = parseCmykString(cmykStr);
    if (parsed) {
      const rgb = cmykToRgb(parsed.c, parsed.m, parsed.y, parsed.k);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setForm(prev => ({ ...prev, cmyk: cmykStr, hex, rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}` }));
    } else {
      setForm(prev => ({ ...prev, cmyk: cmykStr }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      const synced = syncFromHex('#000000');
      setForm({ name: '', code: '', hex: '#000000', category: 'neutros', ral: '', ncs: '', ...synced });
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
            <Input placeholder="Ex: Branco Neve" value={form.name} onChange={e => updateField('name', e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Código</Label>
            <Input placeholder="Ex: B001" value={form.code} onChange={e => updateField('code', e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cor (HEX)</Label>
            <div className="flex gap-1">
              <input type="color" value={form.hex} onChange={e => handleColorPickerChange(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" disabled={isSubmitting} />
              <Input placeholder="#000000" value={form.hex} onChange={e => handleHexChange(e.target.value)} className="font-mono text-xs" disabled={isSubmitting} />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <select value={form.category} onChange={e => updateField('category', e.target.value)} className="flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={isSubmitting}>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
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
              <Input placeholder="255, 255, 255" value={form.rgb} onChange={e => handleRgbChange(e.target.value)} className="text-xs" disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CMYK</Label>
              <Input placeholder="0, 0, 0, 0" value={form.cmyk} onChange={e => handleCmykChange(e.target.value)} className="text-xs" disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">RAL</Label>
              <Input placeholder="RAL 9016" value={form.ral} onChange={e => updateField('ral', e.target.value)} className="text-xs" disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">NCS</Label>
              <Input placeholder="NCS S 0300-N" value={form.ncs} onChange={e => updateField('ncs', e.target.value)} className="text-xs" disabled={isSubmitting} />
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
            <Input placeholder="Ex: Branco Neve" value={form.name} onChange={e => updateField('name', e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label>Código</Label>
            <Input placeholder="Ex: B001" value={form.code} onChange={e => updateField('code', e.target.value)} disabled={isSubmitting} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <select value={form.category} onChange={e => updateField('category', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={isSubmitting}>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Cor (HEX)</Label>
          <div className="flex gap-3">
            <input type="color" value={form.hex} onChange={e => handleColorPickerChange(e.target.value)} className="w-16 h-10 rounded cursor-pointer border-0" disabled={isSubmitting} />
            <Input placeholder="#000000" value={form.hex} onChange={e => handleHexChange(e.target.value)} className="font-mono flex-1" disabled={isSubmitting} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">Formatos Profissionais</h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="space-y-2">
              <Label>RGB</Label>
              <Input placeholder="255, 255, 255" value={form.rgb} onChange={e => handleRgbChange(e.target.value)} disabled={isSubmitting} />
              <p className="text-xs text-muted-foreground">Formato: R, G, B (0-255)</p>
            </div>
            <div className="space-y-2">
              <Label>CMYK</Label>
              <Input placeholder="0, 0, 0, 0" value={form.cmyk} onChange={e => handleCmykChange(e.target.value)} disabled={isSubmitting} />
              <p className="text-xs text-muted-foreground">Formato: C, M, Y, K (0-100)</p>
            </div>
            <div className="space-y-2">
              <Label>RAL</Label>
              <Input placeholder="RAL 9016" value={form.ral} onChange={e => updateField('ral', e.target.value)} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label>NCS</Label>
              <Input placeholder="NCS S 0300-N" value={form.ncs} onChange={e => updateField('ncs', e.target.value)} disabled={isSubmitting} />
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
