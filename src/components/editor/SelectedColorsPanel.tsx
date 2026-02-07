import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RoomElement } from '@/types/project';
import { brandLogos } from '@/data/paintCatalog';

interface SelectedColorsPanelProps {
  elements: RoomElement[];
}

export function SelectedColorsPanel({ elements }: SelectedColorsPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const elementsWithColors = elements.filter(el => el.color);

  const handleCopy = async (element: RoomElement) => {
    const text = `${element.colorName} - ${element.colorCode} (${element.colorBrand ? brandLogos[element.colorBrand] : ''})`;
    await navigator.clipboard.writeText(text);
    setCopiedId(element.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (elementsWithColors.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <p>Nenhuma cor selecionada ainda.</p>
        <p className="mt-1">Escolha um elemento e selecione uma cor do catálogo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground mb-3">Cores Selecionadas</h3>
      
      {elementsWithColors.map(element => (
        <div
          key={element.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
        >
          <div
            className="w-12 h-12 rounded-lg shadow-soft flex-shrink-0"
            style={{ backgroundColor: element.color }}
          />
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm truncate">{element.name}</p>
            <p className="text-xs text-muted-foreground truncate">{element.colorName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono bg-background px-1.5 py-0.5 rounded">
                {element.colorCode}
              </span>
              <span className="text-xs text-muted-foreground">
                {element.colorBrand && brandLogos[element.colorBrand]}
              </span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCopy(element)}
            className="flex-shrink-0"
          >
            {copiedId === element.id ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
