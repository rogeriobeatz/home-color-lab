import { Trash2, Eye, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Paint } from '@/hooks/useCompany';

interface PaintsListProps {
  paints: Paint[];
  loading?: boolean;
  onDelete: (paintId: string) => void;
  empty?: string;
}

export function PaintsList({ paints, loading = false, onDelete, empty = 'Nenhuma cor adicionada' }: PaintsListProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!`, description: text });
  };

  const categoryLabels: Record<string, string> = {
    neutros: 'Neutros',
    quentes: 'Quentes',
    frios: 'Frios',
    pasteis: 'Pastéis',
    vibrantes: 'Vibrantes',
  };

  return (
    <ScrollArea className="h-[500px] border border-border rounded-lg p-4">
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : paints.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{empty}</p>
      ) : (
        <div className="space-y-2">
          {paints.map(paint => (
            <div
              key={paint.id}
              className="p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border shrink-0 flex-shrink-0"
                  style={{ backgroundColor: paint.hex }}
                  title={paint.hex}
                />
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <p className="font-medium text-foreground text-sm">{paint.name}</p>
                    <p className="text-xs text-muted-foreground">{paint.code}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {paint.hex && (
                      <button
                        onClick={() => copyToClipboard(paint.hex, 'HEX')}
                        className="px-2 py-1 rounded bg-secondary/50 hover:bg-secondary text-xs font-mono text-secondary-foreground truncate text-center cursor-pointer transition-colors"
                        title="Clique para copiar"
                      >
                        {paint.hex}
                      </button>
                    )}
                    {paint.rgb && (
                      <button
                        onClick={() => copyToClipboard(paint.rgb!, 'RGB')}
                        className="px-2 py-1 rounded bg-secondary/50 hover:bg-secondary text-xs font-mono text-secondary-foreground truncate text-center cursor-pointer transition-colors"
                        title="Clique para copiar"
                      >
                        RGB
                      </button>
                    )}
                    {paint.cmyk && (
                      <button
                        onClick={() => copyToClipboard(paint.cmyk!, 'CMYK')}
                        className="px-2 py-1 rounded bg-secondary/50 hover:bg-secondary text-xs font-mono text-secondary-foreground truncate text-center cursor-pointer transition-colors"
                        title="Clique para copiar"
                      >
                        CMYK
                      </button>
                    )}
                    {paint.ral && (
                      <button
                        onClick={() => copyToClipboard(paint.ral!, 'RAL')}
                        className="px-2 py-1 rounded bg-secondary/50 hover:bg-secondary text-xs font-mono text-secondary-foreground truncate text-center cursor-pointer transition-colors"
                        title="Clique para copiar"
                      >
                        {paint.ral}
                      </button>
                    )}
                    {paint.ncs && (
                      <button
                        onClick={() => copyToClipboard(paint.ncs!, 'NCS')}
                        className="px-2 py-1 rounded bg-secondary/50 hover:bg-secondary text-xs font-mono text-secondary-foreground truncate text-center cursor-pointer transition-colors"
                        title="Clique para copiar"
                      >
                        {paint.ncs}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                      {categoryLabels[paint.category] || paint.category}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => onDelete(paint.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
