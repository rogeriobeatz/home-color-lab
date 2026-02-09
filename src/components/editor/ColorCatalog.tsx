import { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { paintCatalog, PaintColor, brandLogos, categoryLabels } from '@/data/paintCatalog';

interface ColorCatalogProps {
  onColorSelect: (color: PaintColor) => void;
  selectedColorId?: string;
}

export function ColorCatalog({ onColorSelect, selectedColorId }: ColorCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredColors = useMemo(() => {
    return paintCatalog.filter(color => {
      const matchesSearch = 
        color.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        color.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesBrand = selectedBrand === 'all' || color.brand === selectedBrand;
      const matchesCategory = selectedCategory === 'all' || color.category === selectedCategory;
      
      return matchesSearch && matchesBrand && matchesCategory;
    });
  }, [searchQuery, selectedBrand, selectedCategory]);

  const brands = ['all', 'suvinil', 'coral', 'sherwin-williams'];
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

      {/* Brand filter */}
      <Tabs value={selectedBrand} onValueChange={setSelectedBrand} className="mb-4">
        <TabsList className="w-full grid grid-cols-4 h-auto">
          <TabsTrigger value="all" className="text-xs py-2">Todas</TabsTrigger>
          <TabsTrigger value="suvinil" className="text-xs py-2">Suvinil</TabsTrigger>
          <TabsTrigger value="coral" className="text-xs py-2">Coral</TabsTrigger>
          <TabsTrigger value="sherwin-williams" className="text-xs py-2">S-W</TabsTrigger>
        </TabsList>
      </Tabs>

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
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(color));
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => onColorSelect(color)}
              className={cn(
                "relative group rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 cursor-grab active:cursor-grabbing",
                selectedColorId === color.id && "ring-2 ring-primary ring-offset-2"
              )}
              title={`Arraste para a imagem ou clique para aplicar — ${color.name} (${color.code})`}
            >
              <div
                className="aspect-square"
                style={{ backgroundColor: color.hex }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-white text-xs font-medium truncate">{color.name}</p>
                  <p className="text-white/70 text-[10px]">{color.code}</p>
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
