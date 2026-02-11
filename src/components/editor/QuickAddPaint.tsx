import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PaintForm, PaintFormData } from '@/components/admin/PaintForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuickAddPaintProps {
  catalogId?: string;
  onPaintAdded?: () => void;
  disabled?: boolean;
}

export function QuickAddPaint({ catalogId, onPaintAdded, disabled = false }: QuickAddPaintProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleSubmit = async (data: PaintFormData) => {
    if (!catalogId) {
      toast({ title: 'Erro', description: 'Selecione um catálogo primeiro', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('paints').insert({
      catalog_id: catalogId,
      name: data.name,
      code: data.code,
      hex: data.hex,
      category: data.category,
      rgb: data.rgb || null,
      cmyk: data.cmyk || null,
      ral: data.ral || null,
      ncs: data.ncs || null,
      is_public: true,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Cor adicionada!' });
      setOpen(false);
      onPaintAdded?.();
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled || !catalogId}>
          <Plus className="w-4 h-4 mr-1" /> Nova Cor
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Adicionar Nova Cor</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <PaintForm onSubmit={handleSubmit} compact />
        </div>
      </SheetContent>
    </Sheet>
  );
}
