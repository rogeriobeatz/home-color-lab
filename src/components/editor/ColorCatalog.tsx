import { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { paintCatalog, PaintColor, brandLogos, categoryLabels } from '@/data/paintCatalog';
import type { CompanyPaint } from '@/pages/CompanyPage';
import { QuickAddPaint } from './QuickAddPaint';

interface ColorCatalogProps {
  onColorSelect: (color: PaintColor) => void;
  selectedColorId?: string;
  companyPaints?: CompanyPaint[];
  catalogId?: string;
  onPaintAdded?: () => void;
}

export function ColorCatalog({ onColorSelect, selectedColorId, companyPaints, catalogId, onPaintAdded }: ColorCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // If company paints are provided, use them instead of the default catalog
  const useCompanyMode = companyPaints && companyPaints.length > 0;

  const allColors: PaintColor[] = useMemo(() => {
    if (useCompanyMode) {
      return companyPaints!.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        hex: p.hex,
        brand: 'suvinil' as const, // default, not shown in company mode
        category: (p.category || 'neutros') as PaintColor['category'],
      }));
    }
    return paintCatalog;
  }, [companyPaints, useCompanyMode]);

  const filteredColors = useMemo(() => {
    return allColors.filter(color => {
      const matchesSearch = 
        color.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        color.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesBrand = useCompanyMode || selectedBrand === 'all' || color.brand === selectedBrand;
      const matchesCategory = selectedCategory === 'all' || color.category === selectedCategory;
      
      return matchesSearch && matchesBrand && matchesCategory;
    });
  }, [searchQuery, selectedBrand, selectedCategory, allColors, useCompanyMode]);

  const categories = ['all', 'neutros', 'quentes', 'frios', 'pasteis', 'vibrantes'];

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou código..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Brand filter - only show for default catalog */}
      {!useCompanyMode && (
        <Tabs value={selectedBrand} onValueChange={setSelectedBrand} className="mb-4">
          <TabsList className="w-full grid grid-cols-4 h-auto">
            <TabsTrigger value="all" className="text-xs py-2">Todas</TabsTrigger>
            <TabsTrigger value="suvinil" className="text-xs py-2">Suvinil</TabsTrigger>
            <TabsTrigger value="coral" className="text-xs py-2">Coral</TabsTrigger>
            <TabsTrigger value="sherwin-williams" className="text-xs py-2">S-W</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {category === 'all' ? 'Todas' : categoryLabels[category]}
          </button>
        ))}
      </div>

      {/* Color grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-3 gap-2 pr-4">
          {filteredColors.map(color => (
            <button
              key={color.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onColorSelect(color);
              }}
              type="button"
              className={cn(
                "relative group rounded-lg overflow-hidden transition-all duration-200 hover:scale-105",
                selectedColorId === color.id && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <div
                className="aspect-square"
                style={{ backgroundColor: color.hex }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-white text-xs font-medium truncate">{color.name}</p>
                  <p className="text-white/70 text-[10px]">{color.code}</p>
                  {color.ral && <p className="text-white/70 text-[10px]">RAL: {color.ral}</p>}
                  {color.ncs && <p className="text-white/70 text-[10px]">NCS: {color.ncs}</p>}
                </div>
              </div>
              {selectedColorId === color.id && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
        
        {filteredColors.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma cor encontrada
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
